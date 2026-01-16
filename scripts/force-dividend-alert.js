#!/usr/bin/env node

/**
 * Força envio de alerta de dividendo real
 */

require("dotenv/config");
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

async function forceDividendAlert() {
  console.log('🚀 Forçando envio de alerta de dividendo...');
  
  try {
    // 1. Buscar usuário com alertas ativos
    const userResult = await pool.query(`
      SELECT id, email, whatsapp_number, whatsapp_verified
      FROM "user" 
      WHERE alert_preferences_yield = true 
      AND whatsapp_verified = true
      LIMIT 1
    `);
    
    if (userResult.rows.length === 0) {
      console.log('❌ Nenhum usuário com alertas ativos e WhatsApp verificado');
      return;
    }
    
    const user = userResult.rows[0];
    console.log(`👤 ${user.email} - WhatsApp: ${user.whatsapp_number}`);
    
    // 2. Criar dividendo de teste
    const testDividend = {
      ticker: 'MXRF11',
      assetIssued: 'MXRF11',
      paymentDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 dias no futuro
      rate: '0.92',
      relatedTo: 'Dezembro/2025',
      label: 'Rendimento',
      lastDatePrior: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      remarks: 'Teste de alerta real'
    };
    
    // 3. Inserir dividendo no banco
    const dividendResult = await pool.query(`
      INSERT INTO fii_dividend (ticker, asset_issued, payment_date, rate, related_to, label, last_date_prior, remarks)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id
    `, [
      testDividend.ticker,
      testDividend.assetIssued,
      testDividend.paymentDate,
      testDividend.rate,
      testDividend.relatedTo,
      testDividend.label,
      testDividend.lastDatePrior,
      testDividend.remarks
    ]);
    
    const dividendId = dividendResult.rows[0].id;
    console.log(`✅ Dividendo criado com ID: ${dividendId}`);
    
    // 4. Formatar mensagem
    const message = `💰 *DIVIDENDO ANUNCIADO*

🏢 *${testDividend.ticker}* - Maxi Renda
💵 Valor: *R$ ${parseFloat(testDividend.rate).toFixed(2)}*
📅 Pagamento: ${testDividend.paymentDate.toLocaleDateString('pt-BR')}
📋 Período: ${testDividend.relatedTo}
🏷️ Tipo: ${testDividend.label}

📌 Data limite: ${testDividend.lastDatePrior.toLocaleDateString('pt-BR')}

🌐 Acompanhe em: https://lucasfiialerts.com.br

_Enviado por Lucas FII Alerts_`;
    
    console.log('\n📱 Enviando WhatsApp...');
    console.log('─'.repeat(40));
    console.log(message);
    console.log('─'.repeat(40));
    
    // 5. Enviar WhatsApp usando a mesma configuração do Bitcoin
    const whatsappUrl = `https://api.ultramsg.com/${process.env.ULTRAMSG_INSTANCE}/messages/chat?token=${process.env.ULTRAMSG_TOKEN}`;
    console.log(`🔗 Enviando para: ${user.whatsapp_number}`);
    
    const response = await fetch(whatsappUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        to: user.whatsapp_number,
        body: message,
      }),
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log(`✅ Alerta enviado! Message ID: ${result.id}`);
      
      // Registrar no banco
      await pool.query(`
        INSERT INTO dividend_alert_log (user_id, ticker, dividend_id, message, whatsapp_message_id, status)
        VALUES ($1, $2, $3, $4, $5, 'sent')
      `, [user.id, testDividend.ticker, dividendId, message, result.id]);
      
      console.log('📂 Alerta registrado no banco');
      
    } else {
      const error = await response.text();
      console.log(`❌ Erro ao enviar WhatsApp: ${response.status}`);
      console.log('Error:', error);
      
      // Registrar erro no banco
      await pool.query(`
        INSERT INTO dividend_alert_log (user_id, ticker, dividend_id, message, status)
        VALUES ($1, $2, $3, $4, 'failed')
      `, [user.id, testDividend.ticker, dividendId, message]);
    }
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await pool.end();
  }
}

forceDividendAlert();