#!/usr/bin/env node

/**
 * Script de Debug: Testar busca de relatórios
 * Testa a busca de relatórios no Investidor10 para FIIs específicos
 */

async function buscarComunicados(ticker) {
  console.log(`📄 Buscando comunicados de ${ticker}...`);
  
  try {
    const response = await fetch(`https://investidor10.com.br/fiis/${ticker.toLowerCase()}/`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'text/html',
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const html = await response.text();
    const comunicados = [];
    
    // Nova estratégia: buscar por blocos mais amplos
    // Regex melhorado que captura o card inteiro incluindo quebras de linha
    const cardRegex = /<div class="communication-card">([\s\S]*?)<\/a>/gi;
    const matches = html.matchAll(cardRegex);
    
    for (const match of matches) {
      const cardHtml = match[1];
      
      // Extrair título (conteúdo do card)
      const tituloMatch = cardHtml.match(/communication-card--content[^>]*>\s*([^<\n]+)/i);
      const titulo = tituloMatch ? tituloMatch[1].trim() : '';
      
      // Extrair data (dentro de card-date--content)
      const dataMatch = cardHtml.match(/card-date--content[^>]*>\s*([^<\n]+)/i);
      const data = dataMatch ? dataMatch[1].trim() : '';
      
      // Extrair URL (href com link_comunicado)
      const urlMatch = cardHtml.match(/href="([^"]*link_comunicado[^"]*)"/i);
      const url = urlMatch ? urlMatch[1] : '';
      
      if (titulo && url && data) {
        let tipo = 'Comunicado';
        if (/relatório\s+gerencial/i.test(titulo)) tipo = 'Relatório Gerencial';
        else if (/informe\s+mensal/i.test(titulo)) tipo = 'Informe Mensal';
        else if (/fatos?\s+relevantes?/i.test(titulo)) tipo = 'Fato Relevante';
        
        comunicados.push({
          tipo,
          titulo,
          data,
          url: url.startsWith('http') ? url : `https://investidor10.com.br${url}`
        });
      }
    }
    
    return comunicados;
  } catch (error) {
    console.error(`❌ Erro ao buscar comunicados:`, error.message);
    return [];
  }
}

function isDocumentoRecente(dataStr) {
  try {
    // Tentar parsear data no formato DD/MM/YYYY
    const partes = dataStr.match(/(\d{2})\/(\d{2})\/(\d{4})/);
    if (!partes) return false;
    
    const [, dia, mes, ano] = partes;
    const dataDoc = new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia));
    const agora = new Date();
    const diffDias = Math.floor((agora.getTime() - dataDoc.getTime()) / (1000 * 60 * 60 * 24));
    
    return diffDias <= 30;
  } catch {
    return false;
  }
}

async function testarFIIs() {
  // Testar alguns FIIs dos usuários
  const fiis = ['HGRU11', 'HTMX11', 'HGLG11', 'MXRF11', 'GARE11'];
  
  console.log('🔍 Testando busca de relatórios\n');
  console.log('='.repeat(70));
  
  for (const ticker of fiis) {
    console.log(`\n📊 ${ticker}`);
    console.log('-'.repeat(70));
    
    const comunicados = await buscarComunicados(ticker);
    
    console.log(`   Total de comunicados: ${comunicados.length}`);
    
    const relatorio = comunicados.find(c => c.tipo === 'Relatório Gerencial');
    
    if (relatorio) {
      const isRecente = isDocumentoRecente(relatorio.data);
      console.log(`   ✅ Relatório Gerencial encontrado:`);
      console.log(`      Data: ${relatorio.data}`);
      console.log(`      Recente (últimos 30 dias): ${isRecente ? 'SIM ✅' : 'NÃO ❌'}`);
      console.log(`      Título: ${relatorio.titulo}`);
      console.log(`      URL: ${relatorio.url}`);
    } else {
      console.log(`   ❌ Nenhum Relatório Gerencial encontrado`);
      
      if (comunicados.length > 0) {
        console.log(`   Outros comunicados:`);
        comunicados.slice(0, 3).forEach(c => {
          console.log(`      - ${c.tipo}: ${c.data}`);
        });
      }
    }
    
    // Delay entre requisições
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  console.log('\n' + '='.repeat(70));
  console.log('✅ Teste concluído!');
}

testarFIIs().catch(console.error);
