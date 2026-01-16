#!/usr/bin/env node

/**
 * Teste específico de dividendos dos FIIs do usuário
 */

require("dotenv/config");
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

async function testUserFIIDividends() {
  console.log('🎯 Teste Específico - Dividendos dos seus FIIs');
  console.log('='.repeat(45));
  
  try {
    // Buscar FIIs do usuário
    const fiiQuery = `
      SELECT DISTINCT ff.ticker, ff.name
      FROM user_fii_follow uff
      INNER JOIN "user" u ON uff.user_id = u.id
      INNER JOIN fii_fund ff ON uff.fund_id = ff.id
      WHERE u.alert_preferences_yield = true
      ORDER BY ff.ticker
    `;
    
    const fiiResult = await pool.query(fiiQuery);
    console.log(`📊 Testando ${fiiResult.rows.length} FIIs...\n`);
    
    let foundDividends = 0;
    
    for (const fii of fiiResult.rows) {
      console.log(`🔍 ${fii.ticker} - ${fii.name}`);
      
      try {
        const response = await fetch(`https://brapi.dev/api/quote/${fii.ticker}?dividends=true`, {
          timeout: 10000
        });
        
        if (!response.ok) {
          console.log(`   ❌ Erro HTTP: ${response.status}`);
          continue;
        }
        
        const data = await response.json();
        
        if (!data.results || !data.results[0]) {
          console.log(`   ⚠️ Sem dados`);
          continue;
        }
        
        const asset = data.results[0];
        const dividends = asset.dividendsData?.cashDividends || [];
        
        console.log(`   💰 Preço: R$ ${asset.regularMarketPrice?.toFixed(2) || 'N/A'}`);
        console.log(`   📅 Dividendos: ${dividends.length}`);
        
        if (dividends.length > 0) {
          foundDividends++;
          
          // Mostrar os 3 mais recentes
          const recent = dividends
            .sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate))
            .slice(0, 3);
          
          console.log(`   🏆 Dividendos recentes:`);
          for (const div of recent) {
            const paymentDate = new Date(div.paymentDate);
            const isRecent = paymentDate >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            const icon = isRecent ? '🟢' : '🔵';
            
            console.log(`     ${icon} ${paymentDate.toLocaleDateString('pt-BR')}: R$ ${div.rate} (${div.relatedTo})`);
          }
        }
        
        // Pequena pausa entre requisições
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        console.log(`   ❌ Erro: ${error.message}`);
      }
      
      console.log(''); // Linha em branco
    }
    
    console.log(`📋 Resumo:`);
    console.log(`   • FIIs testados: ${fiiResult.rows.length}`);
    console.log(`   • FIIs com dividendos: ${foundDividends}`);
    
    if (foundDividends === 0) {
      console.log('\n⚠️ Nenhum FII com histórico de dividendos encontrado no BrAPI');
      console.log('💡 Isso é normal - nem todos os FIIs têm dados de dividendos disponíveis');
      console.log('🎯 O sistema funciona quando novos dividendos são anunciados');
      
      // Simular um dividendo para demonstrar
      console.log('\n🎭 Simulando um dividendo para demonstrar o sistema...');
      
      await simulateDividendDemo();
    } else {
      console.log('\n✅ Sistema pronto para detectar novos dividendos!');
    }
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await pool.end();
  }
}

async function simulateDividendDemo() {
  try {
    // Simular dados de dividendo
    const mockDividend = {
      ticker: 'MXRF11',
      assetIssued: 'MXRF11',
      paymentDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 dias no futuro
      rate: 0.75,
      relatedTo: 'Dezembro/2025',
      label: 'Rendimento',
      lastDatePrior: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      remarks: 'Simulação para demonstração'
    };
    
    console.log('📋 Exemplo de dividendo que acionaria alerta:');
    console.log(`   🏢 ${mockDividend.ticker}`);
    console.log(`   💰 R$ ${mockDividend.rate.toFixed(2)}`);
    console.log(`   📅 ${mockDividend.paymentDate.toLocaleDateString('pt-BR')}`);
    console.log(`   📋 ${mockDividend.relatedTo}`);
    
    // Formatar mensagem que seria enviada
    const message = `💰 *DIVIDENDO ANUNCIADO*

🏢 *${mockDividend.ticker}* - Maxi Renda
💵 Valor: *R$ ${mockDividend.rate.toFixed(2)}*
📅 Pagamento: ${mockDividend.paymentDate.toLocaleDateString('pt-BR')}
📋 Período: ${mockDividend.relatedTo}
🏷️ Tipo: ${mockDividend.label}

📌 Data limite: ${mockDividend.lastDatePrior.toLocaleDateString('pt-BR')}

🌐 Acompanhe em: https://lucasfiialerts.com.br

_Enviado por Lucas FII Alerts_`;
    
    console.log('\n📱 Mensagem que seria enviada via WhatsApp:');
    console.log('─'.repeat(50));
    console.log(message);
    console.log('─'.repeat(50));
    
  } catch (error) {
    console.log('❌ Erro na simulação:', error.message);
  }
}

testUserFIIDividends();