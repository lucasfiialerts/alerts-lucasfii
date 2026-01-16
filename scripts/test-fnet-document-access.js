/**
 * Script para testar diferentes formas de acesso aos documentos do FNet B3
 */

const https = require('https');

// Testar diferentes URLs para acessar o documento
async function testarAcessoDocumento(docId) {
  console.log(`🔍 Testando acesso ao documento ID: ${docId}`);
  
  const urlsParaTestar = [
    `https://fnet.bmfbovespa.com.br/fnet/publico/exibirDocumento?id=${docId}`,
    `https://fnet.bmfbovespa.com.br/fnet/publico/visualizarDocumento?id=${docId}`,
    `https://fnet.bmfbovespa.com.br/fnet/publico/downloadDocumento?id=${docId}`,
    `https://fnet.bmfbovespa.com.br/fnet/publico/documento/${docId}`,
    `https://fnet.bmfbovespa.com.br/fnet/publico/documento?id=${docId}`,
    `https://fnet.bmfbovespa.com.br/fnet/publico/abrirDocumento?id=${docId}`
  ];
  
  for (const url of urlsParaTestar) {
    try {
      console.log(`\n📋 Testando: ${url}`);
      
      const response = await new Promise((resolve, reject) => {
        const req = https.get(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
            'Referer': 'https://fnet.bmfbovespa.com.br/',
            'Origin': 'https://fnet.bmfbovespa.com.br'
          }
        }, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, data: data.substring(0, 500) }));
        });
        
        req.on('error', reject);
        req.setTimeout(10000, () => {
          req.destroy();
          reject(new Error('Timeout'));
        });
      });
      
      console.log(`   Status: ${response.status}`);
      console.log(`   Content-Type: ${response.headers['content-type']}`);
      console.log(`   Content-Length: ${response.headers['content-length']}`);
      
      if (response.headers['content-type']?.includes('pdf')) {
        console.log(`   ✅ PDF encontrado!`);
      } else if (response.data.includes('Esta informação não está disponível')) {
        console.log(`   ❌ Documento não disponível`);
      } else if (response.data.includes('<html>')) {
        console.log(`   ⚠️ Página HTML retornada`);
      } else {
        console.log(`   📄 Conteúdo: ${response.data.substring(0, 100)}...`);
      }
      
    } catch (error) {
      console.log(`   ❌ Erro: ${error.message}`);
    }
  }
}

// Testar também busca de metadados do documento
async function buscarMetadadosDocumento(docId) {
  console.log(`\n🔍 Buscando metadados do documento ${docId}...`);
  
  try {
    const response = await new Promise((resolve, reject) => {
      const options = {
        hostname: 'fnet.bmfbovespa.com.br',
        path: `/fnet/publico/pesquisarGerenciadorDocumentosDados?tipoBusca=0&tipoDocumento=1&d=1&s=0&l=100`,
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json, text/plain, */*',
          'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
          'Referer': 'https://fnet.bmfbovespa.com.br/',
          'Origin': 'https://fnet.bmfbovespa.com.br'
        }
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve(JSON.parse(data)));
      });

      req.on('error', reject);
      req.setTimeout(15000, () => {
        req.destroy();
        reject(new Error('Timeout'));
      });

      req.end();
    });
    
    // Procurar o documento específico
    const documento = response.data?.find(doc => doc.id.toString() === docId);
    
    if (documento) {
      console.log(`✅ Documento encontrado:`);
      console.log(`   ID: ${documento.id}`);
      console.log(`   Tipo: ${documento.tipoDocumento}`);
      console.log(`   Fundo: ${documento.descricaoFundo}`);
      console.log(`   Data Entrega: ${documento.dataEntrega}`);
      console.log(`   Categoria: ${documento.categoriaDocumento}`);
      
      // Verificar se tem informações de URL alternativa
      if (documento.linkDocumento) {
        console.log(`   🔗 Link Alternativo: ${documento.linkDocumento}`);
      }
      
      if (documento.urlDownload) {
        console.log(`   📥 URL Download: ${documento.urlDownload}`);
      }
      
      return documento;
    } else {
      console.log(`❌ Documento ${docId} não encontrado nos resultados`);
      return null;
    }
    
  } catch (error) {
    console.log(`❌ Erro ao buscar metadados: ${error.message}`);
    return null;
  }
}

// Executar testes
async function executarTestes() {
  const docId = '1044256'; // ID do documento RNGO11
  
  console.log('🧪 TESTE DE ACESSO A DOCUMENTOS FNET B3');
  console.log('=' .repeat(50));
  
  // Primeiro buscar metadados
  const metadados = await buscarMetadadosDocumento(docId);
  
  // Depois testar URLs
  await testarAcessoDocumento(docId);
  
  console.log('\n💡 CONCLUSÕES:');
  console.log('- Verificar se há forma alternativa de acessar documentos');
  console.log('- Investigar se precisa de autenticação ou sessão');
  console.log('- Buscar documentação oficial da API FNet');
}

executarTestes();