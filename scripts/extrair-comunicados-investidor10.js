/**
 * 📄 Extrator de Comunicados e Relatórios - Investidor10
 * Foca em extrair Relatórios Gerenciais e outros documentos
 */

const https = require('https');
const cheerio = require('cheerio');
const zlib = require('zlib');

/**
 * Busca comunicados e relatórios de um FII no Investidor10
 */
async function buscarComunicadosFII(ticker) {
    console.log(`\n📄 Buscando comunicados de ${ticker} no Investidor10...\n`);

    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'investidor10.com.br',
            path: `/fiis/${ticker.toLowerCase()}/`,
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
                'Accept': 'text/html',
                'Accept-Language': 'pt-BR,pt;q=0.9',
                'Accept-Encoding': 'gzip, deflate, br'
            }
        };

        const req = https.request(options, (res) => {
            console.log(`📊 Status: ${res.statusCode}`);

            let stream = res;
            if (res.headers['content-encoding'] === 'gzip') {
                stream = res.pipe(zlib.createGunzip());
            } else if (res.headers['content-encoding'] === 'br') {
                stream = res.pipe(zlib.createBrotliDecompress());
            }

            let data = '';
            stream.on('data', chunk => data += chunk.toString());
            stream.on('end', () => {
                try {
                    const $ = cheerio.load(data);
                    
                    const comunicados = [];
                    
                    // Buscar pela estrutura específica: .communication-card
                    $('.communication-card').each((i, elem) => {
                        const $card = $(elem);
                        
                        // Título do documento
                        const titulo = $card.find('.communication-card--content, p').first().text().trim();
                        
                        // Data de divulgação
                        const dataElem = $card.find('.card-date--content, .card-date span').last().text().trim();
                        
                        // Link do botão ABRIR
                        const linkElem = $card.find('a.btn-download-communication, a[href*="link_comunicado"]');
                        const url = linkElem.attr('href');
                        
                        if (titulo && url) {
                            // Determinar tipo de documento
                            let tipo = 'Comunicado';
                            if (/relatório\s+gerencial/i.test(titulo)) tipo = 'Relatório Gerencial';
                            else if (/informe\s+mensal/i.test(titulo)) tipo = 'Informe Mensal';
                            else if (/aviso\s+aos\s+acionistas/i.test(titulo)) tipo = 'Aviso aos Acionistas';
                            else if (/fato\s+relevante/i.test(titulo)) tipo = 'Fato Relevante';
                            else if (/distribuiç/i.test(titulo)) tipo = 'Aviso aos Acionistas - Distribuições';
                            
                            comunicados.push({
                                tipo: tipo,
                                titulo: titulo,
                                data: dataElem,
                                url: url.startsWith('http') ? url : `https://investidor10.com.br${url}`
                            });
                            
                            console.log(`✅ Encontrado: ${tipo} - ${dataElem}`);
                        }
                    });

                    resolve({
                        ticker: ticker.toUpperCase(),
                        fonte: 'Investidor10',
                        comunicados: comunicados,
                        htmlSnippet: data.substring(0, 3000)
                    });
                    
                } catch (e) {
                    reject(e);
                }
            });
        });

        req.on('error', reject);
        req.setTimeout(15000, () => {
            req.destroy();
            reject(new Error('Timeout'));
        });
        req.end();
    });
}

/**
 * Baixa um documento/relatório
 */
async function baixarDocumento(url) {
    console.log(`\n📥 Baixando documento: ${url}\n`);

    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        
        const options = {
            hostname: urlObj.hostname,
            path: urlObj.pathname + urlObj.search,
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
                'Accept': 'application/pdf,*/*',
                'Referer': 'https://investidor10.com.br/'
            }
        };

        const req = https.request(options, (res) => {
            console.log(`📊 Status: ${res.statusCode}`);
            console.log(`📦 Content-Type: ${res.headers['content-type']}`);

            if (res.statusCode === 302 || res.statusCode === 301) {
                const redirectUrl = res.headers.location;
                console.log(`↪️  Redirect para: ${redirectUrl}`);
                resolve({ redirect: redirectUrl, tipo: 'redirect' });
                return;
            }

            const chunks = [];
            res.on('data', chunk => chunks.push(chunk));
            res.on('end', () => {
                const buffer = Buffer.concat(chunks);
                
                resolve({
                    buffer: buffer,
                    contentType: res.headers['content-type'],
                    tamanho: buffer.length
                });
            });
        });

        req.on('error', reject);
        req.setTimeout(30000, () => {
            req.destroy();
            reject(new Error('Timeout ao baixar'));
        });
        req.end();
    });
}

/**
 * Teste principal
 */
async function main() {
    const ticker = process.argv[2] || 'KNRI11';
    
    console.log('\n📄 EXTRATOR DE COMUNICADOS - INVESTIDOR10\n');
    console.log('═══════════════════════════════════════════════════\n');

    try {
        // Buscar comunicados
        const resultado = await buscarComunicadosFII(ticker);
        
        console.log('═══════════════════════════════════════════════════');
        console.log(`📊 COMUNICADOS ENCONTRADOS: ${resultado.comunicados.length}\n`);

        if (resultado.comunicados.length > 0) {
            // Agrupar por tipo
            const porTipo = {};
            resultado.comunicados.forEach(com => {
                if (!porTipo[com.tipo]) {
                    porTipo[com.tipo] = [];
                }
                porTipo[com.tipo].push(com);
            });

            Object.entries(porTipo).forEach(([tipo, docs]) => {
                console.log(`\n📋 ${tipo} (${docs.length}):`);
                docs.forEach((doc, i) => {
                    console.log(`   ${i + 1}. ${doc.data || 'S/Data'} - ${doc.titulo}`);
                    console.log(`      URL: ${doc.url}`);
                });
            });

            // Tentar baixar o primeiro Relatório Gerencial
            const relatorioGerencial = resultado.comunicados.find(
                c => c.tipo === 'Relatório Gerencial'
            );

            if (relatorioGerencial) {
                console.log('\n═══════════════════════════════════════════════════');
                console.log('📥 BAIXANDO RELATÓRIO GERENCIAL...\n');
                
                try {
                    const download = await baixarDocumento(relatorioGerencial.url);
                    
                    if (download.redirect) {
                        console.log(`✅ URL do documento: ${download.redirect}`);
                    } else if (download.buffer) {
                        console.log(`✅ Documento baixado: ${(download.tamanho / 1024).toFixed(2)} KB`);
                        console.log(`   Tipo: ${download.contentType}`);
                        
                        // Salvar arquivo
                        const fs = require('fs');
                        fs.mkdirSync('./logs', { recursive: true });
                        const filename = `./logs/relatorio-${ticker}-${Date.now()}.pdf`;
                        fs.writeFileSync(filename, download.buffer);
                        console.log(`💾 Salvo em: ${filename}`);
                    }
                } catch (error) {
                    console.error(`❌ Erro ao baixar: ${error.message}`);
                }
            } else {
                console.log('\n⚠️  Nenhum Relatório Gerencial encontrado na página');
            }
        } else {
            console.log('❌ Nenhum comunicado encontrado');
            console.log('\n🔍 HTML Snippet para debug:\n');
            console.log(resultado.htmlSnippet.substring(0, 1000));
        }

        console.log('\n═══════════════════════════════════════════════════\n');

        // Salvar resultados
        const fs = require('fs');
        fs.mkdirSync('./logs', { recursive: true });
        fs.writeFileSync(
            './logs/investidor10-comunicados.json',
            JSON.stringify(resultado, null, 2)
        );
        console.log('💾 Resultados salvos em: ./logs/investidor10-comunicados.json\n');
        
    } catch (error) {
        console.error('\n❌ Erro:', error.message);
    }
}

if (require.main === module) {
    main();
}

module.exports = { buscarComunicadosFII, baixarDocumento };
