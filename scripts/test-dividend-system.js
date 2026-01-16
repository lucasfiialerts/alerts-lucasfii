#!/usr/bin/env node

/**
 * Teste completo do sistema de alertas de dividendos
 * Verifica usuários, FIIs seguidos e testa API de dividendos
 */

require("dotenv/config");
const { drizzle } = require("drizzle-orm/node-postgres");
const { Pool } = require("pg");
const { eq } = require("drizzle-orm");

// Importar schema
const schema = require("../drizzle/schema.ts");

// Configuração do banco usando DATABASE_URL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

const db = drizzle(pool, { schema });

async function testDividendSystem() {
  console.log('🚀 Teste Completo - Sistema de Alertas de Dividendos');
  console.log('='.repeat(60));
  
  try {
    // 1. Verificar usuários com alertas de dividendos ativos
    console.log('\n1️⃣ Verificando usuários com alertas de dividendos...');
    
    const usersWithDividendAlerts = await db
      .select({
        id: schema.userTable.id,
        email: schema.userTable.email,
        whatsappNumber: schema.userTable.whatsappNumber,
        whatsappVerified: schema.userTable.whatsappVerified,
        alertPreferencesYield: schema.userTable.alertPreferencesYield,
      })
      .from(schema.userTable)
      .where(eq(schema.userTable.alertPreferencesYield, true));

    console.log(`   Usuários com alertas de dividendos: ${usersWithDividendAlerts.length}`);
    
    if (usersWithDividendAlerts.length === 0) {
      console.log('   ⚠️ Nenhum usuário com alertas de dividendos ativos!');
      return;
    }

    for (const user of usersWithDividendAlerts) {
      console.log(`   ✅ ${user.email} - WhatsApp: ${user.whatsappNumber} (Verificado: ${user.whatsappVerified})`);
    }

    // 2. Verificar FIIs seguidos por esses usuários
    console.log('\n2️⃣ Verificando FIIs seguidos pelos usuários...');
    
    const userIds = usersWithDividendAlerts.map(u => u.id);
    
    const followedFIIs = await db
      .select({
        userId: schema.userFiiFollowTable.userId,
        userEmail: schema.userTable.email,
        fundTicker: schema.fiiFundTable.ticker,
        fundName: schema.fiiFundTable.name,
        notificationsEnabled: schema.userFiiFollowTable.notificationsEnabled,
      })
      .from(schema.userFiiFollowTable)
      .innerJoin(schema.userTable, eq(schema.userFiiFollowTable.userId, schema.userTable.id))
      .innerJoin(schema.fiiFundTable, eq(schema.userFiiFollowTable.fundId, schema.fiiFundTable.id))
      .where(eq(schema.userTable.alertPreferencesYield, true));

    console.log(`   FIIs seguidos: ${followedFIIs.length}`);
    
    if (followedFIIs.length === 0) {
      console.log('   ⚠️ Usuários não seguem nenhum FII!');
      return;
    }

    const uniqueTickers = [...new Set(followedFIIs.map(f => f.fundTicker))];
    
    for (const follow of followedFIIs) {
      console.log(`   📊 ${follow.userEmail} segue ${follow.fundTicker} (${follow.fundName})`);
    }
    
    // 3. Testar API do BrAPI para dividendos
    console.log('\n3️⃣ Testando API BrAPI para dividendos...');
    console.log(`   Testando tickers: ${uniqueTickers.join(', ')}`);
    
    for (const ticker of uniqueTickers.slice(0, 3)) { // Testar apenas 3 para não sobrecarregar
      try {
        console.log(`\n   🔍 Buscando dividendos para ${ticker}...`);
        
        const response = await fetch(`https://brapi.dev/api/quote/${ticker}?dividends=true`);
        const data = await response.json();
        
        if (data.results && data.results[0]) {
          const asset = data.results[0];
          const dividends = asset.dividendsData?.cashDividends || [];
          
          console.log(`   📈 ${ticker}: R$ ${asset.regularMarketPrice?.toFixed(2)}`);
          console.log(`   💰 Dividendos encontrados: ${dividends.length}`);
          
          if (dividends.length > 0) {
            const recent = dividends.slice(0, 3);
            for (const div of recent) {
              const paymentDate = new Date(div.paymentDate).toLocaleDateString('pt-BR');
              console.log(`     • ${paymentDate}: R$ ${div.rate} (${div.relatedTo})`);
            }
          }
        }
      } catch (error) {
        console.log(`   ❌ Erro ao buscar ${ticker}: ${error.message}`);
      }
    }

    // 4. Verificar histórico de dividendos no banco
    console.log('\n4️⃣ Verificando histórico de dividendos no banco...');
    
    try {
      const storedDividends = await db
        .select({
          ticker: schema.fiiDividendTable.ticker,
          paymentDate: schema.fiiDividendTable.paymentDate,
          rate: schema.fiiDividendTable.rate,
          relatedTo: schema.fiiDividendTable.relatedTo,
        })
        .from(schema.fiiDividendTable)
        .limit(10);

      console.log(`   Dividendos armazenados: ${storedDividends.length}`);
      
      for (const div of storedDividends) {
        const paymentDate = new Date(div.paymentDate).toLocaleDateString('pt-BR');
        console.log(`   💾 ${div.ticker}: R$ ${div.rate} em ${paymentDate} (${div.relatedTo})`);
      }
    } catch (error) {
      console.log(`   ⚠️ Erro ao acessar tabela de dividendos: ${error.message}`);
      console.log('   💡 Talvez seja necessário aplicar as migrações do banco');
    }

    // 5. Testar endpoint de dividendos
    console.log('\n5️⃣ Testando endpoint de cron de dividendos...');
    
    try {
      const cronResponse = await fetch('http://localhost:3000/api/cron/dividend-alerts?test=true&force=true');
      const cronData = await cronResponse.json();
      
      console.log(`   📊 Resultado do cron:`);
      console.log(`     • Sucesso: ${cronData.success}`);
      console.log(`     • Alertas enviados: ${cronData.alertsSent}`);
      console.log(`     • Modo teste: ${cronData.testMode}`);
    } catch (error) {
      console.log(`   ❌ Erro ao chamar endpoint: ${error.message}`);
    }

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await pool.end();
  }
}

testDividendSystem();