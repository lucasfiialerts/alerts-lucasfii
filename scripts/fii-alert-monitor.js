#!/usr/bin/env node

/**
 * Script de Monitoramento de Alertas de FIIs
 * 
 * Este script monitora as cotações dos FIIs e envia alertas via WhatsApp
 * quando há variações significativas nos preços.
 * 
 * Como usar:
 * 1. npm run monitor:fii           - Executa uma vez
 * 2. npm run monitor:fii:watch     - Executa a cada 15 minutos
 * 3. MONITOR_TEST_MODE=true npm run monitor:fii - Modo de teste (sem enviar WhatsApp)
 */

const isTestMode = process.env.MONITOR_TEST_MODE === 'true';
const baseURL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

console.log('🚀 Iniciando Monitor de Alertas FII...');
console.log(`📍 URL base: ${baseURL}`);
console.log(`🧪 Modo teste: ${isTestMode ? 'SIM' : 'NÃO'}`);

async function checkAndSendAlerts() {
  try {
    console.log('\n⏰', new Date().toLocaleString('pt-BR'));
    console.log('🔍 Verificando alertas de FIIs...');

    if (isTestMode) {
      // Modo teste: apenas verificar alertas sem enviar
      const response = await fetch(`${baseURL}/api/fii/send-alerts`, {
        method: 'GET',
      });

      const result = await response.json();
      
      if (result.success) {
        console.log(`📊 Alertas encontrados: ${result.alertsFound}`);
        
        if (result.alertsFound > 0) {
          console.log('📋 Detalhes dos alertas:');
          result.alerts.forEach((alert, index) => {
            console.log(`  ${index + 1}. ${alert.ticker} - ${alert.name}`);
            console.log(`     Variação: ${alert.variation.toFixed(2)}%`);
            console.log(`     Preço: R$ ${alert.price.toFixed(2)}`);
            console.log(`     Usuário: ${alert.userId}`);
          });
        }
      } else {
        console.error('❌ Erro ao verificar alertas:', result.error);
      }
    } else {
      // Modo produção: enviar alertas
      const response = await fetch(`${baseURL}/api/fii/send-alerts`, {
        method: 'POST',
      });

      const result = await response.json();
      
      if (result.success) {
        console.log(`📊 Resultado: ${result.message}`);
        console.log(`📈 Alertas gerados: ${result.alertsGenerated || 0}`);
        console.log(`✅ Alertas enviados: ${result.alertsSent || 0}`);
        console.log(`❌ Alertas falharam: ${result.alertsFailed || 0}`);
      } else {
        console.error('❌ Erro ao processar alertas:', result.error);
      }
    }

  } catch (error) {
    console.error('❌ Erro no monitor de alertas:', error);
  }
}

// Função principal
async function main() {
  if (process.argv.includes('--watch')) {
    console.log('👀 Modo de monitoramento contínuo ativado');
    console.log('🔄 Verificando alertas a cada 15 minutos...');
    
    // Executa imediatamente
    await checkAndSendAlerts();
    
    // Depois executa a cada 15 minutos
    setInterval(checkAndSendAlerts, 15 * 60 * 1000);
  } else {
    console.log('⚡ Execução única');
    await checkAndSendAlerts();
    console.log('✅ Monitor concluído');
  }
}

// Executa se for chamado diretamente
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { checkAndSendAlerts };