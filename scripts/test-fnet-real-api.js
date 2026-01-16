/**
 * Script para testar o sistema de alertas FNet com dados REAIS da API B3
 * Usa o endpoint correto que funciona!
 */

const https = require('https');

// Função para buscar documentos reais do FNet B3
async function fetchRealFNetDocuments() {
  console.log('🌐 Buscando documentos REAIS do FNet B3...');
  
  try {
    // Usando o endpoint correto que funciona!
    const documents = await makeHttpsRequest({
      hostname: 'fnet.bmfbovespa.com.br',
      path: '/fnet/publico/pesquisarGerenciadorDocumentosDados?tipoBusca=0&tipoDocumento=1&d=1&s=0&l=30',
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Referer': 'https://fnet.bmfbovespa.com.br/',
        'Origin': 'https://fnet.bmfbovespa.com.br'
      }
    });
    
    if (documents && documents.data && documents.data.length > 0) {
      console.log(`✅ SUCESSO! Encontrados ${documents.data.length} documentos reais da API FNet`);
      
      // Transformar dados para o formato do nosso sistema
      const processedDocuments = documents.data.map(doc => ({
        id: doc.id,
        titulo: `${doc.tipoDocumento.trim()} - ${doc.descricaoFundo}`,
        instituicao: doc.descricaoFundo,
        dataReferencia: doc.dataReferencia,
        dataPublicacao: doc.dataEntrega,
        linkPdf: `https://fnet.bmfbovespa.com.br/fnet/publico/exibirDocumento?id=${doc.id}`,
        codigoFundo: extrairCodigoFii(doc.descricaoFundo, doc.nomePregao || doc.informacoesAdicionais),
        tipoDocumento: doc.tipoDocumento.trim(),
        categoriaDocumento: doc.categoriaDocumento,
        status: doc.status,
        fonte: 'FNET_B3_REAL'
      }));
      
      return processedDocuments;
    }
    
    console.log('⚠️ API retornou resposta mas sem documentos');
    return [];
    
  } catch (error) {
    console.log(`❌ Erro na API FNet: ${error.message}`);
    return [];
  }
}

// Função para extrair código do FII do nome do fundo
function extrairCodigoFii(descricaoFundo, informacoes) {
  // Tentar extrair código das informações adicionais primeiro (mais confiável)
  if (informacoes && informacoes.trim()) {
    const info = informacoes.replace(/;/g, '').trim();
    if (info.match(/^[A-Z]{4,6}$/)) {
      return info.toUpperCase();
    }
  }
  
  // Tentar extrair do descricaoFundo
  const patterns = [
    /([A-Z]{4}\d{2})/g,     // Padrão VTLT11, SAPI11
    /([A-Z]{3,6}11)/g,      // Padrão genérico com 11
    /(FII\s+([A-Z]{3,6}))/g // FII + código
  ];
  
  for (const pattern of patterns) {
    const matches = descricaoFundo.match(pattern);
    if (matches && matches[0]) {
      let codigo = matches[0].replace(/FII\s+/i, '').toUpperCase();
      if (codigo.length >= 4 && codigo.length <= 8) {
        return codigo;
      }
    }
  }
  
  // Tentar extrair de palavras específicas conhecidas
  const fundosConhecidos = {
    'POSITIVO': 'POSI',
    'NEGRO': 'RNGO',
    'TARUMÃ': 'TARUMA',
    'TELLUS': 'TLLUS',
    'AGRO': 'AGRO',
    'BTG': 'BTG'
  };
  
  for (const [nome, codigo] of Object.entries(fundosConhecidos)) {
    if (descricaoFundo.toUpperCase().includes(nome)) {
      return codigo + '11';
    }
  }
  
  return 'GERAL';
}

async function makeHttpsRequest(options) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      console.log(`📊 Status: ${res.statusCode} | Content-Type: ${res.headers['content-type']}`);
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          if (res.statusCode === 200) {
            const json = JSON.parse(data);
            resolve(json);
          } else {
            console.log('⚠️ Status não é 200');
            resolve({ data: [] });
          }
        } catch (e) {
          console.log('⚠️ Erro ao parsear JSON:', e.message);
          console.log('📄 Primeiros 300 chars:', data.substring(0, 300));
          resolve({ data: [] });
        }
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    req.setTimeout(20000, () => {
      req.destroy();
      reject(new Error('Timeout de 20s'));
    });

    req.end();
  });
}

function formatFNetAlertForWhatsApp(document) {
  const dataRef = document.dataReferencia || 'N/A';
  const dataPub = document.dataPublicacao ? new Date(document.dataPublicacao).toLocaleDateString('pt-BR') : 'N/A';
  
  return `🏛️ *FNet B3 - Novo Documento*

📋 *${document.tipoDocumento}*
🏢 *${document.codigoFundo}*

📄 *Instituição:* ${document.instituicao.substring(0, 50)}${document.instituicao.length > 50 ? '...' : ''}
📅 *Referência:* ${dataRef}
🕐 *Publicado:* ${dataPub}
📂 *Categoria:* ${document.categoriaDocumento}

🔗 *Acesse o documento:*
${document.linkPdf}

_Alerta FNet B3 - Documentos Oficiais_ ✅`;
}

async function testFNetAlertsReal() {
  try {
    console.log('🚀 INICIANDO TESTE REAL DA API FNET B3');
    console.log('=====================================');
    console.log('⏰ Data/Hora:', new Date().toLocaleString('pt-BR'));
    
    // 1. Buscar documentos reais do FNet
    const realDocuments = await fetchRealFNetDocuments();
    
    console.log('\n📊 RESULTADO DA BUSCA REAL:');
    console.log(`📄 Total de documentos: ${realDocuments.length}`);
    
    if (realDocuments.length === 0) {
      console.log('\n❌ NENHUM DOCUMENTO ENCONTRADO');
      return;
    }
    
    // 2. Mostrar estatísticas
    const stats = {
      rendimentos: realDocuments.filter(d => d.tipoDocumento.includes('Rendimentos')).length,
      informesMensais: realDocuments.filter(d => d.tipoDocumento.includes('Informe Mensal')).length,
      informesTrimestrais: realDocuments.filter(d => d.tipoDocumento.includes('Informe Trimestral')).length,
      assembleias: realDocuments.filter(d => d.categoriaDocumento === 'Assembleia').length,
      outros: realDocuments.filter(d => 
        !d.tipoDocumento.includes('Rendimentos') && 
        !d.tipoDocumento.includes('Informe') && 
        d.categoriaDocumento !== 'Assembleia'
      ).length
    };
    
    console.log('\n📈 ESTATÍSTICAS DOS DOCUMENTOS:');
    console.log(`💰 Rendimentos e Amortizações: ${stats.rendimentos}`);
    console.log(`📊 Informes Mensais: ${stats.informesMensais}`);
    console.log(`📈 Informes Trimestrais: ${stats.informesTrimestrais}`);
    console.log(`🏛️ Assembleias: ${stats.assembleias}`);
    console.log(`📄 Outros documentos: ${stats.outros}`);
    
    // 3. Mostrar exemplos de documentos mais relevantes
    console.log('\n🎯 DOCUMENTOS MAIS RELEVANTES:');
    console.log('='.repeat(60));
    
    // Priorizar rendimentos primeiro
    const documentosRelevantes = [
      ...realDocuments.filter(d => d.tipoDocumento.includes('Rendimentos')),
      ...realDocuments.filter(d => d.categoriaDocumento === 'Assembleia'),
      ...realDocuments.filter(d => d.tipoDocumento.includes('Informe')),
      ...realDocuments.filter(d => 
        !d.tipoDocumento.includes('Rendimentos') && 
        d.categoriaDocumento !== 'Assembleia' && 
        !d.tipoDocumento.includes('Informe')
      )
    ].slice(0, 8); // Mostrar até 8 exemplos
    
    documentosRelevantes.forEach((doc, index) => {
      console.log(`\n📄 DOCUMENTO ${index + 1}:`);
      console.log(`   ID: ${doc.id}`);
      console.log(`   Tipo: ${doc.tipoDocumento}`);
      console.log(`   FII: ${doc.codigoFundo}`);
      console.log(`   Categoria: ${doc.categoriaDocumento}`);
      console.log(`   Referência: ${doc.dataReferencia}`);
      console.log(`   Publicação: ${doc.dataPublicacao}`);
      console.log(`   Link: ${doc.linkPdf}`);
      
      // Mostrar como ficaria a mensagem do WhatsApp
      if (index < 3) { // Mostrar WhatsApp só para os 3 primeiros
        console.log('\n📱 MENSAGEM WHATSAPP:');
        console.log('-'.repeat(40));
        console.log(formatFNetAlertForWhatsApp(doc));
        console.log('-'.repeat(40));
      }
    });
    
    console.log('\n✅ TESTE CONCLUÍDO COM SUCESSO!');
    console.log('\n🎯 RESULTADOS:');
    console.log(`   ✅ API FNet está FUNCIONANDO`);
    console.log(`   ✅ ${realDocuments.length} documentos reais encontrados`);
    console.log(`   ✅ Dados estruturados e processados`);
    console.log(`   ✅ Formatação WhatsApp funcionando`);
    
    console.log('\n🚀 PRÓXIMOS PASSOS:');
    console.log('   1. ✅ Integrar com banco de dados do projeto');
    console.log('   2. ✅ Configurar cron job para busca periódica');
    console.log('   3. ✅ Implementar filtros por FII específico');
    console.log('   4. ✅ Configurar envio real via WhatsApp');
    
    return realDocuments;
    
  } catch (error) {
    console.error('\n❌ ERRO NO TESTE:', error.message);
    console.error('📚 Stack:', error.stack);
    return [];
  }
}

// Executar o teste
console.log('🔥 TESTE REAL DA API FNET B3 - COM DADOS REAIS!');
console.log('===============================================');
testFNetAlertsReal();