#!/usr/bin/env node

/**
 * Script para enviar alertas Bitcoin via API Next.js
 * Envia apenas para usuários com alertPreferencesBitcoin = true
 */

async function sendBitcoinAlertsViaAPI() {
  console.log('🚀 Enviando alertas Bitcoin via API Next.js...\n');

  try {
    // Para este exemplo, vou simular a consulta de usuários
    // Em produção, você criaria uma API endpoint para buscar usuários com Bitcoin ativo
    console.log('👤 Simulando consulta de usuários com Bitcoin ativo...');
    
    // Simular usuário com Bitcoin ativo (normalmente viria de uma API)
    const usersWithBitcoin = [
      {
        id: 'mTqkl1psaUNhKnwZ3nEMAOkY7Y6EpLS2',
        email: 'alanrochaarg2001@gmail.com',
        whatsappNumber: '5521998579960',
        whatsappVerified: true,
        alertPreferencesBitcoin: true
      }
    ];

    console.log(`📊 Usuários encontrados: ${usersWithBitcoin.length}`);

    // Verificar se há usuários elegíveis
    const eligibleUsers = usersWithBitcoin.filter(user => 
      user.alertPreferencesBitcoin && 
      user.whatsappVerified && 
      user.whatsappNumber
    );

    console.log(`✅ Usuários elegíveis: ${eligibleUsers.length}`);

    if (eligibleUsers.length === 0) {
      console.log('⚠️ Nenhum usuário elegível encontrado');
      return;
    }

    // Listar usuários
    eligibleUsers.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.email} - Bitcoin: ✅`);
    });

    // Buscar dados do Bitcoin
    console.log('\n📈 Verificando variação do Bitcoin...');
    
    const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd,brl&include_24hr_change=true', {
      signal: AbortSignal.timeout(10000)
    });

    const data = await response.json();
    const bitcoin = data.bitcoin;
    const variation = bitcoin.usd_24h_change || 0;

    console.log(`💰 Preço: $${bitcoin.usd.toLocaleString()}`);
    console.log(`📊 Variação 24h: ${variation.toFixed(2)}%`);

    // Verificar se deve enviar alerta
    const shouldAlert = Math.abs(variation) >= 4;
    console.log(`🎯 Variação significativa: ${shouldAlert ? 'SIM' : 'NÃO'} (limite: ±4%)`);

    // Para este teste, sempre enviar se há variação > 4%
    if (!shouldAlert) {
      console.log('📋 Variação insuficiente para alerta automático');
      console.log('💡 Use --force para enviar teste independente da variação');
      
      // Verificar se foi passado --force
      if (!process.argv.includes('--force')) {
        return;
      }
      console.log('🔥 Modo --force ativado, enviando teste...');
    }

    // Formatar mensagem
    const isPositive = variation > 0;
    const emoji = isPositive ? '📈' : '📉';
    const trend = isPositive ? 'SUBIU' : 'DESCEU';
    const alertType = shouldAlert ? 'Variação Significativa' : 'Teste do Sistema';

const message = `₿ *Bitcoin Alert - ${alertType}*

${emoji} *O Bitcoin ${trend} ${Math.abs(variation).toFixed(2)}%*

💰 *Preço Atual:*
🇺🇸 USD: $${bitcoinData.usd.toLocaleString()}
🇧🇷 BRL: R$${bitcoinData.brl.toLocaleString()}

📊 *Variação 24h:* ${variation.toFixed(2)}%

⏰ *${new Date().toLocaleString('pt-BR', { 
  timeZone: 'America/Sao_Paulo'
})}*

${shouldAlert ? '_Alerta automático - Variação significativa detectada_' : '_Alerta de teste - Sistema funcionando_'} ₿

🌐 Acompanhe em: https://lucasfiialerts.com.br

Para gerenciar alertas: Configurações > Bitcoin`;

    console.log('\n📱 Mensagem formatada:');
    console.log('========================================');
    console.log(message);
    console.log('========================================\n');

    // Enviar alertas
    console.log('📤 Enviando alertas...\n');

    let successCount = 0;
    let errorCount = 0;

    for (const user of eligibleUsers) {
      try {
        console.log(`📱 Enviando para: ${user.email}`);

        // Usar fetch em vez de ter que configurar .env diretamente
        const sendUrl = 'http://localhost:3000/api/send-whatsapp';
        
        const sendResponse = await fetch(sendUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            phoneNumber: user.whatsappNumber,
            message: message
          })
        });

        if (sendResponse.ok) {
          const result = await sendResponse.json();
          console.log(`   ✅ Enviado via API Next.js`);
          successCount++;
        } else {
          // Se a API não estiver disponível, usar ULTRAMSG diretamente
          console.log(`   ⚠️ API Next.js indisponível, tentando ULTRAMSG...`);
          
          // Fallback para ULTRAMSG direto (precisa das credenciais)
          const directResponse = await fetch(`https://api.ultramsg.com/instance150259/messages/chat?token=nvqi9mrsetwaozo7`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              to: user.whatsappNumber,
              body: message
            })
          });

          if (directResponse.ok) {
            const directResult = await directResponse.json();
            if (directResult.sent === 'true' || directResult.sent === true) {
              console.log(`   ✅ Enviado via ULTRAMSG direto - ID: ${directResult.id}`);
              successCount++;
            } else {
              console.log(`   ❌ ULTRAMSG erro: ${JSON.stringify(directResult)}`);
              errorCount++;
            }
          } else {
            console.log(`   ❌ Erro ULTRAMSG: ${directResponse.status}`);
            errorCount++;
          }
        }

        // Delay entre usuários
        if (eligibleUsers.length > 1) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }

      } catch (error) {
        console.log(`   ❌ Erro: ${error.message}`);
        errorCount++;
      }
    }

    // Resumo
    console.log('\n📊 RESUMO FINAL:');
    console.log(`✅ Alertas enviados: ${successCount}`);
    console.log(`❌ Erros: ${errorCount}`);
    console.log(`👥 Usuários processados: ${eligibleUsers.length}`);
    console.log(`📈 Bitcoin: $${bitcoin.usd.toLocaleString()} (${variation.toFixed(2)}%)`);

    if (successCount > 0) {
      console.log('\n🎉 Alertas Bitcoin enviados com sucesso!');
    }

  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

// Verificar parâmetros
const forceMode = process.argv.includes('--force');
if (forceMode) {
  console.log('🔥 Modo FORCE ativado - enviará independente da variação\n');
}

sendBitcoinAlertsViaAPI();