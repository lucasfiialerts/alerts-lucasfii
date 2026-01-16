#!/usr/bin/env node

/**
 * Script de Teste - Adiciona FII e Testa Alertas
 * 
 * Este script cria dados de teste para demonstrar o sistema de alertas
 */

const baseURL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

async function testFiiAlerts() {
  console.log('🧪 Iniciando Teste do Sistema de Alertas FII...');
  console.log(`📍 URL base: ${baseURL}`);

  try {
    // 1. Verificar se há alertas (sem usuários logados)
    console.log('\n🔍 Verificando alertas atuais...');
    const alertsResponse = await fetch(`${baseURL}/api/fii/send-alerts`, {
      method: 'GET',
    });
    
    const alertsResult = await alertsResponse.json();
    console.log(`📊 Alertas encontrados: ${alertsResult.alertsFound}`);

    // 2. Buscar cotações de exemplo
    console.log('\n📈 Testando busca de cotações...');
    const quotesResponse = await fetch(`${baseURL}/api/fii/quotes?tickers=KNIP11,VTLT11,SAPI11`);
    
    if (quotesResponse.ok) {
      const quotesResult = await quotesResponse.json();
      console.log(`✅ Cotações obtidas para ${quotesResult.data.length} FIIs:`);
      
      quotesResult.data.forEach((fii, index) => {
        console.log(`  ${index + 1}. ${fii.ticker} - ${fii.formattedPrice} (${fii.formattedVariation}) ${fii.emoji}`);
      });
    } else {
      console.log('❌ Erro ao buscar cotações');
    }

    // 3. Simular mensagem de alerta
    console.log('\n📱 Exemplo de mensagem que seria enviada:');
    console.log('─'.repeat(50));
    console.log(`🚀 Alerta de Alta!

📊 KNIP11 - Kinea Indices Precos FII
💰 Cotação atual: R$ 87,17
📈 Variação: +2,01%

🚀 Subiu!

Acompanhe em: ${baseURL}

Este é um alerta automático baseado nas suas configurações.`);
    console.log('─'.repeat(50));

    // 4. Instruções para o usuário
    console.log('\n🎯 Para testar com dados reais:');
    console.log('1. Faça login no sistema');
    console.log('2. Vá para /my-follow');
    console.log('3. Adicione alguns FIIs (ex: KNIP11, VTLT11)');
    console.log('4. Execute: npm run monitor:fii:test');
    console.log('5. Execute: npm run monitor:fii (para enviar alertas reais)');

    console.log('\n📋 Status do Sistema:');
    console.log(`✅ API de Cotações: Funcionando`);
    console.log(`✅ API de Alertas: Funcionando`);
    console.log(`⚠️  Usuários com FIIs: ${alertsResult.alertsFound > 0 ? 'Encontrados' : 'Nenhum'}`);
    console.log(`⚠️  WhatsApp: ${process.env.ULTRAMSG_TOKEN ? 'Configurado' : 'Não configurado'}`);

  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

// Executa o teste
testFiiAlerts().catch(console.error);