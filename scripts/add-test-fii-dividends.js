#!/usr/bin/env node

/**
 * Adicionar FII com dividendos conhecidos para teste
 */

require("dotenv/config");
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

async function addTestFII() {
  console.log('🏢 Adicionando FII com dividendos para teste...');
  
  try {
    // Buscar usuário
    const userResult = await pool.query(`
      SELECT id, email FROM "user" 
      WHERE alert_preferences_yield = true 
      LIMIT 1
    `);
    
    if (userResult.rows.length === 0) {
      console.log('❌ Nenhum usuário com alertas ativos');
      return;
    }
    
    const user = userResult.rows[0];
    console.log(`👤 Usuário: ${user.email}`);
    
    // Testar alguns FIIs conhecidos por ter dividendos
    const testTickers = ['XPML11', 'HGBS11', 'KNRI11'];
    
    for (const ticker of testTickers) {
      console.log(`\n🔍 Testando ${ticker}...`);
      
      try {
        const response = await fetch(`https://brapi.dev/api/quote/${ticker}?dividends=true`);
        const data = await response.json();
        
        if (data.results && data.results[0]) {
          const asset = data.results[0];
          const dividends = asset.dividendsData?.cashDividends || [];
          
          console.log(`   💰 Preço: R$ ${asset.regularMarketPrice}`);
          console.log(`   📅 Dividendos: ${dividends.length}`);
          
          if (dividends.length > 0) {
            console.log(`   ✅ ${ticker} tem dividendos! Adicionando...`);
            
            // Verificar se FII existe
            const fiiCheck = await pool.query('SELECT id FROM fii_fund WHERE ticker = $1', [ticker]);
            let fundId;
            
            if (fiiCheck.rows.length === 0) {
              // Criar FII
              const fiiResult = await pool.query(`
                INSERT INTO fii_fund (ticker, name) 
                VALUES ($1, $2) 
                RETURNING id
              `, [ticker, asset.shortName || ticker]);
              
              fundId = fiiResult.rows[0].id;
              console.log(`   📈 FII ${ticker} criado no banco`);
            } else {
              fundId = fiiCheck.rows[0].id;
              console.log(`   📈 FII ${ticker} já existe no banco`);
            }
            
            // Verificar se usuário já segue
            const followCheck = await pool.query(`
              SELECT id FROM user_fii_follow 
              WHERE user_id = $1 AND fund_id = $2
            `, [user.id, fundId]);
            
            if (followCheck.rows.length === 0) {
              // Adicionar seguimento
              await pool.query(`
                INSERT INTO user_fii_follow (user_id, fund_id, notifications_enabled, price_alert_enabled) 
                VALUES ($1, $2, true, true)
              `, [user.id, fundId]);
              
              console.log(`   ✅ Usuário agora segue ${ticker}`);
            } else {
              console.log(`   📋 Usuário já segue ${ticker}`);
            }
            
            // Mostrar alguns dividendos
            console.log(`   🎯 Últimos dividendos:`);
            for (let i = 0; i < Math.min(dividends.length, 3); i++) {
              const div = dividends[i];
              const paymentDate = new Date(div.paymentDate).toLocaleDateString('pt-BR');
              console.log(`     • ${paymentDate}: R$ ${div.rate} (${div.relatedTo})`);
            }
            
            // Agora testar o endpoint de dividendos com este FII
            console.log(`\n🧪 Testando endpoint com ${ticker}...`);
            
            const testResponse = await fetch(`http://localhost:3000/api/cron/dividend-alerts?test=true&ticker=${ticker}`);
            const testData = await testResponse.json();
            
            console.log(`   📊 Resultado:`);
            console.log(`     • Sucesso: ${testData.success}`);
            console.log(`     • Alertas: ${testData.alertsSent || 0}`);
            console.log(`     • Resultados: ${testData.results?.length || 0}`);
            
            if (testData.results && testData.results.length > 0) {
              for (const result of testData.results) {
                console.log(`     • ${JSON.stringify(result)}`);
              }
            }
            
            break; // Encontrou um FII com dividendos, parar aqui
          }
        }
        
      } catch (error) {
        console.log(`   ❌ Erro ao testar ${ticker}: ${error.message}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await pool.end();
  }
}

addTestFII();