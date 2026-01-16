#!/usr/bin/env node

/**
 * Script para enviar alertas de Bitcoin para usuários reais
 * Consulta o banco de dados e envia alertas via WhatsApp
 */

async function sendRealBitcoinAlerts() {
  console.log('🚀 Enviando alertas de Bitcoin para usuários reais...\n');

  try {
    // Simular dados do usuário real do banco (normalmente viria de uma query SQL)
    const realUsers = [
      {
        id: 'mTqkl1psaUNhKnwZ3nEMAOkY7Y6EpLS2',
        email: 'alanrochaarg2001@gmail.com',
        whatsappNumber: '5521998579960',
        whatsappVerified: true,
        alertPreferencesBitcoin: true
      }
    ];

    console.log(`👥 Usuários com Bitcoin alerts ativados: ${realUsers.length}`);

    // Verificar cada usuário
    for (const user of realUsers) {
      console.log(`\n👤 Processando: ${user.email}`);
      console.log(`📱 WhatsApp: ${user.whatsappNumber}`);
      console.log(`✅ Verificado: ${user.whatsappVerified}`);
      console.log(`₿ Bitcoin Alerts: ${user.alertPreferencesBitcoin}`);

      if (!user.alertPreferencesBitcoin) {
        console.log('   ⚠️ Alertas Bitcoin desativados - pulando...');
        continue;
      }

      if (!user.whatsappVerified || !user.whatsappNumber) {
        console.log('   ⚠️ WhatsApp não verificado - pulando...');
        continue;
      }

      // Buscar preço atual do Bitcoin
      console.log('   📊 Buscando preço do Bitcoin...');
      
      const controller = new AbortController();
      setTimeout(() => controller.abort(), 10000);

      const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd,brl&include_24hr_change=true', {
        headers: {
          'Accept': 'application/json',
        },
        signal: controller.signal
      });

      if (!response.ok) {
        console.log(`   ❌ Erro na API: ${response.status}`);
        continue;
      }

      const data = await response.json();
      const bitcoin = data.bitcoin;
      const variation = bitcoin.usd_24h_change || 0;

      console.log(`   💰 Preço: $${bitcoin.usd.toLocaleString()}`);
      console.log(`   📈 Variação 24h: ${variation.toFixed(2)}%`);

      // Verificar se deve enviar alerta (sempre enviar para teste, mas mostrar se seria enviado)
      const shouldAlert = Math.abs(variation) >= 4;
      console.log(`   🎯 Enviaria alerta: ${shouldAlert ? 'SIM' : 'NÃO'} (limite: ±4%)`);

      // Para este teste, vamos enviar sempre
      console.log('   📤 Enviando alerta de teste...');

      // Determinar tipo de variação
      const isPositive = variation > 0;
      const emoji = isPositive ? '📈' : '📉';
      const trend = isPositive ? 'SUBIU' : 'DESCEU';
      const color = isPositive ? 'VERDE' : 'VERMELHO';

      // Formatar mensagem
      const message = `₿ *Bitcoin Alert${shouldAlert ? '' : ' (TESTE)'}*

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

${shouldAlert ? '_Alerta automático - Variação significativa detectada_' : '_Alerta de teste - Sistema funcionando_'} ₿`;

      console.log('   📱 Enviando via ULTRAMSG...');

      // Enviar via ULTRAMSG
      const sendResponse = await fetch(`https://api.ultramsg.com/${process.env.ULTRAMSG_INSTANCE || 'instance150259'}/messages/chat?token=${process.env.ULTRAMSG_TOKEN || 'nvqi9mrsetwaozo7'}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: user.whatsappNumber,
          body: message
        })
      });

      console.log(`   📡 Status: ${sendResponse.status}`);

      if (sendResponse.ok) {
        const result = await sendResponse.json();
        console.log('   ✅ ENVIADO COM SUCESSO!');
        console.log(`   🆔 Message ID: ${result.id || 'N/A'}`);
        console.log(`   📋 Sent: ${result.sent || 'N/A'}`);
      } else {
        const error = await sendResponse.text();
        console.log(`   ❌ Erro: ${error}`);
      }

      // Delay entre usuários
      if (realUsers.length > 1) {
        console.log('   ⏳ Aguardando 2s antes do próximo usuário...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    console.log('\n✅ Processamento concluído!');

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar
sendRealBitcoinAlerts();