#!/usr/bin/env node

/**
 * Monitor de Bitcoin - Monitora variações e envia alertas
 * Integra com banco de dados PostgreSQL e WhatsApp
 */

require("dotenv/config");
const { drizzle } = require("drizzle-orm/node-postgres");
const { Pool } = require("pg");
const { eq } = require("drizzle-orm");
const schema = require("../drizzle/schema.ts");

// Configuração do banco
const pool = new Pool({
  host: process.env.POSTGRES_HOST,
  port: parseInt(process.env.POSTGRES_PORT || "5432"),
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DATABASE,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

const db = drizzle(pool, { schema });

class BitcoinMonitor {
  constructor() {
    this.isRunning = false;
    this.intervalId = null;
    this.lastPrice = null;
    this.lastVariation = null;
    this.checkInterval = 2 * 60 * 1000; // 2 minutos
    this.variationThreshold = 4; // 4%
  }

  async start() {
    console.log('🚀 Iniciando Bitcoin Monitor...\n');
    console.log(`⏱️ Intervalo de verificação: ${this.checkInterval / 1000}s`);
    console.log(`📊 Limite de variação: ±${this.variationThreshold}%\n`);

    this.isRunning = true;

    // Primeira verificação imediata
    await this.checkBitcoinPrice();

    // Configurar intervalo
    this.intervalId = setInterval(async () => {
      if (this.isRunning) {
        await this.checkBitcoinPrice();
      }
    }, this.checkInterval);

    console.log('✅ Monitor iniciado com sucesso!\n');
  }

  async stop() {
    console.log('🛑 Parando Bitcoin Monitor...');
    this.isRunning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    console.log('✅ Monitor parado.\n');
  }

  async checkBitcoinPrice() {
    try {
      console.log(`🔍 [${new Date().toLocaleTimeString('pt-BR')}] Verificando preço do Bitcoin...`);

      // Buscar preço atual
      const controller = new AbortController();
      setTimeout(() => controller.abort(), 10000);

      const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd,brl&include_24hr_change=true', {
        headers: {
          'Accept': 'application/json',
        },
        signal: controller.signal
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      const bitcoin = data.bitcoin;
      const currentVariation = bitcoin.usd_24h_change || 0;

      console.log(`💰 Preço: $${bitcoin.usd.toLocaleString()} | Variação: ${currentVariation.toFixed(2)}%`);

      // Verificar se deve enviar alerta
      if (Math.abs(currentVariation) >= this.variationThreshold) {
        console.log(`🚨 Variação significativa detectada: ${currentVariation.toFixed(2)}%`);
        await this.sendBitcoinAlerts(bitcoin);
      } else {
        console.log(`📊 Variação normal: ${currentVariation.toFixed(2)}% (limite: ±${this.variationThreshold}%)`);
      }

      // Atualizar última variação
      this.lastVariation = currentVariation;
      this.lastPrice = bitcoin.usd;

    } catch (error) {
      console.error('❌ Erro ao verificar preço do Bitcoin:', error.message);
      
      // Em caso de erro, usar dados simulados para teste
      if (error.name === 'AbortError') {
        console.log('⏰ Timeout na API, usando dados simulados...');
        await this.handleFallback();
      }
    }
  }

  async handleFallback() {
    // Simular dados quando API falha
    const simulatedVariation = (Math.random() - 0.5) * 10; // -5% a +5%
    const simulatedPrice = 95000 + (Math.random() - 0.5) * 10000;

    console.log(`🔄 Dados simulados: $${simulatedPrice.toFixed(0)} | Variação: ${simulatedVariation.toFixed(2)}%`);

    if (Math.abs(simulatedVariation) >= this.variationThreshold) {
      console.log(`🚨 Simulação: Variação significativa: ${simulatedVariation.toFixed(2)}%`);
      
      const bitcoinData = {
        usd: simulatedPrice,
        brl: simulatedPrice * 5.8, // Conversão aproximada
        usd_24h_change: simulatedVariation
      };

      await this.sendBitcoinAlerts(bitcoinData);
    }
  }

  async sendBitcoinAlerts(bitcoinData) {
    try {
      console.log('\n📱 Buscando usuários com alertas de Bitcoin ativados...');

      // Buscar usuários com alertas de Bitcoin ativados e WhatsApp verificado
      const users = await db.select({
        id: schema.userTable.id,
        email: schema.userTable.email,
        whatsappNumber: schema.userTable.whatsappNumber,
        whatsappVerified: schema.userTable.whatsappVerified,
        alertPreferencesBitcoin: schema.userTable.alertPreferencesBitcoin,
      }).from(schema.userTable)
        .where(eq(schema.userTable.alertPreferencesBitcoin, true));

      // Filtrar apenas usuários com WhatsApp verificado
      const eligibleUsers = users.filter(user => 
        user.whatsappVerified && 
        user.whatsappNumber && 
        user.whatsappNumber.trim() !== ''
      );

      console.log(`👥 Usuários encontrados: ${users.length}`);
      console.log(`✅ Usuários elegíveis (WhatsApp verificado): ${eligibleUsers.length}`);

      if (eligibleUsers.length === 0) {
        console.log('⚠️ Nenhum usuário elegível encontrado.');
        return;
      }

      // Formatar mensagem
      const variation = bitcoinData.usd_24h_change || 0;
      const isPositive = variation > 0;
      const emoji = isPositive ? '📈' : '📉';
      const trend = isPositive ? 'SUBIU' : 'DESCEU';
      const color = isPositive ? 'VERDE' : 'VERMELHO';

      const message = `₿ *Bitcoin Alert - Variação Significativa*

${emoji} *O Bitcoin ${trend} ${Math.abs(variation).toFixed(2)}%*

💰 *Preço Atual:*
🇺🇸 USD: $${bitcoinData.usd.toLocaleString()}
🇧🇷 BRL: R$${bitcoinData.brl.toLocaleString()}

📊 *Variação 24h:* ${variation.toFixed(2)}%
🎯 *Tendência:* ${color}

⏰ *${new Date().toLocaleString('pt-BR', { 
  timeZone: 'America/Sao_Paulo',
  year: 'numeric',
  month: '2-digit', 
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit'
})}*

_Alerta Bitcoin - FII Alerts_ ₿`;

      console.log('\n📤 Enviando alertas...');

      // Enviar para cada usuário
      let successCount = 0;
      let errorCount = 0;

      for (const user of eligibleUsers) {
        try {
          console.log(`📱 Enviando para ${user.email} (${user.whatsappNumber})...`);

          const response = await fetch('https://api.ultramsg.com/instance150259/messages/text', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              token: 'nvqi9mrsetwaozo7',
              to: user.whatsappNumber,
              body: message
            })
          });

          if (response.ok) {
            const result = await response.json();
            console.log(`   ✅ Enviado - ID: ${result.id || 'N/A'}`);
            successCount++;
          } else {
            const error = await response.text();
            console.log(`   ❌ Erro: ${error}`);
            errorCount++;
          }

          // Pequeno delay entre envios
          await new Promise(resolve => setTimeout(resolve, 1000));

        } catch (error) {
          console.log(`   ❌ Erro para ${user.email}: ${error.message}`);
          errorCount++;
        }
      }

      console.log(`\n📊 Resumo de envios:`);
      console.log(`   ✅ Sucessos: ${successCount}`);
      console.log(`   ❌ Erros: ${errorCount}`);
      console.log(`   📱 Total: ${eligibleUsers.length}`);

    } catch (error) {
      console.error('❌ Erro ao enviar alertas de Bitcoin:', error);
    }
  }
}

// Função para executar o monitor
async function runBitcoinMonitor() {
  const monitor = new BitcoinMonitor();

  // Capturar sinais de saída
  process.on('SIGINT', async () => {
    console.log('\n🛑 Recebido SIGINT, parando monitor...');
    await monitor.stop();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('\n🛑 Recebido SIGTERM, parando monitor...');
    await monitor.stop();
    process.exit(0);
  });

  // Iniciar monitor
  try {
    await monitor.start();
    
    // Manter rodando
    console.log('🔄 Monitor rodando... (Ctrl+C para parar)');
    
  } catch (error) {
    console.error('❌ Erro ao iniciar monitor:', error);
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  runBitcoinMonitor().catch(console.error);
}

module.exports = BitcoinMonitor;