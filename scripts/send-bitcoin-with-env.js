#!/usr/bin/env node

/**
 * Script para enviar alertas de Bitcoin usando credenciais do .env
 */

require('dotenv').config();

async function sendBitcoinAlertWithEnv() {
  console.log('🚀 Enviando alerta Bitcoin com credenciais do .env...\n');

  try {
    // Verificar credenciais disponíveis
    console.log('🔍 Verificando credenciais:');
    console.log('ZAPI_TOKEN:', !!process.env.ZAPI_TOKEN ? 'Configurado' : 'Não configurado');
    console.log('ZAPI_INSTANCE:', !!process.env.ZAPI_INSTANCE ? 'Configurado' : 'Não configurado');
    console.log('ULTRAMSG_TOKEN:', !!process.env.ULTRAMSG_TOKEN ? 'Configurado' : 'Não configurado');
    console.log('ULTRAMSG_INSTANCE:', !!process.env.ULTRAMSG_INSTANCE ? 'Configurado' : 'Não configurado');

    const whatsappNumber = '5521998579960';

    // Buscar preço do Bitcoin
    console.log('\n📊 Buscando preço atual do Bitcoin...');
    
    const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd,brl&include_24hr_change=true', {
      signal: AbortSignal.timeout(10000)
    });

    const data = await response.json();
    const bitcoin = data.bitcoin;
    const variation = bitcoin.usd_24h_change || 0;

    console.log(`💰 Preço: $${bitcoin.usd.toLocaleString()}`);
    console.log(`📈 Variação: ${variation.toFixed(2)}%`);

    // Formatar mensagem
    const isPositive = variation > 0;
    const emoji = isPositive ? '📈' : '📉';
    const trend = isPositive ? 'SUBIU' : 'DESCEU';

    const message = `₿ *Bitcoin Alert - Sistema Funcionando*

${emoji} *O Bitcoin ${trend} ${Math.abs(variation).toFixed(2)}%*

💰 *Preço Atual:*
🇺🇸 USD: $${bitcoin.usd.toLocaleString()}
🇧🇷 BRL: R$${bitcoin.brl.toLocaleString()}

📊 *Variação 24h:* ${variation.toFixed(2)}%

⏰ *${new Date().toLocaleString('pt-BR')}*

_Teste de funcionamento - FII Alerts_ ✅`;

    console.log('\n📱 Mensagem:');
    console.log('----------------------------------------');
    console.log(message);
    console.log('----------------------------------------\n');

    // Tentar Z-API primeiro
    if (process.env.ZAPI_TOKEN && process.env.ZAPI_INSTANCE) {
      console.log('📤 Tentando enviar via Z-API...');
      
      const zapiUrl = `https://api.z-api.io/instances/${process.env.ZAPI_INSTANCE}/token/${process.env.ZAPI_TOKEN}/send-text`;
      
      const zapiResponse = await fetch(zapiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: whatsappNumber,
          message: message
        })
      });

      console.log(`📊 Status Z-API: ${zapiResponse.status}`);
      
      if (zapiResponse.ok) {
        const zapiResult = await zapiResponse.json();
        console.log('✅ ENVIADO VIA Z-API!');
        console.log('Resultado:', JSON.stringify(zapiResult, null, 2));
        return;
      } else {
        const zapiError = await zapiResponse.text();
        console.log('❌ Erro Z-API:', zapiError);
      }
    }

    // Tentar ULTRAMSG
    if (process.env.ULTRAMSG_TOKEN && process.env.ULTRAMSG_INSTANCE) {
      console.log('📤 Tentando enviar via ULTRAMSG...');
      
      const ultraUrl = `https://api.ultramsg.com/${process.env.ULTRAMSG_INSTANCE}/messages/chat?token=${process.env.ULTRAMSG_TOKEN}`;
      
      const ultraResponse = await fetch(ultraUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: whatsappNumber,
          body: message
        })
      });

      console.log(`📊 Status ULTRAMSG: ${ultraResponse.status}`);
      
      if (ultraResponse.ok) {
        const ultraResult = await ultraResponse.json();
        console.log('✅ ENVIADO VIA ULTRAMSG!');
        console.log('Resultado:', JSON.stringify(ultraResult, null, 2));
      } else {
        const ultraError = await ultraResponse.text();
        console.log('❌ Erro ULTRAMSG:', ultraError);
      }
    }

    if (!process.env.ZAPI_TOKEN && !process.env.ULTRAMSG_TOKEN) {
      console.log('❌ Nenhuma credencial de WhatsApp configurada no .env');
    }

  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

sendBitcoinAlertWithEnv();