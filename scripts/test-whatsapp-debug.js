#!/usr/bin/env node

/**
 * Script de teste direto do WhatsApp - Debug completo
 */

async function testWhatsAppDirect() {
  console.log('🚀 Teste direto do WhatsApp - Debug completo...\n');

  try {
    const whatsappNumber = '5521998579960'; // Seu número
    const token = 'nvqi9mrsetwaozo7'; // Token atual
    const instance = 'instance150259'; // Instância atual

    console.log(`📱 Número: ${whatsappNumber}`);
    console.log(`🔑 Token: ${token}`);
    console.log(`⚙️ Instância: ${instance}`);

    // Mensagem de teste simples
    const testMessage = `🧪 *TESTE WHATSAPP*

Esta é uma mensagem de teste para verificar se o WhatsApp está funcionando.

⏰ ${new Date().toLocaleString('pt-BR')}

Se você recebeu esta mensagem, o sistema está funcionando! ✅`;

    console.log('\n📝 Mensagem a ser enviada:');
    console.log('----------------------------------------');
    console.log(testMessage);
    console.log('----------------------------------------\n');

    // Testar status da instância primeiro
    console.log('1️⃣ Verificando status da instância...');
    
    const statusResponse = await fetch(`https://api.ultramsg.com/${instance}/instance/status`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    console.log(`   📊 Status Code: ${statusResponse.status}`);
    
    if (statusResponse.ok) {
      const statusData = await statusResponse.json();
      console.log(`   ✅ Status da instância:`, JSON.stringify(statusData, null, 2));
    } else {
      const statusError = await statusResponse.text();
      console.log(`   ❌ Erro no status:`, statusError);
    }

    // Agora enviar a mensagem
    console.log('\n2️⃣ Enviando mensagem de teste...');

    const sendResponse = await fetch(`https://api.ultramsg.com/${instance}/messages/text`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token: token,
        to: whatsappNumber,
        body: testMessage
      })
    });

    console.log(`   📊 Status Code: ${sendResponse.status}`);
    console.log(`   📊 Status Text: ${sendResponse.statusText}`);

    const responseText = await sendResponse.text();
    console.log(`   📄 Response Body: ${responseText}`);

    if (sendResponse.ok) {
      try {
        const result = JSON.parse(responseText);
        console.log('\n✅ MENSAGEM ENVIADA!');
        console.log(`   🆔 ID: ${result.id || 'N/A'}`);
        console.log(`   📋 Sent: ${result.sent || 'N/A'}`);
        console.log(`   💬 Message: ${result.message || 'N/A'}`);
      } catch (e) {
        console.log('\n✅ Resposta recebida mas não é JSON válido');
      }
    } else {
      console.log('\n❌ ERRO no envio:');
      console.log(`   Status: ${sendResponse.status}`);
      console.log(`   Body: ${responseText}`);
    }

    // Testar outro endpoint para verificar se o número está correto
    console.log('\n3️⃣ Verificando se o número está registrado...');
    
    const checkResponse = await fetch(`https://api.ultramsg.com/${instance}/contacts/check`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token: token,
        chatId: `${whatsappNumber}@c.us`
      })
    });

    if (checkResponse.ok) {
      const checkData = await checkResponse.json();
      console.log(`   📞 Verificação do número:`, JSON.stringify(checkData, null, 2));
    } else {
      const checkError = await checkResponse.text();
      console.log(`   ❌ Erro na verificação:`, checkError);
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar
testWhatsAppDirect();