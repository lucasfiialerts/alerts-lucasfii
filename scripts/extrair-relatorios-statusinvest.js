/**
 * 📄 Extrator de Relatórios e Fatos Relevantes - Status Invest
 * Faz scraping da página de relatórios do Status Invest
 */

const https = require('https');
const cheerio = require('cheerio');

/**
 * Busca relatórios e documentos de um FII no Status Invest
 */
async function buscarRelatoriosFII(ticker) {
    console.log(`\n📄 Buscando relatórios de ${ticker} no Status Invest...\n`);

    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'statusinvest.com.br',
            path: `/fii/reports?ticker=${ticker}`,
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'text/html',
                'Accept-Language': 'pt-BR,pt;q=0.9',
                'Referer': `https://statusinvest.com.br/fundos-imobiliarios/${ticker}`
            }
        };

        const req = https.request(options, (res) => {
            console.log(`📊 Status: ${res.statusCode}`);

            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    if (res.statusCode === 200) {
                        const $ = cheerio.load(data);
                        
                        // Extrair relatórios
                        const relatorios = [];
                        
                        // Tentar vários seletores possíveis
                        const seletores = [
                            '.report-item',
                            '.document-item',
                            '[class*="relatorio"]',
                            '[class*="report"]',
                            'table tr',
                            '.list-group-item',
                            'a[href*="pdf"]',
                            'a[href*="download"]',
                            'a[href*="relatorio"]'
                        ];

                        seletores.forEach(seletor => {
                            $(seletor).each((i, elem) => {
                                const $elem = $(elem);
                                const texto = $elem.text().trim();
                                const link = $elem.attr('href') || $elem.find('a').attr('href');
                                
                                if (texto && texto.length > 10) {
                                    relatorios.push({
                                        titulo: texto.substring(0, 200),
                                        link: link,
                                        seletor: seletor
                                    });
                                }
                            });
                        });

                        // Procurar por links de documentos
                        const links = [];
                        $('a').each((i, elem) => {
                            const href = $(elem).attr('href');
                            const texto = $(elem).text().trim();
                            
                            if (href && (
                                href.includes('pdf') || 
                                href.includes('relatorio') ||
                                href.includes('informe') ||
                                href.includes('download')
                            )) {
                                links.push({
                                    texto: texto,
                                    url: href
                                });
                            }
                        });

                        resolve({
                            ticker: ticker,
                            fonte: 'Status Invest - Reports Page',
                            relatorios: relatorios.slice(0, 10),
                            links: links.slice(0, 20),
                            totalRelatorios: relatorios.length,
                            totalLinks: links.length,
                            htmlSnippet: data.substring(0, 2000)
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
 * Busca dados gerais do FII no Status Invest
 */
async function buscarDadosFII(ticker) {
    console.log(`\n🔍 Buscando dados gerais de ${ticker}...\n`);

    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'statusinvest.com.br',
            path: `/fundos-imobiliarios/${ticker.toLowerCase()}`,
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'text/html',
                'Accept-Language': 'pt-BR,pt;q=0.9'
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const $ = cheerio.load(data);
                    
                    const info = {
                        ticker: ticker,
                        nome: $('h1, .company-name').first().text().trim(),
                        preco: $('[title*="Cotação"], [title*="Preço"]').first().text().trim(),
                        dy: $('[title*="Dividend Yield"]').first().text().trim(),
                        pvp: $('[title*="P/VP"]').first().text().trim(),
                        liquidez: $('[title*="Liquidez"]').first().text().trim(),
                        patrimonio: $('[title*="Patrimônio"]').first().text().trim(),
                        
                        // Tentar extrair links de documentos da página principal
                        documentos: []
                    };

                    // Procurar por seção de documentos/relatórios
                    $('a').each((i, elem) => {
                        const href = $(elem).attr('href');
                        const texto = $(elem).text().trim();
                        
                        if (texto && (
                            texto.toLowerCase().includes('relatório') ||
                            texto.toLowerCase().includes('informe') ||
                            texto.toLowerCase().includes('documento') ||
                            texto.toLowerCase().includes('fato relevante')
                        )) {
                            info.documentos.push({
                                texto: texto,
                                link: href
                            });
                        }
                    });

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
 * Teste principal
 */
async function main() {
    const ticker = process.argv[2] || 'HGLG11';
    
    console.log('\n📄 EXTRATOR DE RELATÓRIOS - STATUS INVEST\n');
    console.log('═══════════════════════════════════════════════════\n');

    try {
        // Buscar relatórios
        const relatorios = await buscarRelatoriosFII(ticker);
        
        console.log('═══════════════════════════════════════════════════');
        console.log('📊 RELATÓRIOS ENCONTRADOS:\n');
        console.log(`Total de itens: ${relatorios.totalRelatorios}`);
        console.log(`Total de links: ${relatorios.totalLinks}\n`);

        if (relatorios.links.length > 0) {
            console.log('🔗 Links encontrados:\n');
            relatorios.links.forEach((link, i) => {
                console.log(`${i + 1}. ${link.texto}`);
                console.log(`   URL: ${link.url}\n`);
            });
        }

        // Buscar dados gerais
        console.log('\n═══════════════════════════════════════════════════');
        console.log('📈 DADOS GERAIS DO FII:\n');
        
        const dados = await buscarDadosFII(ticker);
        console.log(`Nome: ${dados.nome}`);
        console.log(`Preço: ${dados.preco}`);
        console.log(`DY: ${dados.dy}`);
        console.log(`P/VP: ${dados.pvp}`);
        console.log(`Liquidez: ${dados.liquidez}`);
        console.log(`Patrimônio: ${dados.patrimonio}`);
        
        if (dados.documentos.length > 0) {
            console.log(`\n📄 Documentos na página principal: ${dados.documentos.length}`);
            dados.documentos.forEach((doc, i) => {
                console.log(`   ${i + 1}. ${doc.texto}`);
            });
        }

        console.log('\n═══════════════════════════════════════════════════\n');

        // Salvar resultados
        const fs = require('fs');
        fs.mkdirSync('./logs', { recursive: true });
        fs.writeFileSync('./logs/status-invest-relatorios.json', JSON.stringify({
            relatorios,
            dados
        }, null, 2));
        
        console.log('💾 Resultados salvos em: ./logs/status-invest-relatorios.json\n');
        
    } catch (error) {
        console.error('\n❌ Erro:', error.message);
    }
}

if (require.main === module) {
    main();
}

module.exports = { buscarRelatoriosFII, buscarDadosFII };
