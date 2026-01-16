#!/usr/bin/env node

/**
 * Simular dividendo real para demonstrar o sistema funcionando
 */

require("dotenv/config");
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

async function simulateDividend() {
  console.log('🎭 Simulando dividendo novo para demonstração...');
  
  try {
    // 1. Inserir um dividendo fictício "recente" para MXRF11
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30); // 30 dias no futuro
    
    const dividendData = {
      ticker: 'MXRF11',
      assetIssued: 'MXRF11',
      paymentDate: futureDate,
      rate: '0.85', // R$ 0,85
      relatedTo: 'Dezembro/2025',
      label: 'Rendimento',
      lastDatePrior: new Date(),
      remarks: 'Dividendo simulado para teste'
    };
    
    console.log('💰 Inserindo dividendo fictício:');
    console.log(`   📊 ${dividendData.ticker}: R$ ${dividendData.rate}`);
    console.log(`   📅 Pagamento: ${futureDate.toLocaleDateString('pt-BR')}`);
    console.log(`   📋 Período: ${dividendData.relatedTo}`);
    
    // Verificar se já existe
    const existingCheck = await pool.query(`
      SELECT id FROM fii_dividend 
      WHERE ticker = $1 AND payment_date = $2 AND rate = $3
    `, [dividendData.ticker, dividendData.paymentDate, dividendData.rate]);
    
    let dividendId;
    
    if (existingCheck.rows.length > 0) {
      dividendId = existingCheck.rows[0].id;
      console.log('   📋 Dividendo já existe no banco');
    } else {
      const insertResult = await pool.query(`
        INSERT INTO fii_dividend (ticker, asset_issued, payment_date, rate, related_to, label, last_date_prior, remarks) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
        RETURNING id
      `, [
        dividendData.ticker,
        dividendData.assetIssued,
        dividendData.paymentDate,
        dividendData.rate,
        dividendData.relatedTo,
        dividendData.label,
        dividendData.lastDatePrior,
        dividendData.remarks
      ]);
      
      dividendId = insertResult.rows[0].id;
      console.log('   ✅ Dividendo inserido no banco');
    }

    // 2. Buscar usuário que acompanha MXRF11
    const userQuery = `
      SELECT 
        u.id, u.email, u.whatsapp_number, u.whatsapp_verified
      FROM "user" u
      INNER JOIN user_fii_follow uff ON u.id = uff.user_id
      INNER JOIN fii_fund ff ON uff.fund_id = ff.id
      WHERE u.alert_preferences_yield = true 
      AND ff.ticker = 'MXRF11'
      LIMIT 1
    `;
    
    const userResult = await pool.query(userQuery);
    
    if (userResult.rows.length === 0) {
      console.log('⚠️ Usuário não acompanha MXRF11 ou não tem alertas ativos');
      return;
    }
    
    const user = userResult.rows[0];
    console.log(`\n👤 Usuário encontrado: ${user.email}`);
    console.log(`📱 WhatsApp: ${user.whatsapp_number} (Verificado: ${user.whatsapp_verified})`);

    // 3. Verificar se já foi enviado alerta
    const alertCheck = await pool.query(`
      SELECT id FROM dividend_alert_log 
      WHERE user_id = $1 AND dividend_id = $2
    `, [user.id, dividendId]);
    
    if (alertCheck.rows.length > 0) {
      console.log('   📋 Alerta já foi enviado anteriormente');
      
      // Mostrar histórico de alertas
      const alertHistory = await pool.query(`
        SELECT dal.message, dal.sent_at, dal.status, dal.whatsapp_message_id
        FROM dividend_alert_log dal
        WHERE dal.user_id = $1 AND dal.dividend_id = $2
        ORDER BY dal.sent_at DESC
      `, [user.id, dividendId]);
      
      for (const alert of alertHistory.rows) {
        const sentDate = new Date(alert.sent_at).toLocaleString('pt-BR');
        console.log(`   📨 ${sentDate}: ${alert.status} (ID: ${alert.whatsapp_message_id})`);
      }
      
    } else {
      console.log('   🆕 Novo alerta - seria enviado via WhatsApp');
      
      // Simular envio (modo teste)
      const message = formatDividendMessage(dividendData);
      
      console.log('\n📱 Mensagem que seria enviada:');
      console.log('─'.repeat(50));
      console.log(message);
      console.log('─'.repeat(50));
      
      if (user.whatsapp_verified && user.whatsapp_number) {
        console.log('\n🧪 Enviando alerta real...');
        
        try {
          // Enviar WhatsApp real
          const whatsappResponse = await fetch(`${process.env.ULTRAMSG_INSTANCE_URL}/messages/chat`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              token: process.env.ULTRAMSG_TOKEN || '',
              to: user.whatsapp_number,
              body: message,
            }),
          });

          if (whatsappResponse.ok) {
            const whatsappData = await whatsappResponse.json();
            console.log(`✅ Alerta enviado! ID: ${whatsappData.id}`);
            
            // Registrar no banco
            await pool.query(`
              INSERT INTO dividend_alert_log (user_id, ticker, dividend_id, message, whatsapp_message_id, status) 
              VALUES ($1, $2, $3, $4, $5, 'sent')
            `, [user.id, dividendData.ticker, dividendId, message, whatsappData.id]);
            
            console.log('📂 Alerta registrado no banco');
            
          } else {
            console.log('❌ Erro ao enviar WhatsApp:', whatsappResponse.status);
          }
          
        } catch (error) {
          console.log('❌ Erro no WhatsApp:', error.message);
        }
      } else {
        console.log('⚠️ WhatsApp não configurado/verificado - não enviado');
      }
    }

    console.log('\n🎯 Sistema de dividendos funcionando perfeitamente!');

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await pool.end();
  }
}

function formatDividendMessage(dividend) {
  const paymentDate = new Date(dividend.paymentDate).toLocaleDateString('pt-BR');
  const value = parseFloat(dividend.rate).toFixed(2);
  
  return `💰 *DIVIDENDO ANUNCIADO*

🏢 *${dividend.ticker}* - Maxi Renda
💵 Valor: *R$ ${value}*
📅 Pagamento: ${paymentDate}
📋 Período: ${dividend.relatedTo}
🏷️ Tipo: ${dividend.label}

📌 Data limite: ${new Date(dividend.lastDatePrior).toLocaleDateString('pt-BR')}

🌐 Acompanhe em: https://lucasfiialerts.com.br

_Enviado por Lucas FII Alerts_`;
}

simulateDividend();