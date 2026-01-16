#!/usr/bin/env node
/**
 * Script para testar busca de relatórios FNET (sem resumo de IA)
 * 
 * Uso: node scripts/test-fnet-relatorios.js [horas]
 * 
 * Exemplo: 
 *   node scripts/test-fnet-relatorios.js 24  # últimas 24 horas
 *   node scripts/test-fnet-relatorios.js 72  # últimas 72 horas
 */

const hoursAgo = parseInt(process.argv[2]) || 24;

/**
 * Extrair ticker a partir do nome de pregão
 * Ex: "FII HGI CRI" -> "HGIC11"
 * Ex: "FIAGRO NEXG" -> "NEXG11"
 */
function extractTickerFromPregao(nomePregao, descricaoFundo) {
  if (!nomePregao || nomePregao.trim() === '') {
    return extractTickerFromFundo(descricaoFundo);
  }
  
  // Remover prefixos e limpar
  let cleanName = nomePregao
    .replace(/^FII\s+/i, '')
    .replace(/^FIAGRO\s+/i, '')
    .trim();
  
  // Se já é um ticker curto (4-5 letras), usar diretamente
  if (cleanName.match(/^[A-Z]{4,5}$/i)) {
    const ticker = cleanName.toUpperCase();
    return ticker + '11';
  }
  
  // Dividir em partes
  const parts = cleanName.split(/\s+/);
  
  let ticker = '';
  if (parts.length === 1) {
    // Uma palavra só, usar até 4 letras
    ticker = parts[0].substring(0, 4).toUpperCase();
  } else if (parts.length >= 2) {
    // Várias palavras: primeira palavra + primeira letra da segunda
    // Ex: "HGI CRI" -> "HGIC"
    const first = parts[0].substring(0, 4);
    const secondInitial = parts[1].charAt(0);
    ticker = (first + secondInitial).substring(0, 4).toUpperCase();
  }
  
  if (ticker && !ticker.match(/\d+$/)) {
    ticker = ticker + '11';
  }
  
  return ticker || 'N/A';
}

function extractTickerFromFundo(descricaoFundo) {
  if (!descricaoFundo) return 'N/A';
  
  const patterns = [
    /([A-Z]{4})\s+FUNDO/i,
    /FII\s+([A-Z]{4,6})/i,
    /^([A-Z]{4,6})\s+/i,
  ];
  
  for (const pattern of patterns) {
    const match = descricaoFundo.match(pattern);
    if (match && match[1]) {
      const ticker = match[1].toUpperCase();
      return ticker.match(/\d+$/) ? ticker : ticker + '11';
    }
  }
  
  const words = descricaoFundo.split(/\s+/).filter(w => w.length > 2);
  if (words.length >= 2) {
    const initials = words.slice(0, 4).map(w => w.charAt(0)).join('').toUpperCase();
    if (initials.length >= 4) {
      return initials.substring(0, 4) + '11';
    }
  }
  
  return 'N/A';
}

async function testFnetRelatorios() {
  console.log('📋 Teste de Busca de Relatórios FNET (sem resumo de IA)');
  console.log('═'.repeat(60));
  console.log(`⏰ Buscando relatórios das últimas ${hoursAgo} horas...\n`);
  
  const pageSize = 100;
  const maxPages = 5;
  const allDocuments = [];
  
  // Calcular data limite
  const limitDate = new Date();
  limitDate.setHours(limitDate.getHours() - hoursAgo);
  
  let foundOldDocument = false;
  
  try {
    // Buscar múltiplas páginas
    for (let page = 0; page < maxPages && !foundOldDocument; page++) {
      const offset = page * pageSize;
      const url = `https://fnet.bmfbovespa.com.br/fnet/publico/pesquisarGerenciadorDocumentosDados?tipoBusca=0&tipoDocumento=1&d=1&s=${offset}&l=${pageSize}`;
      
      console.log(`📃 Buscando página ${page + 1} (offset: ${offset})...`);
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json, text/plain, */*',
          'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
          'Referer': 'https://fnet.bmfbovespa.com.br/fnet/publico/abrirGerenciadorDocumentosCVM',
          'Origin': 'https://fnet.bmfbovespa.com.br'
        }
      });
      
      if (!response.ok) {
        console.error(`❌ Erro na API: ${response.status}`);
        break;
      }
      
      const result = await response.json();
      const docs = result.data || [];
      
      console.log(`   ✅ ${docs.length} documentos encontrados`);
      
      if (docs.length === 0) break;
      
      allDocuments.push(...docs);
      
      // Verificar se o último documento é muito antigo
      if (docs.length > 0) {
        const lastDoc = docs[docs.length - 1];
        const [datePart, timePart] = lastDoc.dataEntrega.split(' ');
        const [day, month, year] = datePart.split('/');
        const [hour, minute] = (timePart || '00:00').split(':');
        const lastDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute));
        
        if (lastDate < limitDate) {
          foundOldDocument = true;
          console.log(`   ⏹️ Encontrado documento antigo, parando busca.`);
        }
      }
      
      // Delay entre páginas
      if (!foundOldDocument && page < maxPages - 1) {
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    }
    
    console.log(`\n📊 Total de documentos buscados: ${allDocuments.length}`);
    
    // Filtrar relatórios recentes
    const relatorios = allDocuments.filter(doc => {
      const isRelatorio = 
        doc.categoriaDocumento === 'Relatórios' ||
        doc.tipoDocumento === 'Relatório Gerencial' ||
        doc.tipoDocumento === 'Outros Relatórios' ||
        doc.tipoDocumento === 'Relatório de Agência de Rating';
      
      if (!isRelatorio) return false;
      
      // Parse da data de entrega (formato: "15/01/2026 09:39")
      const [datePart, timePart] = doc.dataEntrega.split(' ');
      const [day, month, year] = datePart.split('/');
      const [hour, minute] = (timePart || '00:00').split(':');
      const deliveryDate = new Date(
        parseInt(year),
        parseInt(month) - 1,
        parseInt(day),
        parseInt(hour),
        parseInt(minute)
      );
      
      return deliveryDate >= limitDate && doc.status === 'AC';
    });
    
    console.log(`📋 Relatórios encontrados nas últimas ${hoursAgo}h: ${relatorios.length}\n`);
    
    if (relatorios.length === 0) {
      console.log('📭 Nenhum relatório encontrado no período.');
      console.log('   Tente aumentar o período: node scripts/test-fnet-relatorios.js 72');
      return;
    }
    
    console.log('═'.repeat(60));
    console.log('📄 RELATÓRIOS ENCONTRADOS:');
    console.log('═'.repeat(60));
    
    relatorios.forEach((rel, i) => {
      const fundo = rel.nomePregao || rel.descricaoFundo.substring(0, 50);
      const ticker = extractTickerFromPregao(rel.nomePregao, rel.descricaoFundo);
      console.log(`\n${i + 1}. 🏢 ${fundo}`);
      console.log(`   🏷️  Ticker: ${ticker}`);
      console.log(`   📄 Tipo: ${rel.tipoDocumento || rel.categoriaDocumento}`);
      console.log(`   📅 Data: ${rel.dataEntrega}`);
      console.log(`   📊 Referência: ${rel.dataReferencia || 'N/A'}`);
      console.log(`   🔗 Visualizar: https://fnet.bmfbovespa.com.br/fnet/publico/visualizarDocumento?id=${rel.id}&cvm=true`);
      console.log(`   📥 Download: https://fnet.bmfbovespa.com.br/fnet/publico/downloadDocumento?id=${rel.id}`);
    });
    
    console.log('\n' + '═'.repeat(60));
    console.log('📱 EXEMPLO DE MENSAGEM WHATSAPP:');
    console.log('═'.repeat(60));
    
    if (relatorios.length > 0) {
      const sample = relatorios[0];
      const message = formatarMensagem(sample);
      console.log('\n' + message);
    }
    
    console.log('\n' + '═'.repeat(60));
    console.log('✅ Teste concluído com sucesso!');
    console.log('═'.repeat(60));
    
  } catch (error) {
    console.error('❌ Erro ao buscar relatórios:', error.message);
  }
}

function formatarMensagem(relatorio) {
  const fundo = relatorio.nomePregao || relatorio.descricaoFundo.substring(0, 50);
  const tipo = relatorio.tipoDocumento || relatorio.categoriaDocumento;
  const ticker = extractTickerFromPregao(relatorio.nomePregao, relatorio.descricaoFundo);
  const tickerDisplay = ticker !== 'N/A' ? ` (${ticker})` : '';
  
  return `📋 *Novo Relatório Disponível*

🏢 *${fundo}*${tickerDisplay}

📄 *Tipo:* ${tipo}
📅 *Data:* ${relatorio.dataEntrega}
${relatorio.dataReferencia ? `📊 *Referência:* ${relatorio.dataReferencia}` : ''}

🔗 *Visualizar:* https://fnet.bmfbovespa.com.br/fnet/publico/visualizarDocumento?id=${relatorio.id}&cvm=true

📥 *Download:* https://fnet.bmfbovespa.com.br/fnet/publico/downloadDocumento?id=${relatorio.id}`;
}

testFnetRelatorios().catch(console.error);
