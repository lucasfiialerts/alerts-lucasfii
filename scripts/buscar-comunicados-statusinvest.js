#!/usr/bin/env node
/**
 * Buscar comunicados/relatórios de um FII via Status Invest
 * 
 * Uso: node scripts/buscar-comunicados-statusinvest.js KNRI11
 * 
 * Este script faz web scraping do Status Invest para buscar
 * comunicados e relatórios de qualquer FII.
 * 
 * Os dados são extraídos do atributo data-page que contém
 * um JSON com todos os comunicados.
 */

const ticker = (process.argv[2] || 'KNRI11').toUpperCase();

// Decodificar entidades HTML
function decodeHtmlEntities(str) {
  return str
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#xF3;/g, 'ó')
    .replace(/&#xE7;/g, 'ç')
    .replace(/&#xE3;/g, 'ã')
    .replace(/&#xF5;/g, 'õ')
    .replace(/&#xE9;/g, 'é')
    .replace(/&#xE1;/g, 'á')
    .replace(/&#xED;/g, 'í')
    .replace(/&#xFA;/g, 'ú');
}

async function buscarComunicados() {
  console.log(`🔍 Buscando comunicados do ${ticker} via Status Invest...\n`);
  
  const url = `https://statusinvest.com.br/fundos-imobiliarios/${ticker.toLowerCase()}`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
      }
    });
    
    if (!response.ok) {
      if (response.status === 404) {
        console.log(`❌ Fundo ${ticker} não encontrado no Status Invest`);
        return [];
      }
      console.log(`❌ Erro ao acessar Status Invest: ${response.status}`);
      return [];
    }
    
    const html = await response.text();
    
    // Extrair nome do fundo
    const nomeMatch = html.match(/<h1[^>]*>([^<]+)<\/h1>/);
    const nomeFundo = nomeMatch ? nomeMatch[1].trim() : ticker;
    console.log(`🏢 ${nomeFundo}`);
    
    // Extrair data-page que contém JSON dos comunicados
    const dataPageMatch = html.match(/data-page="\[([^\]]+)\]"/);
    
    if (!dataPageMatch) {
      console.log('⚠️ Dados de comunicados não encontrados na página');
      return [];
    }
    
    // Decodificar e parsear JSON
    const jsonStr = '[' + decodeHtmlEntities(dataPageMatch[1]) + ']';
    
    let comunicados = [];
    try {
      comunicados = JSON.parse(jsonStr);
    } catch (e) {
      console.log('⚠️ Erro ao parsear JSON dos comunicados:', e.message);
      return [];
    }
    
    // Extrair total de comunicados
    const totalMatch = html.match(/data-total="(\d+)"/);
    const total = totalMatch ? parseInt(totalMatch[1]) : comunicados.length;
    
    console.log(`📊 Total de comunicados: ${total} (exibindo ${comunicados.length} mais recentes)\n`);
    
    console.log('═'.repeat(70));
    console.log(`📋 COMUNICADOS RECENTES DO ${ticker}:`);
    console.log('═'.repeat(70));
    
    comunicados.forEach((com, i) => {
      const docId = com.link.match(/id=(\d+)/)?.[1] || '';
      console.log(`\n${i + 1}. ${com.description}`);
      console.log(`   📅 Data Entrega: ${com.dataEntrega}`);
      console.log(`   📆 Referência: ${com.dataReferencia}`);
      console.log(`   ✅ Status: ${com.statusName}`);
      console.log(`   🔗 https://fnet.bmfbovespa.com.br/fnet/publico/exibirDocumento?id=${docId}&cvm=true`);
    });
    
    // Agrupar por tipo
    console.log('\n' + '═'.repeat(70));
    console.log('📄 TIPOS DE DOCUMENTOS:');
    console.log('═'.repeat(70));
    
    const tiposCounts = {};
    comunicados.forEach(com => {
      const tipo = com.description.split(',')[0];
      tiposCounts[tipo] = (tiposCounts[tipo] || 0) + 1;
    });
    
    Object.entries(tiposCounts).forEach(([tipo, count]) => {
      console.log(`   ✓ ${tipo}: ${count}`);
    });
    
    console.log('\n' + '═'.repeat(70));
    console.log('✅ Busca concluída!');
    console.log(`🔗 Página completa: ${url}`);
    console.log('═'.repeat(70));
    
    return comunicados;
    
  } catch (error) {
    console.error('❌ Erro ao buscar comunicados:', error.message);
    return [];
  }
}

// Exportar função para uso programático
module.exports = { buscarComunicados };

// Se executado diretamente
if (require.main === module) {
  buscarComunicados().catch(console.error);
}
