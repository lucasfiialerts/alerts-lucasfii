#!/usr/bin/env node

/**
 * Teste simples da URL base do FNet
 */

async function testFNetBase() {
  console.log('🧪 Testando URLs base do FNet...\n');

  const urls = [
    'https://fnet.bmfbovespa.com.br',
    'https://fnet.bmfbovespa.com.br/fnet/publico',
    'https://www.rad.cvm.gov.br/ENET/frmConsultaExternaCVM.aspx'
  ];

  for (const url of urls) {
    try {
      console.log(`🔗 Testando: ${url}`);
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        }
      });

      console.log(`📡 Status: ${response.status}`);
      
      if (response.ok) {
        const text = await response.text();
        console.log(`✅ Resposta recebida (${text.length} chars)`);
        
        // Verificar se é HTML válido
        if (text.includes('<html') || text.includes('<!DOCTYPE')) {
          console.log('📄 HTML válido encontrado');
          
          // Procurar por APIs ou endpoints relevantes
          if (text.includes('pesquisar') || text.includes('documentos')) {
            console.log('🎯 Conteúdo relacionado a pesquisa/documentos encontrado');
          }
        }
      } else {
        console.log(`❌ Erro: ${response.status}`);
      }
      
      console.log('─'.repeat(50));
      
    } catch (error) {
      console.error(`❌ Erro ao testar ${url}:`, error.message);
      console.log('─'.repeat(50));
    }
  }
  
  // Tentar uma abordagem alternativa - simular dados de exemplo
  console.log('\n💡 Criando dados de exemplo para teste...');
  
  const exampleDocument = {
    fundoName: 'VTLT11 - VALORCASA TIJUCA FII',
    documentType: 'Rendimentos e Amortizações',
    category: 'Comunicado ao Mercado',
    dataEntrega: '19/11/2024',
    dataReferencia: 'Novembro/2024',
    documentId: 123456,
    description: 'VTLT11 divulgou informações sobre rendimentos - 19/11/2024'
  };
  
  console.log('📄 Exemplo de documento:', JSON.stringify(exampleDocument, null, 2));
  
  // Formatar para WhatsApp
  const whatsappMessage = `💰 *${exampleDocument.fundoName}*
  
📋 *Tipo:* ${exampleDocument.documentType}
📅 *Data:* ${exampleDocument.dataEntrega}
📊 *Referência:* ${exampleDocument.dataReferencia}

${exampleDocument.description}

Para ver o documento completo, acesse: https://fnet.bmfbovespa.com.br/fnet/publico/exibirDocumento?id=${exampleDocument.documentId}`;

  console.log('\n📱 Mensagem WhatsApp formatada:');
  console.log(whatsappMessage);
}

testFNetBase().catch(console.error);