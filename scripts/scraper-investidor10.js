/**
 * 🕷️ Web Scraper para Investidor10
 * Extrai informações detalhadas sobre FIIs
 */

const https = require('https');
const cheerio = require('cheerio');
const zlib = require('zlib');

/**
 * Busca informações de um FII no Investidor10
 */
async function buscarFIIInvestidor10(ticker) {
    console.log(`\n🔍 Buscando ${ticker} no Investidor10...\n`);

    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'investidor10.com.br',
            path: `/fiis/${ticker.toLowerCase()}/`,
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
                'Accept-Encoding': 'gzip, deflate, br',
                'Connection': 'keep-alive',
                'Cache-Control': 'max-age=0'
            }
        };

        const req = https.request(options, (res) => {
            console.log(`📊 Status: ${res.statusCode}`);
            console.log(`📦 Encoding: ${res.headers['content-encoding']}`);

            if (res.statusCode === 403 || res.statusCode === 503) {
                reject(new Error('Site protegido. Tentando novamente...'));
                return;
            }

            let stream = res;
            
            // Descomprimir se necessário
            if (res.headers['content-encoding'] === 'gzip') {
                stream = res.pipe(zlib.createGunzip());
            } else if (res.headers['content-encoding'] === 'deflate') {
                stream = res.pipe(zlib.createInflate());
            } else if (res.headers['content-encoding'] === 'br') {
                stream = res.pipe(zlib.createBrotliDecompress());
            }

            let data = '';
            stream.on('data', chunk => data += chunk.toString());
            stream.on('end', () => {
                try {
                    const $ = cheerio.load(data);
                    
                    // Extrair informações usando seletores do Investidor10
                    const info = {
                        ticker: ticker.toUpperCase(),
                        fonte: 'Investidor10',
                        
                        // Informações básicas
                        nome: $('h1, .page-title, [class*="title"]').first().text().trim(),
                        preco: $('[class*="cotacao"], [class*="price"], ._card-body .value').first().text().trim(),
                        
                        // Indicadores
                        dividendYield: $('[title*="Dividend"], [class*="dy"]').text().trim(),
                        pvp: $('[title*="P/VP"], [title*="Preço/Valor"]').text().trim(),
                        liquidez: $('[title*="Liquidez"]').text().trim(),
                        vacancia: $('[title*="Vacância"], [title*="vacancia"]').text().trim(),
                        
                        // Informações específicas
                        tipo: $('[class*="tipo"], [class*="segmento"]').text().trim(),
                        setor: $('[class*="setor"]').text().trim(),
                        
                        // Relatórios e documentos
                        documentos: [],
                        relatorios: [],
                        fatosRelevantes: []
                    };

                    // Buscar links de documentos
                    $('a').each((i, elem) => {
                        const href = $(elem).attr('href');
                        const texto = $(elem).text().trim();
                        
                        if (texto && href) {
                            const textoLower = texto.toLowerCase();
                            
                            // Relatórios
                            if (textoLower.includes('relatório') || textoLower.includes('informe')) {
                                info.relatorios.push({
                                    titulo: texto,
                                    url: href
                                });
                            }
                            
                            // Fatos relevantes
                            if (textoLower.includes('fato relevante') || textoLower.includes('comunicado')) {
                                info.fatosRelevantes.push({
                                    titulo: texto,
                                    url: href
                                });
                            }
                            
                            // Documentos gerais
                            if (textoLower.includes('documento') || href.includes('.pdf')) {
                                info.documentos.push({
                                    titulo: texto,
                                    url: href
                                });
                            }
                        }
                    });

                    // Extrair todos os cards de informação
                    const cards = [];
                    $('._card, .card, [class*="indicador"]').each((i, elem) => {
                        const $card = $(elem);
                        const titulo = $card.find('[class*="title"], [class*="label"], strong, b').first().text().trim();
                        const valor = $card.find('[class*="value"], [class*="numero"], span').first().text().trim();
                        
                        if (titulo && valor && titulo !== valor) {
                            cards.push({
                                titulo: titulo,
                                valor: valor
                            });
                        }
                    });

                    info.cards = cards;
                    
                    // HTML para debug
                    info.htmlSnippet = data.substring(0, 2000);
                    
                    resolve(info);
                    
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
 * Teste
 */
async function main() {
    const ticker = process.argv[2] || 'KNRI11';
    
    console.log('\n🕷️ SCRAPER INVESTIDOR10\n');
    console.log('═══════════════════════════════════════════════════\n');

    try {
        const info = await buscarFIIInvestidor10(ticker);
        
        console.log('═══════════════════════════════════════════════════');
        console.log('📊 INFORMAÇÕES EXTRAÍDAS:\n');
        console.log(`Ticker: ${info.ticker}`);
        console.log(`Nome: ${info.nome}`);
        console.log(`Preço: ${info.preco}`);
        console.log(`Dividend Yield: ${info.dividendYield}`);
        console.log(`P/VP: ${info.pvp}`);
        console.log(`Liquidez: ${info.liquidez}`);
        console.log(`Vacância: ${info.vacancia}`);
        console.log(`Tipo: ${info.tipo}`);
        console.log(`Setor: ${info.setor}`);
        
        if (info.cards.length > 0) {
            console.log(`\n📋 Cards/Indicadores encontrados: ${info.cards.length}`);
            info.cards.slice(0, 10).forEach((card, i) => {
                console.log(`   ${i + 1}. ${card.titulo}: ${card.valor}`);
            });
            if (info.cards.length > 10) {
                console.log(`   ... e mais ${info.cards.length - 10} cards`);
            }
        }

        if (info.relatorios.length > 0) {
            console.log(`\n📄 Relatórios encontrados: ${info.relatorios.length}`);
            info.relatorios.forEach((rel, i) => {
                console.log(`   ${i + 1}. ${rel.titulo}`);
                console.log(`      URL: ${rel.url}`);
            });
        }

        if (info.fatosRelevantes.length > 0) {
            console.log(`\n⚠️  Fatos Relevantes encontrados: ${info.fatosRelevantes.length}`);
            info.fatosRelevantes.forEach((fato, i) => {
                console.log(`   ${i + 1}. ${fato.titulo}`);
                console.log(`      URL: ${fato.url}`);
            });
        }

        if (info.documentos.length > 0) {
            console.log(`\n📑 Documentos encontrados: ${info.documentos.length}`);
            info.documentos.slice(0, 5).forEach((doc, i) => {
                console.log(`   ${i + 1}. ${doc.titulo}`);
            });
        }

        console.log('\n═══════════════════════════════════════════════════\n');
        
        console.log('🔍 HTML Snippet (primeiros 2000 chars):\n');
        console.log(info.htmlSnippet.substring(0, 500) + '...\n');

        // Salvar resultados
        const fs = require('fs');
        fs.mkdirSync('./logs', { recursive: true });
        fs.writeFileSync('./logs/investidor10-data.json', JSON.stringify(info, null, 2));
        
        console.log('💾 Resultados completos salvos em: ./logs/investidor10-data.json\n');
        
    } catch (error) {
        console.error('\n❌ ERRO:', error.message);
        console.log('\n💡 Possíveis soluções:');
        console.log('   1. O site pode estar temporariamente indisponível');
        console.log('   2. Pode ter proteção Cloudflare (similar ao ClubeFII)');
        console.log('   3. Use FNET B3 que você já tem implementado\n');
    }
}

if (require.main === module) {
    main();
}

module.exports = { buscarFIIInvestidor10 };
