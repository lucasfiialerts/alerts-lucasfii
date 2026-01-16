#!/usr/bin/env node

/**
 * Script de teste de alerta de preço via UltraMsg
 */

require('dotenv').config();
const https = require('https');

async function testUltraMsg() {
  const instance = process.env.ULTRAMSG_INSTANCE;
  const token = process.env.ULTRAMSG_TOKEN;
  const phone = process.env.ULTRAMSG_PHONE || '5521998579960';

  console.log('📱 Testando UltraMsg...');
  console.log('Instance:', instance);
  console.log('Token:', token ? token.substring(0, 5) + '...' : 'NÃO DEFINIDO');
  console.log('Telefone:', phone);
  console.log('');

  if (!instance || !token) {
    console.log('❌ ULTRAMSG_INSTANCE ou ULTRAMSG_TOKEN não definidos no .env');
    return;
  }

  const msg = `🧪 *TESTE DE ALERTA DE PRECO*

📊 KNIP11 - Teste de Configuracao
💰 R$ 87,17
📈 +2,01%

⏰ ${new Date().toLocaleString('pt-BR')}

✅ UltraMsg funcionando!`;

  const data = JSON.stringify({
    token: token,
    to: phone,
    body: msg
  });

  const options = {
    hostname: 'api.ultramsg.com',
    port: 443,
    path: '/' + instance + '/messages/chat',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data)
    }
  };

  console.log('📡 Enviando para:', `https://api.ultramsg.com/${instance}/messages/chat`);
  console.log('');

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', d => body += d);
      res.on('end', () => {
        console.log('📊 Status:', res.statusCode);
        console.log('📋 Resposta:', body);
        console.log('');
        
        if (res.statusCode === 200) {
          const result = JSON.parse(body);
          if (result.sent === 'true' || result.sent === true) {
            console.log('✅ MENSAGEM ENVIADA COM SUCESSO!');
          } else {
            console.log('⚠️ Resposta recebida mas verifique o status:', result.message || body);
          }
        } else {
          console.log('❌ Erro no envio - Status:', res.statusCode);
        }
        resolve();
      });
    });

    req.on('error', (e) => {
      console.error('❌ Erro de conexão:', e.message);
      reject(e);
    });

    req.write(data);
    req.end();
  });
}

testUltraMsg().catch(console.error);
