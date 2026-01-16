#!/usr/bin/env node

/**
 * Script para verificar especificamente documentos do RNGO11 (RIO NEGRO)
 */

const https = require('https');

async function verificarRNGO11() {
  console.log('🔍 Verificando especificamente documentos do RNGO11 (RIO NEGRO)...\n');

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

    console.log(`📊 Total de documentos na API: ${result.data?.length || 0}`);
    
    if (result.data && result.data.length > 0) {
      // Procurar por RIO NEGRO / RNGO11
      const documentosRioNegro = result.data.filter(doc => {
        const descricao = doc.descricaoFundo?.toUpperCase() || '';
        const informacoes = doc.informacoesAdicionais?.toUpperCase() || '';
        
        return descricao.includes('RIO NEGRO') || 
               descricao.includes('RNGO') ||
               informacoes.includes('RNGO11') ||
               informacoes.includes('RNGO');
      });

      console.log(`🎯 Documentos do RIO NEGRO/RNGO11 encontrados: ${documentosRioNegro.length}\n`);
      
      if (documentosRioNegro.length > 0) {
        console.log('📄 Documentos do RNGO11 (RIO NEGRO):');
        documentosRioNegro.forEach((doc, i) => {
          console.log(`\n${i+1}. 📋 ${doc.tipoDocumento}`);
          console.log(`   🏢 Fundo: ${doc.descricaoFundo}`);
          console.log(`   📅 Data Entrega: ${doc.dataEntrega}`);
          console.log(`   📊 Data Referência: ${doc.dataReferencia || 'N/A'}`);
          console.log(`   📂 Categoria: ${doc.categoriaDocumento}`);
          console.log(`   ℹ️  Informações Adicionais: ${doc.informacoesAdicionais || 'N/A'}`);
          console.log(`   🆔 ID: ${doc.id}`);
          console.log(`   🔗 Link: https://fnet.bmfbovespa.com.br/fnet/publico/exibirDocumento?id=${doc.id}`);
        });
        
        // Verificar se seria filtrado pelo usuário
        console.log('\n🔍 Verificação de filtro para usuário LucasFII:');
        const fiisLucas = ['GARE11', 'HGRU11', 'HTMX11', 'HSLG11', 'VTLT11', 'RNGO11', 'MXRF11'];
        
        documentosRioNegro.forEach((doc, i) => {
          const match = fiisLucas.some(fii => {
            const codigoFundo = fii.replace('11', '');
            return doc.descricaoFundo?.toUpperCase().includes(codigoFundo.toUpperCase()) ||
                   doc.informacoesAdicionais?.toUpperCase().includes(fii.toUpperCase()) ||
                   doc.descricaoFundo?.toUpperCase().includes('RIO NEGRO');
          });
          
          console.log(`   ${i+1}. ${doc.tipoDocumento} - ${match ? '✅ SERIA ENVIADO' : '❌ NÃO SERIA ENVIADO'}`);
          if (match) {
            console.log(`      Motivo: Corresponde a RNGO11 na lista do usuário`);
          }
        });
        
      } else {
        console.log('❌ Nenhum documento do RNGO11/RIO NEGRO encontrado hoje');
        
        // Buscar termos similares
        console.log('\n🔍 Buscando termos similares...');
        const termosSimilares = result.data.filter(doc => {
          const descricao = doc.descricaoFundo?.toUpperCase() || '';
          return descricao.includes('NEGRO') || descricao.includes('RNG');
        });
        
        if (termosSimilares.length > 0) {
          console.log('📄 Documentos com termos similares:');
          termosSimilares.forEach((doc, i) => {
            console.log(`   ${i+1}. ${doc.descricaoFundo} (${doc.tipoDocumento})`);
          });
        }
      }
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

verificarRNGO11().catch(console.error);