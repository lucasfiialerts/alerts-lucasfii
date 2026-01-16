#!/usr/bin/env node

/**
 * Teste da API FNet com a URL correta
 */

async function testFNetCorrect() {
  console.log('🧪 Testando URL correta do FNet...\n');

  try {
    // URL real do FNet com parâmetros GET
    const baseUrl = 'https://fnet.bmfbovespa.com.br/fnet/publico/pesquisarGerenciadorDocumentos';
    
    // Parâmetros para buscar documentos recentes de FIIs
    const params = new URLSearchParams({
      tipoBusca: '0',       // Busca por categoria
      tipoDocumento: '1',   // Documentos de fundos
      d: '1',              // Ordem descendente
      s: '0',              // Start offset
      l: '10'              // Limit
    });

    const url = `${baseUrl}?${params}`;
    
    console.log('🔗 URL teste:', url);

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      }
    });

    console.log(`📡 Status: ${response.status}`);
    
    if (response.ok) {
      const result = await response.json();
      console.log(`✅ Resposta recebida`);
      console.log(`📊 Total: ${result.recordsTotal || 0} documentos`);
      console.log(`📄 Filtrados: ${result.recordsFiltered || 0} documentos`);
      
      if (result.data && result.data.length > 0) {
        console.log('\n📋 Primeiros documentos:');
        result.data.slice(0, 3).forEach((doc, index) => {
          console.log(`   ${index + 1}. ${doc.descricaoFundo || doc.nomeFundo} - ${doc.tipoDocumento}`);
          console.log(`      📅 ${doc.dataEntrega} | Status: ${doc.status}`);
        });
      }
    } else {
      const error = await response.text();
      console.log('❌ Erro:', error.substring(0, 200));
    }

  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  }
}

testFNetCorrect().catch(console.error);