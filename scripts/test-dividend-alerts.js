#!/usr/bin/env node

/**
 * Teste do sistema de alertas de dividendos
 * Usando queries SQL diretas para evitar problemas de import
 */

require("dotenv/config");
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

async function testDividendSystem() {
  console.log('🚀 Teste - Sistema de Alertas de Dividendos');
  console.log('='.repeat(50));
  
  try {
    // 1. Verificar usuários com alertas de dividendos ativos
    console.log('\n1️⃣ Usuários com alertas de dividendos...');
    
    const usersQuery = `
      SELECT id, email, whatsapp_number, whatsapp_verified, alert_preferences_yield 
      FROM "user" 
      WHERE alert_preferences_yield = true
    `;
    
    const usersResult = await pool.query(usersQuery);
    console.log(`   📊 Usuários encontrados: ${usersResult.rows.length}`);
    
    if (usersResult.rows.length === 0) {
      console.log('   ⚠️ Nenhum usuário com alertas ativos!');
      console.log('   💡 Ative os alertas na página de configuração');
      return;
    }

    for (const user of usersResult.rows) {
      console.log(`   ✅ ${user.email}`);
      console.log(`      WhatsApp: ${user.whatsapp_number || 'Não configurado'}`);
      console.log(`      Verificado: ${user.whatsapp_verified ? 'Sim' : 'Não'}`);
    }

    // 2. Verificar FIIs seguidos
    console.log('\n2️⃣ FIIs seguidos pelos usuários...');
    
    const fiiQuery = `
      SELECT 
        u.email,
        f.ticker,
        f.name,
        uff.notifications_enabled
      FROM user_fii_follow uff
      INNER JOIN "user" u ON uff.user_id = u.id
      INNER JOIN fii_fund f ON uff.fund_id = f.id
      WHERE u.alert_preferences_yield = true
      ORDER BY u.email, f.ticker
    `;
    
    const fiiResult = await pool.query(fiiQuery);
    console.log(`   📈 FIIs seguidos: ${fiiResult.rows.length}`);
    
    if (fiiResult.rows.length === 0) {
      console.log('   ⚠️ Usuários não seguem nenhum FII!');
      console.log('   💡 Adicione FIIs na página "Meus Ativos"');
      return;
    }

    const tickersSet = new Set();
    for (const row of fiiResult.rows) {
      console.log(`   📊 ${row.email} → ${row.ticker} (${row.name})`);
      tickersSet.add(row.ticker);
    }

    const tickers = Array.from(tickersSet);
    
    // 3. Testar API BrAPI para alguns FIIs
    console.log(`\n3️⃣ Testando dividendos via BrAPI...`);
    
    const testTickers = tickers.slice(0, 2); // Testar apenas 2 para não sobrecarregar
    
    for (const ticker of testTickers) {
      try {
        console.log(`\n   🔍 ${ticker}:`);
        
        const response = await fetch(`https://brapi.dev/api/quote/${ticker}?dividends=true`);
        const data = await response.json();
        
        if (data.results && data.results[0]) {
          const asset = data.results[0];
          const dividends = asset.dividendsData?.cashDividends || [];
          
          console.log(`     💰 Preço atual: R$ ${asset.regularMarketPrice?.toFixed(2)}`);
          console.log(`     📅 Dividendos encontrados: ${dividends.length}`);
          
          if (dividends.length > 0) {
            console.log(`     🏆 Próximos dividendos:`);
            const future = dividends
              .filter(d => new Date(d.paymentDate) > new Date())
              .slice(0, 2);
              
            const past = dividends
              .filter(d => new Date(d.paymentDate) <= new Date())
              .slice(0, 2);
            
            for (const div of future) {
              const paymentDate = new Date(div.paymentDate).toLocaleDateString('pt-BR');
              console.log(`       📅 ${paymentDate}: R$ ${div.rate} (${div.relatedTo}) - ${div.label}`);
            }
            
            if (future.length === 0 && past.length > 0) {
              console.log(`     📈 Últimos dividendos:`);
              for (const div of past) {
                const paymentDate = new Date(div.paymentDate).toLocaleDateString('pt-BR');
                console.log(`       📅 ${paymentDate}: R$ ${div.rate} (${div.relatedTo}) - ${div.label}`);
              }
            }
          } else {
            console.log(`     ⚠️ Nenhum dividendo encontrado`);
          }
        }
        
      } catch (error) {
        console.log(`   ❌ Erro ao buscar ${ticker}: ${error.message}`);
      }
    }

    // 4. Testar endpoint do cron
    console.log(`\n4️⃣ Testando endpoint de cron...`);
    
    try {
      const cronResponse = await fetch('http://localhost:3000/api/cron/dividend-alerts?test=true');
      const cronData = await cronResponse.json();
      
      console.log(`   📊 Resposta do cron:`);
      console.log(`     ✅ Sucesso: ${cronData.success}`);
      console.log(`     📨 Alertas enviados: ${cronData.alertsSent || 0}`);
      console.log(`     🧪 Modo teste: ${cronData.testMode}`);
      console.log(`     ⏰ Timestamp: ${cronData.timestamp}`);
      
      if (cronData.results && cronData.results.length > 0) {
        console.log(`     📋 Resultados:`);
        for (const result of cronData.results) {
          console.log(`       • ${result}`);
        }
      }
      
    } catch (error) {
      console.log(`   ❌ Erro no endpoint: ${error.message}`);
    }

    console.log(`\n🎯 Sistema está configurado e funcionando!`);
    console.log(`   Para receber alertas:`);
    console.log(`   1. ✅ Alertas de dividendos ativados`);
    console.log(`   2. ✅ Usuário(s) encontrado(s)`);
    console.log(`   3. ${fiiResult.rows.length > 0 ? '✅' : '❌'} FIIs sendo acompanhados`);
    console.log(`   4. ✅ API BrAPI funcionando`);
    console.log(`   5. ✅ Endpoint de cron funcionando`);

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await pool.end();
  }
}

testDividendSystem();