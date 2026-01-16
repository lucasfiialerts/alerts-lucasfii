/**
 * 🕷️ Web Scraper para ClubeFII
 * Extrai informações detalhadas sobre FIIs
 */

const https = require('https');
const cheerio = require('cheerio');

/**
 * Busca informações de um FII no ClubeFII
 */
async function buscarFIIClubeFII(ticker) {
    console.log(`\n🕷️ Buscando informações de ${ticker} no ClubeFII...\n`);

    const url = `https://www.clubefii.com.br/fiis/${ticker}`;

    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'www.clubefii.com.br',
            path: `/fiis/${ticker}`,
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
                'Accept-Encoding': 'gzip, deflate, br',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1',
                'Cache-Control': 'max-age=0'
            }
        };

        const req = https.request(options, (res) => {
            console.log(`📊 Status: ${res.statusCode}`);

            if (res.statusCode === 403 || res.statusCode === 503) {
                reject(new Error('Site protegido por Cloudflare. Use API alternativa ou puppeteer.'));
                return;
            }

            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const $ = cheerio.load(data);
                    
                    // Tentar extrair informações (adaptado ao HTML real)
                    const info = {
                        ticker: ticker,
                        nome: $('h1').first().text().trim() || 'N/A',
                        preco: $('.preco, .price, [class*="preco"]').first().text().trim() || 'N/A',
                        dividendYield: $('[class*="dy"], [class*="yield"]').first().text().trim() || 'N/A',
                        pvp: $('[class*="pvp"], [class*="valor-patrimonial"]').first().text().trim() || 'N/A',
                        tipo: $('[class*="tipo"], [class*="segmento"]').first().text().trim() || 'N/A',
                        rawHTML: data.substring(0, 500) // Para debug
                    };

                    resolve(info);
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
}

/**
 * ALTERNATIVA: Usar API do Status Invest (não oficial mas funcional)
 */
async function buscarFIIStatusInvest(ticker) {
    console.log(`\n🔍 Buscando ${ticker} no Status Invest (API alternativa)...\n`);

    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'statusinvest.com.br',
            path: `/fii/companytickerprovents?ticker=${ticker}`,
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'application/json'
            }
        };

        const req = https.request(options, (res) => {
            console.log(`📊 Status Status Invest: ${res.statusCode}`);

            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    if (res.statusCode === 200) {
                        const json = JSON.parse(data);
                        resolve({
                            ticker: ticker,
                            fonte: 'Status Invest',
                            dados: json
                        });
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
}

/**
 * MELHOR OPÇÃO: Usar FundsExplorer (site mais acessível)
 */
async function buscarFIIFundsExplorer(ticker) {
    console.log(`\n📊 Buscando ${ticker} no Funds Explorer...\n`);

    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'www.fundsexplorer.com.br',
            path: `/funds/${ticker}`,
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'pt-BR,pt;q=0.9'
            }
        };

        const req = https.request(options, (res) => {
            console.log(`📊 Status Funds Explorer: ${res.statusCode}`);

            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const $ = cheerio.load(data);
                    
                    const info = {
                        ticker: ticker,
                        fonte: 'Funds Explorer',
                        nome: $('h1, .fund-name').first().text().trim(),
                        preco: $('[class*="price"], [class*="cotacao"]').first().text().trim(),
                        dividendYield: $('[class*="dividend"], [class*="yield"]').first().text().trim(),
                        pvp: $('[class*="pvp"]').first().text().trim(),
                        tipo: $('[class*="tipo"], [class*="category"]').first().text().trim(),
                        ultimoDividendo: $('[class*="ultimo-dividendo"], [class*="last-dividend"]').first().text().trim()
                    };

                    resolve(info);
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
}

/**
 * Função principal - tenta múltiplas fontes
 */
async function buscarInformacoesFII(ticker) {
    const fontes = [
        { nome: 'ClubeFII', fn: buscarFIIClubeFII }, // PRIMEIRO
        { nome: 'Status Invest', fn: buscarFIIStatusInvest },
        { nome: 'Funds Explorer', fn: buscarFIIFundsExplorer }
    ];

    console.log(`🔍 Buscando informações de ${ticker} em múltiplas fontes...\n`);

    for (const fonte of fontes) {
        try {
            console.log(`📡 Tentando ${fonte.nome}...`);
            const resultado = await fonte.fn(ticker);
            
            console.log(`\n✅ Sucesso com ${fonte.nome}!\n`);
            return resultado;
            
        } catch (error) {
            console.log(`   ❌ ${fonte.nome}: ${error.message}`);
        }
    }

    throw new Error('Não foi possível obter informações de nenhuma fonte');
}

/**
 * Teste
 */
async function main() {
    const ticker = process.argv[2] || 'BRCO11';
    
    console.log('\n🕷️ WEB SCRAPER DE FIIs - MÚLTIPLAS FONTES\n');
    console.log('═══════════════════════════════════════════════════\n');

    try {
        const info = await buscarInformacoesFII(ticker);
        
        console.log('═══════════════════════════════════════════════════');
        console.log('📊 INFORMAÇÕES EXTRAÍDAS:\n');
        console.log(JSON.stringify(info, null, 2));
        console.log('\n═══════════════════════════════════════════════════\n');
        
    } catch (error) {
        console.error('\n❌ ERRO:', error.message);
        console.log('\n💡 ALTERNATIVAS:');
        console.log('   1. Use BRAPI (API que você já usa)');
        console.log('   2. Use FundsExplorer API');
        console.log('   3. Use puppeteer para bypass do Cloudflare\n');
    }
}

if (require.main === module) {
    main();
}

module.exports = {
    buscarInformacoesFII,
    buscarFIIStatusInvest,
    buscarFIIFundsExplorer,
    buscarFIIClubeFII
};
