#!/usr/bin/env node
/**
 * Buscar relatórios de um fundo específico
 * Uso: node scripts/buscar-relatorio-fundo.js KNRI11
 */

const ticker = process.argv[2] || 'KNRI11';
const termoBusca = ticker.replace('11', '').replace('12', '').toLowerCase();

// Mapa de tickers para nomes de busca
const tickerParaNome = {
  'knri': ['kinea renda', 'knri'],
  'mxrf': ['maxi renda', 'mxrf'],
  'hglg': ['cshg logística', 'hglg'],
  'xplg': ['xp log', 'xplg'],
  'visc': ['vinci shopping', 'visc'],
  'jsre': ['js real', 'jsre'],
  'hgic': ['hgi cri', 'hgic', 'hgi'],
  'nexg': ['nex', 'nexg', 'fiagro nexg'],
};

const termosBusca = tickerParaNome[termoBusca] || [termoBusca];

async function buscarRelatoriosFundo() {
  console.log(`🔍 Buscando relatórios do ${ticker}...`);
  console.log(`   Termos de busca: ${termosBusca.join(', ')}\n`);
  
  const pageSize = 100;
  const maxPages = 20; // Buscar mais páginas para fundos antigos
  const allDocuments = [];
  
  for (let page = 0; page < maxPages; page++) {
    const offset = page * pageSize;
    const url = `https://fnet.bmfbovespa.com.br/fnet/publico/pesquisarGerenciadorDocumentosDados?tipoBusca=0&tipoDocumento=1&d=1&s=${offset}&l=${pageSize}`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json'
      }
    });
    
    const result = await response.json();
    if (!result.data || result.data.length === 0) break;
    
    allDocuments.push(...result.data);
    console.log(`📃 Página ${page + 1}: ${result.data.length} documentos`);
    
    await new Promise(r => setTimeout(r, 300));
  }
  
  console.log(`\n📊 Total buscado: ${allDocuments.length} documentos`);
  
  // Filtrar por fundo
  const fundoDocs = allDocuments.filter(doc => {
    const nome = (doc.descricaoFundo || '').toLowerCase();
    const pregao = (doc.nomePregao || '').toLowerCase();
    const info = (doc.informacoesAdicionais || '').toLowerCase();
    
    // Buscar por qualquer termo
    return termosBusca.some(termo => 
      nome.includes(termo) || pregao.includes(termo) || info.includes(termo)
    );
  });
  
  console.log(`🏢 Documentos ${ticker} encontrados: ${fundoDocs.length}\n`);
  
  if (fundoDocs.length === 0) {
    console.log('❌ Nenhum documento encontrado para este fundo.');
    console.log('\n💡 Dica: Verifique o nome do fundo na FNET');
    return;
  }
  
  // Separar por categoria
  const relatorios = fundoDocs.filter(d => 
    d.categoriaDocumento === 'Relatórios' || 
    (d.tipoDocumento && d.tipoDocumento.includes('Relatório'))
  );
  
  const outros = fundoDocs.filter(d => 
    d.categoriaDocumento !== 'Relatórios' && 
    (!d.tipoDocumento || !d.tipoDocumento.includes('Relatório'))
  );
  
  console.log('═'.repeat(60));
  console.log(`📋 RELATÓRIOS ${ticker}:`);
  console.log('═'.repeat(60));
  
  if (relatorios.length > 0) {
    relatorios.slice(0, 10).forEach((rel, i) => {
      console.log(`\n${i + 1}. 📄 ${rel.tipoDocumento || rel.categoriaDocumento}`);
      console.log(`   🏢 ${rel.nomePregao || rel.descricaoFundo.substring(0, 50)}`);
      console.log(`   📅 Data: ${rel.dataEntrega}`);
      console.log(`   📊 Referência: ${rel.dataReferencia || 'N/A'}`);
      console.log(`   🔗 https://fnet.bmfbovespa.com.br/fnet/publico/visualizarDocumento?id=${rel.id}&cvm=true`);
    });
  } else {
    console.log('\n⚠️ Nenhum relatório gerencial encontrado.');
  }
  
  if (outros.length > 0) {
    console.log('\n' + '═'.repeat(60));
    console.log(`📄 OUTROS DOCUMENTOS ${ticker}:`);
    console.log('═'.repeat(60));
    
    outros.slice(0, 5).forEach((doc, i) => {
      console.log(`\n${i + 1}. ${doc.categoriaDocumento} - ${doc.tipoDocumento || ''}`);
      console.log(`   📅 ${doc.dataEntrega}`);
      console.log(`   🔗 https://fnet.bmfbovespa.com.br/fnet/publico/visualizarDocumento?id=${doc.id}&cvm=true`);
    });
  }
  
  console.log('\n' + '═'.repeat(60));
  console.log('✅ Busca concluída!');
}

buscarRelatoriosFundo().catch(console.error);
