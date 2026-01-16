#!/usr/bin/env node

/**
 * Script para testar alertas de Bitcoin
 * Monitora variações de preço e envia alertas via WhatsApp
 */

async function testBitcoinAlerts() {
  console.log('🚀 Testando sistema de alertas de Bitcoin...\n');

  try {
    // Simular dados do usuário (normalmente viria do banco)
    const userData = {
      id: 'mTqkl1psaUNhKnwZ3nEMAOkY7Y6EpLS2',
      email: 'alanrochaarg2001@gmail.com',
      whatsappNumber: '5521998579960',
      whatsappVerified: true,
      alertPreferencesBitcoin: true
    };

    console.log(`👤 Usuário: ${userData.email}`);
    console.log(`📱 WhatsApp: ${userData.whatsappNumber}`);
    console.log(`₿ Bitcoin Alerts: ${userData.alertPreferencesBitcoin ? 'ATIVADO' : 'DESATIVADO'}`);

    if (!userData.alertPreferencesBitcoin) {
      console.log('⚠️ Alertas de Bitcoin desativados para este usuário');
      return;
    }

    // Buscar preço atual do Bitcoin
    console.log('\n📊 Buscando preço atual do Bitcoin...');
    
    const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd,brl&include_24hr_change=true', {
      headers: {
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(10000)
    });

    if (!response.ok) {
      throw new Error(`Erro na API: ${response.status}`);
    }

    const data = await response.json();
    const bitcoin = data.bitcoin;
    
    console.log(`💰 Preço USD: $${bitcoin.usd.toLocaleString()}`);
    console.log(`💰 Preço BRL: R$${bitcoin.brl.toLocaleString()}`);
    console.log(`📈 Variação 24h: ${bitcoin.usd_24h_change?.toFixed(2)}%`);

    // Verificar se deve enviar alerta (variação > 4% ou < -4%)
    const variation = bitcoin.usd_24h_change || 0;
    const shouldAlert = Math.abs(variation) >= 4;

    console.log(`\n🎯 Deve enviar alerta: ${shouldAlert ? 'SIM' : 'NÃO'} (variação: ${variation.toFixed(2)}%)`);

    if (!shouldAlert) {
      console.log('⚠️ Variação insuficiente para alerta (limite: ±4%), mas enviando para teste...');
    }

    // Determinar tipo de variação
    const isPositive = variation > 0;
    const emoji = isPositive ? '📈' : '📉';
    const trend = isPositive ? 'SUBIU' : 'DESCEU';
    const color = isPositive ? 'VERDE' : 'VERMELHO';

    // Formatar mensagem do WhatsApp
    const message = `₿ *Bitcoin Alert - Variação Significativa*

${emoji} *O Bitcoin ${trend} ${Math.abs(variation).toFixed(2)}%*

💰 *Preço Atual:*
🇺🇸 USD: $${bitcoin.usd.toLocaleString()}
🇧🇷 BRL: R$${bitcoin.brl.toLocaleString()}

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

    console.log('\n📱 Mensagem formatada:');
    console.log('----------------------------------------');
    console.log(message);
    console.log('----------------------------------------');

    console.log('\n📤 Enviando via ULTRAMSG...');

    // Enviar via ULTRAMSG
    const sendResponse = await fetch(`https://api.ultramsg.com/${process.env.ULTRAMSG_INSTANCE || 'instance150259'}/messages/chat?token=${process.env.ULTRAMSG_TOKEN || 'nvqi9mrsetwaozo7'}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: userData.whatsappNumber,
        body: message
      })
    });

    console.log(`📡 Status ULTRAMSG: ${sendResponse.status}`);

    if (sendResponse.ok) {
      const result = await sendResponse.json();
      console.log('✅ ALERTA BITCOIN ENVIADO COM SUCESSO!');
      console.log(`📱 Para: ${userData.whatsappNumber}`);
      console.log(`👤 Usuário: ${userData.email}`);
      console.log(`🆔 Message ID: ${result.id || 'N/A'}`);
      console.log(`📋 Sent: ${result.sent || 'N/A'}`);
      
      // Log do alerta (simular inserção no banco)
      console.log('\n📝 Log do alerta (seria inserido no banco):');
      console.log(`- Bitcoin price: $${bitcoin.usd}`);
      console.log(`- Variation: ${variation.toFixed(2)}%`);
      console.log(`- Alert type: ${trend}`);
      console.log(`- Sent at: ${new Date().toISOString()}`);
      
    } else {
      const error = await sendResponse.text();
      console.log('❌ Erro ULTRAMSG:', error);
    }

  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  testBitcoinAlerts();
}

module.exports = { testBitcoinAlerts };