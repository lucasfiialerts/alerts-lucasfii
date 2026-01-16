#!/usr/bin/env node

/**
 * Teste direto do serviço FNet com data correta
 */

async function testFNetService() {
  console.log('🧪 Testando serviço FNet com data atual...\n');

  try {
    // Data de hoje no formato correto (DD/MM/YYYY)
    const today = new Date();
    const dateStr = today.toLocaleDateString('pt-BR');
    
    console.log(`📅 Data atual: ${dateStr}`);

    const searchParams = {
      tipoDocumento: '',
      situacao: 'Recebido',
      categoria: 5,  // FII
      modalidade: '',
      periodoDe: '18/11/2024',  // Ontem
      periodoAte: '19/11/2024', // Hoje
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
    console.log('📊 Params:', JSON.stringify(searchParams, null, 2));

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      body: JSON.stringify(searchParams)
    });

    console.log(`📡 Status: ${response.status}`);
    console.log(`📡 Headers:`, Object.fromEntries(response.headers.entries()));
    
    if (response.ok) {
      const result = await response.json();
      console.log(`✅ Resposta recebida`);
      console.log(`📊 Total de documentos: ${result.totalDocumentos || 0}`);
      
      if (result.totalDocumentos > 0) {
        console.log('\n📄 Primeiros documentos:');
        result.dados.slice(0, 5).forEach((doc, index) => {
          console.log(`   ${index + 1}. ${doc.nomeFundo} - ${doc.tipoDocumento}`);
          console.log(`      📅 ${doc.dataRecebimento} | ID: ${doc.id}`);
        });
      } else {
        console.log('📭 Nenhum documento encontrado para o período especificado');
      }
    } else {
      const error = await response.text();
      console.log('❌ Erro na resposta:', response.status, error);
    }

  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  }
}

testFNetService().catch(console.error);