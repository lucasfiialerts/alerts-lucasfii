#!/usr/bin/env node

/**
 * Script para verificar quantos documentos FII existem na API FNet
 */

const https = require('https');

async function verificarTotalDocumentosFNet() {
  console.log('🔍 Verificando total de documentos FII disponíveis na API FNet...\n');

  // Testar diferentes limites
  const testes = [
    { limite: 50, desc: 'Últimos 50 documentos' },
    { limite: 100, desc: 'Últimos 100 documentos' },
    { limite: 200, desc: 'Últimos 200 documentos' }
  ];

  for (const teste of testes) {
    try {
      console.log(`📊 ${teste.desc}:`);
      
      const options = {
        hostname: 'fnet.bmfbovespa.com.br',
        path: `/fnet/publico/pesquisarGerenciadorDocumentosDados?tipoBusca=0&tipoDocumento=1&d=1&s=0&l=${teste.limite}`,
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json',
          'Accept-Language': 'pt-BR,pt;q=0.9',
          'Referer': 'https://fnet.bmfbovespa.com.br/',
          'Origin': 'https://fnet.bmfbovespa.com.br'
        }
      };

      const result = await new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            try {
              if (res.statusCode === 200) {
                resolve(JSON.parse(data));
              } else {
                reject(new Error(`Status ${res.statusCode}`));
              }
            } catch (e) {
              reject(e);
            }
          });
        });
        
        req.on('error', reject);
        req.setTimeout(10000, () => {
          req.destroy();
          reject(new Error('Timeout'));
        });
        req.end();
      });

      console.log(`   📄 Documentos retornados: ${result.data?.length || 0}`);
      console.log(`   📊 Total na base: ${result.recordsTotal || 'N/A'}`);
      console.log(`   🎯 Filtrados: ${result.recordsFiltered || 'N/A'}`);
      
      if (result.data && result.data.length > 0) {
        // Analisar tipos de documentos
        const tiposDoc = {};
        const fundos = new Set();
        
        result.data.forEach(doc => {
          tiposDoc[doc.tipoDocumento] = (tiposDoc[doc.tipoDocumento] || 0) + 1;
          if (doc.descricaoFundo) {
            fundos.add(doc.descricaoFundo.split(' - ')[0]);
          }
        });
        
        console.log(`   🏢 Fundos únicos: ${fundos.size}`);
        console.log('   📋 Tipos de documentos encontrados:');
        Object.entries(tiposDoc).forEach(([tipo, count]) => {
          console.log(`      • ${tipo}: ${count}`);
        });
        
        // Mostrar documentos mais recentes
        console.log('   📅 Documentos mais recentes:');
        result.data.slice(0, 5).forEach((doc, i) => {
          console.log(`      ${i+1}. ${doc.tipoDocumento} - ${doc.descricaoFundo?.substring(0, 40)}... (${doc.dataEntrega})`);
        });
      }
      
      console.log('   ' + '─'.repeat(80));
      
    } catch (error) {
      console.log(`   ❌ Erro: ${error.message}`);
      console.log('   ' + '─'.repeat(80));
    }
  }
  
  // Testar busca específica por código de FII
  console.log('\n🎯 Testando busca específica por FIIs que você acompanha...');
  
  const seusFIIs = ['TRBL11', 'VTLT11', 'BTLG11', 'RBVA11', 'HGBS11', 'GGRC11', 'HGLG11', 'MXRF11', 'HGRE11'];
  
  try {
    const options = {
      hostname: 'fnet.bmfbovespa.com.br',
      path: '/fnet/publico/pesquisarGerenciadorDocumentosDados?tipoBusca=0&tipoDocumento=1&d=1&s=0&l=100',
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
        'Referer': 'https://fnet.bmfbovespa.com.br/'
      }
    };

    const result = await new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            resolve(res.statusCode === 200 ? JSON.parse(data) : {data: []});
          } catch (e) {
            resolve({data: []});
          }
        });
      });
      req.on('error', () => resolve({data: []}));
      req.setTimeout(10000, () => {
        req.destroy();
        resolve({data: []});
      });
      req.end();
    });

    if (result.data) {
      const documentosDosSeusFIIs = result.data.filter(doc => {
        return seusFIIs.some(fii => {
          const codigoFundo = fii.replace('11', '');
          return doc.descricaoFundo?.toUpperCase().includes(codigoFundo.toUpperCase()) ||
                 doc.informacoesAdicionais?.toUpperCase().includes(fii.toUpperCase());
        });
      });

      console.log(`📊 Documentos dos seus FIIs encontrados: ${documentosDosSeusFIIs.length}`);
      
      if (documentosDosSeusFIIs.length > 0) {
        console.log('📋 Documentos específicos dos seus FIIs:');
        documentosDosSeusFIIs.forEach((doc, i) => {
          console.log(`   ${i+1}. ${doc.tipoDocumento} - ${doc.descricaoFundo} (${doc.dataEntrega})`);
        });
      } else {
        console.log('❌ Nenhum documento encontrado para os FIIs que você acompanha hoje');
      }
    }
    
  } catch (error) {
    console.log(`❌ Erro na busca específica: ${error.message}`);
  }
}

verificarTotalDocumentosFNet().catch(console.error);