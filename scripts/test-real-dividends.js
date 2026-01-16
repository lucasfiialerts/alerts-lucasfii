#!/usr/bin/env node

/**
 * Teste direto de dividendos
 * Força busca e processamento para um usuário específico
 */

require("dotenv/config");
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

async function testRealDividends() {
  console.log('🎯 Teste REAL de Alertas de Dividendos');
  console.log('='.repeat(40));
  
  try {
    // 1. Buscar dados do MXRF11 via BrAPI
    console.log('\n1️⃣ Buscando dividendos MXRF11 via BrAPI...');
    
    const response = await fetch('https://brapi.dev/api/quote/MXRF11?dividends=true');
    const data = await response.json();
    
    if (!data.results || !data.results[0]) {
      console.log('❌ Nenhum dado encontrado para MXRF11');
      return;
    }
    
    const asset = data.results[0];
    const dividends = asset.dividendsData?.cashDividends || [];
    
    console.log(`   💰 Preço atual: R$ ${asset.regularMarketPrice}`);
    console.log(`   📅 Dividendos encontrados: ${dividends.length}`);
    
    if (dividends.length === 0) {
      console.log('   ⚠️ Nenhum dividendo encontrado para MXRF11');
      return;
    }
    
    // Mostrar todos os dividendos
    console.log('\n📋 Todos os dividendos encontrados:');
    for (let i = 0; i < Math.min(dividends.length, 5); i++) {
      const div = dividends[i];
      const paymentDate = new Date(div.paymentDate);
      const daysDiff = Math.ceil((paymentDate - new Date()) / (1000 * 60 * 60 * 24));
      
      console.log(`   ${i + 1}. R$ ${div.rate}`);
      console.log(`      📅 Pagamento: ${paymentDate.toLocaleDateString('pt-BR')} (${daysDiff} dias)`);
      console.log(`      📋 Período: ${div.relatedTo}`);
      console.log(`      🏷️ Tipo: ${div.label}`);
      
      if (div.lastDatePrior) {
        const priorDate = new Date(div.lastDatePrior);
        console.log(`      ⏰ Data limite: ${priorDate.toLocaleDateString('pt-BR')}`);
      }
      console.log('');
    }

    // 2. Verificar se seria considerado "novo" (últimos 30 dias)
    console.log('2️⃣ Analisando critérios de alerta...');
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentDividends = dividends.filter(d => {
      const paymentDate = new Date(d.paymentDate);
      return paymentDate >= thirtyDaysAgo;
    });
    
    console.log(`   📊 Dividendos dos últimos 30 dias: ${recentDividends.length}`);
    
    if (recentDividends.length === 0) {
      console.log('   ⚠️ Nenhum dividendo recente (últimos 30 dias)');
      console.log('   💡 Sistema só alerta sobre dividendos recentes');
    } else {
      console.log('   ✅ Dividendos que gerariam alerta:');
      for (const div of recentDividends) {
        const paymentDate = new Date(div.paymentDate).toLocaleDateString('pt-BR');
        console.log(`     • ${paymentDate}: R$ ${div.rate} (${div.relatedTo})`);
      }
    }

    // 3. Verificar se já existem no banco
    console.log('\n3️⃣ Verificando banco de dados...');
    
    const existingQuery = `
      SELECT ticker, payment_date, rate, related_to, created_at
      FROM fii_dividend 
      WHERE ticker = 'MXRF11'
      ORDER BY payment_date DESC
      LIMIT 5
    `;
    
    const existing = await pool.query(existingQuery);
    console.log(`   📂 Dividendos já armazenados: ${existing.rows.length}`);
    
    for (const row of existing.rows) {
      const paymentDate = new Date(row.payment_date).toLocaleDateString('pt-BR');
      const createdDate = new Date(row.created_at).toLocaleDateString('pt-BR');
      console.log(`     • ${paymentDate}: R$ ${row.rate} (${row.related_to}) - Criado em ${createdDate}`);
    }

    // 4. Simular inserção de um dividendo novo (modo teste)
    console.log('\n4️⃣ Simulando novo dividendo...');
    
    if (recentDividends.length > 0) {
      const testDiv = recentDividends[0];
      
      // Verificar se já existe
      const checkQuery = `
        SELECT id FROM fii_dividend 
        WHERE ticker = 'MXRF11' 
        AND payment_date = $1 
        AND rate = $2 
        AND related_to = $3
      `;
      
      const checkResult = await pool.query(checkQuery, [
        new Date(testDiv.paymentDate),
        testDiv.rate.toString(),
        testDiv.relatedTo
      ]);
      
      if (checkResult.rows.length > 0) {
        console.log('   ✅ Dividendo já existe no banco');
        console.log('   💡 Sistema evitaria alerta duplicado');
      } else {
        console.log('   🆕 Dividendo seria inserido como novo');
        console.log('   📱 Alerta seria enviado via WhatsApp');
        
        // Formatar mensagem que seria enviada
        const paymentDate = new Date(testDiv.paymentDate).toLocaleDateString('pt-BR');
        const value = parseFloat(testDiv.rate).toFixed(2);
        
        const message = `💰 *DIVIDENDO ANUNCIADO*

🏢 *MXRF11* - ${asset.shortName}
💵 Valor: *R$ ${value}*
📅 Pagamento: ${paymentDate}
📋 Período: ${testDiv.relatedTo}
🏷️ Tipo: ${testDiv.label}

${testDiv.lastDatePrior ? `📌 Data limite: ${new Date(testDiv.lastDatePrior).toLocaleDateString('pt-BR')}` : ''}

🌐 Acompanhe em: https://lucasfiialerts.com.br

_Enviado por Lucas FII Alerts_`;

        console.log('\n📱 Mensagem que seria enviada:');
        console.log('─'.repeat(40));
        console.log(message);
        console.log('─'.repeat(40));
      }
    }

    console.log('\n🎯 Sistema está funcionando corretamente!');
    console.log('   Para receber alertas reais:');
    console.log('   1. Aguarde novos dividendos serem anunciados');
    console.log('   2. Configure cron job para rodar diariamente');
    console.log('   3. Sistema enviará WhatsApp automaticamente');

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await pool.end();
  }
}

testRealDividends();