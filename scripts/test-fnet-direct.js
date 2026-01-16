#!/usr/bin/env node

/**
 * Teste direto do serviço FNet
 */

async function testFNetService() {
  console.log('🧪 Testando serviço FNet diretamente...\n');

  try {
    // Simular o serviço FNet
    const searchParams = {
      tipoDocumento: '',
      situacao: 'Recebido',
      categoria: 5,  // FII
      modalidade: '',
      periodoDe: '19/11/2025',  // Hoje
      periodoAte: '19/11/2025',
      cnpjFundo: '',  // Vazio para buscar todos
      administrador: '',
      gestor: '',
      auditor: '',
      tipoFundo: '',
      taxa: '',
      classe: '',
      subClasse: '',
      situacaoFundo: '',
      referencia: '',
      exibicaoPaginada: 100,
      indexInicialPagina: 0
    };

    const apiUrl = 'https://fnet.bmfbovespa.com.br/fnet/publico/pesquisarGerenciadorDocumentosDados';
    
    console.log('🔗 URL:', apiUrl);
    console.log('📊 Params:', searchParams);

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      },
      body: JSON.stringify(searchParams)
    });

    console.log(`📡 Status: ${response.status}`);
    
    if (response.ok) {
      const result = await response.json();
      console.log(`✅ Documentos encontrados: ${result.totalDocumentos || 0}`);
      
      if (result.totalDocumentos > 0) {
        console.log('📄 Primeiros documentos:');
        result.dados.slice(0, 3).forEach((doc, index) => {
          console.log(`   ${index + 1}. ${doc.nomeFundo} - ${doc.tipoDocumento}`);
          console.log(`      📅 ${doc.dataRecebimento} | ID: ${doc.id}`);
        });
      }
    } else {
      const error = await response.text();
      console.log('❌ Erro na resposta:', error);
    }

  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  }
}

testFNetService().catch(console.error);