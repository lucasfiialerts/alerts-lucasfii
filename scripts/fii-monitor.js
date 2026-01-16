#!/usr/bin/env node

/**
 * Script de Monitoramento Contínuo de FII
 * 
 * Executa verificações periódicas de novos relatórios
 * e envia notificações WhatsApp automaticamente
 * 
 * Uso:
 * node scripts/fii-monitor.js
 * 
 * Configuração via variáveis de ambiente:
 * MONITOR_INTERVAL_MINUTES=60 (padrão: 60 minutos)
 * MONITOR_MAX_FUNDS=100 (padrão: 100 fundos)
 * MONITOR_TEST_MODE=false (padrão: false)
 * MONITOR_WEBHOOK_URL=http://localhost:3000 (padrão)
 */

const https = require('https');
const http = require('http');

// Configurações do script
const CONFIG = {
  INTERVAL_MINUTES: parseInt(process.env.MONITOR_INTERVAL_MINUTES || '60'),
  MAX_FUNDS: parseInt(process.env.MONITOR_MAX_FUNDS || '100'),
  TEST_MODE: process.env.MONITOR_TEST_MODE === 'true',
  WEBHOOK_URL: process.env.MONITOR_WEBHOOK_URL || 'http://localhost:3000',
  MAX_RETRIES: 3,
  RETRY_DELAY: 5000, // 5 segundos
};

console.log(`
🚀 INICIANDO MONITOR DE FII - LucasFIIAlerts
=============================================

⚙️  Configuração:
   • Intervalo: ${CONFIG.INTERVAL_MINUTES} minutos
   • Máx. Fundos: ${CONFIG.MAX_FUNDS}
   • Modo Teste: ${CONFIG.TEST_MODE}
   • URL Base: ${CONFIG.WEBHOOK_URL}

🔄 O script vai verificar novos relatórios a cada ${CONFIG.INTERVAL_MINUTES} minutos...
🛑 Para parar: Ctrl+C

`);

// Variáveis de controle
let isRunning = false;
let nextCheckTime = null;
let totalChecks = 0;
let totalNotificationsSent = 0;
let lastError = null;

/**
 * Função para fazer requisições HTTP/HTTPS
 */
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const lib = isHttps ? https : http;
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'LucasFIIAlerts-Monitor/1.0',
        ...options.headers
      }
    };

    const req = lib.request(requestOptions, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            status: res.statusCode,
            data: jsonData,
            success: res.statusCode >= 200 && res.statusCode < 300
          });
        } catch (parseError) {
          resolve({
            status: res.statusCode,
            data: data,
            success: false,
            error: 'Invalid JSON response'
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }

    req.end();
  });
}

/**
 * Executa uma verificação de novos relatórios
 */
async function checkForNewReports() {
  if (isRunning) {
    console.log('⚠️  Verificação anterior ainda em andamento, pulando...');
    return;
  }

  isRunning = true;
  totalChecks++;
  
  const timestamp = new Date().toLocaleString('pt-BR');
  console.log(`\n🔍 [${timestamp}] Iniciando verificação #${totalChecks}...`);

  try {
    // Chamar a API de monitoramento
    const response = await makeRequest(`${CONFIG.WEBHOOK_URL}/api/fii/monitor-follows`, {
      method: 'POST',
      body: {
        checkLastHours: CONFIG.INTERVAL_MINUTES * 2, // Margem de segurança
        maxFundsToCheck: CONFIG.MAX_FUNDS,
        sendNotifications: true,
        testMode: CONFIG.TEST_MODE
      }
    });

    if (!response.success) {
      throw new Error(`API retornou erro: ${response.status} - ${JSON.stringify(response.data)}`);
    }

    const result = response.data;
    
    // Log dos resultados
    console.log(`📊 Resultados da verificação:`);
    console.log(`   • Tickers verificados: ${result.data?.monitoring?.tickersChecked || 0}`);
    console.log(`   • Usuários com follows: ${result.data?.monitoring?.usersWithFollows || 0}`);
    console.log(`   • Novos relatórios: ${result.data?.monitoring?.newReportsFound || 0}`);
    console.log(`   • Notificações enviadas: ${result.data?.notifications?.sent || 0}`);
    console.log(`   • Falhas: ${result.data?.notifications?.failed || 0}`);

    // Atualizar estatísticas globais
    totalNotificationsSent += (result.data?.notifications?.sent || 0);

    // Log de novos relatórios encontrados
    if (result.data?.newReports && result.data.newReports.length > 0) {
      console.log(`\n📋 Novos relatórios detectados:`);
      result.data.newReports.forEach(report => {
        console.log(`   📄 ${report.ticker} - ${report.fundName}`);
        console.log(`      Data: ${report.reportDate}`);
        console.log(`      PDF: ${report.pdfUrl.substring(0, 50)}...`);
      });
    }

    // Log de notificações
    if (result.data?.notifications?.results && result.data.notifications.results.length > 0) {
      console.log(`\n📱 Notificações WhatsApp:`);
      result.data.notifications.results.forEach(notification => {
        const statusIcon = notification.status === 'sent' ? '✅' : 
                          notification.status === 'failed' ? '❌' : '🧪';
        console.log(`   ${statusIcon} ${notification.ticker} → ${notification.userPhone}`);
      });
    }

    lastError = null;
    console.log(`✅ Verificação #${totalChecks} concluída com sucesso`);

  } catch (error) {
    lastError = error.message;
    console.error(`❌ Erro na verificação #${totalChecks}:`, error.message);
    
    // Log mais detalhado em caso de erro
    if (error.code) {
      console.error(`   Código: ${error.code}`);
    }
  } finally {
    isRunning = false;
    
    // Calcular próxima verificação
    nextCheckTime = new Date(Date.now() + CONFIG.INTERVAL_MINUTES * 60 * 1000);
    console.log(`⏰ Próxima verificação: ${nextCheckTime.toLocaleString('pt-BR')}`);
  }
}

/**
 * Função para retry com backoff exponencial
 */
async function retryableCheck() {
  for (let attempt = 1; attempt <= CONFIG.MAX_RETRIES; attempt++) {
    try {
      await checkForNewReports();
      return; // Sucesso, sair do loop
    } catch (error) {
      console.error(`❌ Tentativa ${attempt}/${CONFIG.MAX_RETRIES} falhou:`, error.message);
      
      if (attempt < CONFIG.MAX_RETRIES) {
        const delay = CONFIG.RETRY_DELAY * Math.pow(2, attempt - 1);
        console.log(`⏳ Aguardando ${delay}ms antes da próxima tentativa...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        console.error(`🚫 Todas as tentativas falharam. Aguardando próximo ciclo.`);
      }
    }
  }
}

/**
 * Exibe estatísticas do monitor
 */
function showStats() {
  const uptime = process.uptime();
  const uptimeHours = Math.floor(uptime / 3600);
  const uptimeMinutes = Math.floor((uptime % 3600) / 60);
  
  console.log(`\n📊 ESTATÍSTICAS DO MONITOR`);
  console.log(`========================`);
  console.log(`⏱️  Tempo rodando: ${uptimeHours}h ${uptimeMinutes}m`);
  console.log(`🔍 Total de verificações: ${totalChecks}`);
  console.log(`📱 Total de notificações: ${totalNotificationsSent}`);
  console.log(`⏰ Próxima verificação: ${nextCheckTime ? nextCheckTime.toLocaleString('pt-BR') : 'N/A'}`);
  console.log(`🚦 Status: ${isRunning ? 'Verificando...' : 'Aguardando'}`);
  console.log(`❌ Último erro: ${lastError || 'Nenhum'}`);
  console.log(`========================\n`);
}

/**
 * Handler para interrupção do processo
 */
function handleExit() {
  console.log(`\n🛑 Parando monitor...`);
  showStats();
  console.log(`👋 Monitor de FII finalizado. Até logo!`);
  process.exit(0);
}

// Configurar handlers de saída
process.on('SIGINT', handleExit);
process.on('SIGTERM', handleExit);
process.on('SIGQUIT', handleExit);

// Configurar handler para mostrar estatísticas (SIGUSR1)
if (process.platform !== 'win32') {
  process.on('SIGUSR1', showStats);
  console.log(`💡 Dica: Execute 'kill -USR1 ${process.pid}' para ver estatísticas`);
}

// Verificação inicial (após 10 segundos)
console.log(`⏳ Primeira verificação em 10 segundos...`);
setTimeout(async () => {
  console.log(`🚀 Executando primeira verificação...`);
  await retryableCheck();
  
  // Agendar verificações periódicas
  setInterval(retryableCheck, CONFIG.INTERVAL_MINUTES * 60 * 1000);
  
}, 10000);

// Mostrar estatísticas a cada 30 minutos
setInterval(showStats, 30 * 60 * 1000);

// Keepalive - evitar que o processo seja encerrado
setInterval(() => {
  // Apenas um ping silencioso para manter o processo ativo
}, 60000);

console.log(`✅ Monitor iniciado! PID: ${process.pid}`);
console.log(`📝 Logs serão exibidos aqui em tempo real...`);
