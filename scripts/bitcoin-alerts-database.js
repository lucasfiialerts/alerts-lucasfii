#!/usr/bin/env node

/**
 * Script para enviar alertas de Bitcoin consultando banco real
 * Envia apenas para usuários com alertPreferencesBitcoin = true
 */

require('dotenv').config();
const { Pool } = require('pg');

// Configuração do banco
let pool;

if (process.env.DATABASE_URL) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
  });
} else {
  pool = new Pool({
    host: process.env.POSTGRES_HOST,
    port: parseInt(process.env.POSTGRES_PORT || "5432"),
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DATABASE,
    ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
  });
}

async function sendBitcoinAlertsFromDatabase() {
  console.log('🚀 Enviando alertas Bitcoin (consultando banco real)...\n');

  try {
    // 1. Buscar usuários com Bitcoin alerts ativado
    console.log('📊 Consultando banco de dados...');
    
    const query = `
      SELECT 
        id,
        name,
        email,
        whatsapp_number as "whatsappNumber",
        whatsapp_verified as "whatsappVerified",
        alert_preferences_bitcoin as "alertPreferencesBitcoin"
      FROM "user" 
      WHERE alert_preferences_bitcoin = true 
        AND whatsapp_verified = true 
        AND whatsapp_number IS NOT NULL 
        AND whatsapp_number != ''
    `;

    const result = await pool.query(query);
    const users = result.rows;

    console.log(`👥 Total usuários encontrados: ${users.length}`);

    if (users.length === 0) {
      console.log('⚠️ Nenhum usuário encontrado com Bitcoin alerts ativo e WhatsApp verificado');
      return;
    }

    // Listar usuários encontrados
    users.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.email} - ${user.whatsappNumber}`);
    });

    // 2. Buscar preço atual do Bitcoin
    console.log('\n📈 Buscando dados atuais do Bitcoin...');
    
    const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd,brl&include_24hr_change=true', {
      signal: AbortSignal.timeout(10000)
    });

    if (!response.ok) {
      throw new Error(`Erro na API: ${response.status}`);
    }

    const data = await response.json();
    const bitcoin = data.bitcoin;
    const variation = bitcoin.usd_24h_change || 0;

    console.log(`💰 Preço USD: $${bitcoin.usd.toLocaleString()}`);
    console.log(`💰 Preço BRL: R$${bitcoin.brl.toLocaleString()}`);
    console.log(`📊 Variação 24h: ${variation.toFixed(2)}%`);

    // 3. Verificar se deve enviar alerta
    const shouldAlert = Math.abs(variation) >= 4;
    console.log(`\n🎯 Variação significativa: ${shouldAlert ? 'SIM' : 'NÃO'} (limite: ±4%)`);

    if (!shouldAlert) {
      console.log('📋 Variação insuficiente para alerta automático');
      console.log('💡 Para forçar envio de teste, use o parâmetro --force');
      return;
    }

    // 4. Formatar mensagem
    const isPositive = variation > 0;
    const emoji = isPositive ? '📈' : '📉';
    const trend = isPositive ? 'SUBIU' : 'DESCEU';
    const color = isPositive ? 'VERDE' : 'VERMELHO';

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

_Alerta automático - Variação significativa detectada_ ₿

🌐 Acompanhe em: https://lucasfiialerts.com.br

Para desativar estes alertas, acesse: Configurações > Bitcoin`;

    console.log('\n📱 Mensagem formatada:');
    console.log('========================================');
    console.log(message);
    console.log('========================================\n');

    // 5. Enviar para cada usuário
    console.log(`📤 Enviando alertas para ${users.length} usuário(s)...\n`);

    let successCount = 0;
    let errorCount = 0;

    for (const user of users) {
      try {
        console.log(`📱 Enviando para: ${user.email} (${user.whatsappNumber})`);

        // Verificar se tem credenciais
        if (!process.env.ULTRAMSG_TOKEN || !process.env.ULTRAMSG_INSTANCE) {
          console.log('   ❌ Credenciais ULTRAMSG não configuradas');
          errorCount++;
          continue;
        }

        const sendResponse = await fetch(`https://api.ultramsg.com/${process.env.ULTRAMSG_INSTANCE}/messages/chat?token=${process.env.ULTRAMSG_TOKEN}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            to: user.whatsappNumber,
            body: message
          })
        });

        console.log(`   📊 Status: ${sendResponse.status}`);

        if (sendResponse.ok) {
          const result = await sendResponse.json();
          
          if (result.sent === 'true' || result.sent === true) {
            console.log(`   ✅ Enviado com sucesso - ID: ${result.id || 'N/A'}`);
            successCount++;
          } else {
            console.log(`   ⚠️ Resposta inesperada: ${JSON.stringify(result)}`);
            errorCount++;
          }
        } else {
          const errorText = await sendResponse.text();
          console.log(`   ❌ Erro HTTP: ${errorText}`);
          errorCount++;
        }

        // Delay entre envios para evitar rate limit
        if (users.length > 1) {
          console.log('   ⏳ Aguardando 2s...');
          await new Promise(resolve => setTimeout(resolve, 2000));
        }

      } catch (error) {
        console.log(`   ❌ Erro para ${user.email}: ${error.message}`);
        errorCount++;
      }
    }

    // 6. Resumo final
    console.log('\n📊 RESUMO DO ENVIO:');
    console.log(`✅ Sucessos: ${successCount}`);
    console.log(`❌ Erros: ${errorCount}`);
    console.log(`👥 Total processados: ${users.length}`);
    console.log(`📈 Bitcoin: $${bitcoin.usd.toLocaleString()} (${variation.toFixed(2)}%)`);

    if (successCount > 0) {
      console.log('\n🎉 Alertas de Bitcoin enviados com sucesso!');
    } else {
      console.log('\n⚠️ Nenhum alerta foi enviado com sucesso');
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  } finally {
    await pool.end();
  }
}

// Executar
sendBitcoinAlertsFromDatabase();