/**
 * Script para testar download e processamento de PDFs do FNet B3
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Função para baixar PDF do documento
async function baixarPDFDocumento(docId) {
  console.log(`📥 Tentando baixar PDF do documento ${docId}...`);
  
  // Testar diferentes endpoints para PDF
  const urlsParaTestar = [
    `https://fnet.bmfbovespa.com.br/fnet/publico/downloadDocumento?id=${docId}&formato=pdf`,
    `https://fnet.bmfbovespa.com.br/fnet/publico/exibirDocumento?id=${docId}&tipo=pdf`,
    `https://fnet.bmfbovespa.com.br/fnet/publico/documento.pdf?id=${docId}`,
    `https://fnet.bmfbovespa.com.br/fnet/publico/visualizarDocumento?id=${docId}&formato=application/pdf`
  ];
  
  for (const url of urlsParaTestar) {
    try {
      console.log(`\n🔍 Testando: ${url}`);
      
      const pdfData = await new Promise((resolve, reject) => {
        const req = https.get(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/pdf, application/octet-stream, */*',
            'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
            'Referer': 'https://fnet.bmfbovespa.com.br/',
            'Origin': 'https://fnet.bmfbovespa.com.br'
          }
        }, (res) => {
          console.log(`   Status: ${res.statusCode}`);
          console.log(`   Content-Type: ${res.headers['content-type']}`);
          console.log(`   Content-Length: ${res.headers['content-length']}`);
          
          if (res.statusCode !== 200) {
            reject(new Error(`Status ${res.statusCode}`));
            return;
          }
          
          const chunks = [];
          res.on('data', chunk => chunks.push(chunk));
          res.on('end', () => {
            const buffer = Buffer.concat(chunks);
            
            // Verificar se é realmente um PDF
            if (buffer.length > 0 && buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46) {
              console.log(`   ✅ PDF válido encontrado! (${buffer.length} bytes)`);
              resolve(buffer);
            } else {
              console.log(`   ❌ Não é um PDF válido. Primeiro bytes: ${buffer.slice(0, 10)}`);
              reject(new Error('Não é um PDF válido'));
            }
          });
        });
        
        req.on('error', reject);
        req.setTimeout(30000, () => {
          req.destroy();
          reject(new Error('Timeout'));
        });
      });
      
      return pdfData;
      
    } catch (error) {
      console.log(`   ❌ Falhou: ${error.message}`);
    }
  }
  
  throw new Error('Nenhuma URL de PDF funcionou');
}

// Função para tentar diferentes estratégias de acesso ao PDF
async function tentarObterPDF(docId) {
  console.log(`🎯 Testando múltiplas estratégias para obter PDF do documento ${docId}`);
  
  try {
    // Estratégia 1: Download direto
    const pdfBuffer = await baixarPDFDocumento(docId);
    
    // Salvar PDF
    const pdfPath = path.join('/tmp', `fnet_${docId}.pdf`);
    fs.writeFileSync(pdfPath, pdfBuffer);
    
    console.log(`✅ PDF salvo com sucesso: ${pdfPath}`);
    console.log(`📊 Tamanho: ${Math.round(pdfBuffer.length / 1024)} KB`);
    
    return pdfPath;
    
  } catch (error) {
    console.log(`❌ Não foi possível baixar PDF: ${error.message}`);
    
    // Estratégia 2: Tentar via navegador simulado (com cookies/sessão)
    console.log('\n🔄 Tentando estratégia alternativa...');
    
    try {
      const htmlResponse = await obterPaginaCompleta(docId);
      console.log('📄 Página HTML obtida, analisando links de PDF...');
      
      // Procurar links de PDF na página
      const pdfLinks = extrairLinksPDF(htmlResponse);
      
      if (pdfLinks.length > 0) {
        console.log(`🔗 Encontrados ${pdfLinks.length} links de PDF:`);
        pdfLinks.forEach((link, i) => console.log(`   ${i + 1}. ${link}`));
        
        // Tentar cada link encontrado
        for (const link of pdfLinks) {
          try {
            const pdfBuffer = await baixarPDFDireto(link);
            const pdfPath = path.join('/tmp', `fnet_${docId}_alt.pdf`);
            fs.writeFileSync(pdfPath, pdfBuffer);
            console.log(`✅ PDF alternativo salvo: ${pdfPath}`);
            return pdfPath;
          } catch (e) {
            console.log(`   ❌ Link ${link} falhou: ${e.message}`);
          }
        }
      }
      
    } catch (altError) {
      console.log(`❌ Estratégia alternativa falhou: ${altError.message}`);
    }
    
    return null;
  }
}

// Função para obter página completa com potenciais links para PDF
async function obterPaginaCompleta(docId) {
  const url = `https://fnet.bmfbovespa.com.br/fnet/publico/visualizarDocumento?id=${docId}`;
  
  return new Promise((resolve, reject) => {
    const req = https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8'
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    });
    
    req.on('error', reject);
    req.setTimeout(15000, () => {
      req.destroy();
      reject(new Error('Timeout'));
    });
  });
}

// Extrair possíveis links de PDF do HTML
function extrairLinksPDF(html) {
  const links = [];
  
  // Padrões para encontrar links de PDF
  const patterns = [
    /href=["']([^"']*\.pdf[^"']*)/gi,
    /href=["']([^"']*downloadDocumento[^"']*)/gi,
    /href=["']([^"']*exibirDocumento[^"']*)/gi,
    /url\(["']?([^"')]*\.pdf[^"')]*)/gi
  ];
  
  patterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(html)) !== null) {
      let link = match[1];
      
      // Converter links relativos em absolutos
      if (link.startsWith('/')) {
        link = 'https://fnet.bmfbovespa.com.br' + link;
      } else if (!link.startsWith('http')) {
        link = 'https://fnet.bmfbovespa.com.br/fnet/publico/' + link;
      }
      
      links.push(link);
    }
  });
  
  // Remover duplicatas
  return [...new Set(links)];
}

// Função para baixar PDF de um link direto
async function baixarPDFDireto(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/pdf, */*'
      }
    }, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`Status ${res.statusCode}`));
        return;
      }
      
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => {
        const buffer = Buffer.concat(chunks);
        if (buffer.length > 0 && buffer[0] === 0x25) { // PDF magic number
          resolve(buffer);
        } else {
          reject(new Error('Não é um PDF válido'));
        }
      });
    });
    
    req.on('error', reject);
    req.setTimeout(20000, () => {
      req.destroy();
      reject(new Error('Timeout'));
    });
  });
}

// Executar teste
async function executarTestePDF() {
  const docId = '1044256'; // Documento RNGO11
  
  console.log('📁 TESTE DE DOWNLOAD DE PDF - FNET B3');
  console.log('=' .repeat(50));
  
  try {
    const pdfPath = await tentarObterPDF(docId);
    
    if (pdfPath) {
      console.log('\n🎉 SUCESSO!');
      console.log(`✅ PDF baixado e salvo em: ${pdfPath}`);
      console.log(`📂 Tamanho: ${fs.statSync(pdfPath).size} bytes`);
      console.log('\n💡 Este PDF pode ser anexado ao WhatsApp ou enviado via link!');
    } else {
      console.log('\n❌ FALHA');
      console.log('❌ Não foi possível obter o PDF por nenhuma estratégia');
      console.log('💡 Continuaremos usando apenas os dados extraídos do XML');
    }
    
  } catch (error) {
    console.error(`❌ Erro geral: ${error.message}`);
  }
}

executarTestePDF();