/**
 * 🕷️ Web Scraper para ClubeFII com Puppeteer + Stealth
 * Usa browser real para bypassar Cloudflare
 */

const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

/**
 * Busca informações de um FII no ClubeFII usando browser real
 */
async function buscarFIIClubeFIIPuppeteer(ticker) {
    console.log(`\n🌐 Abrindo browser stealth para buscar ${ticker} no ClubeFII...\n`);

    let browser;
    try {
        browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const page = await browser.newPage();
        
        // Simular usuário real
        await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        
        console.log(`📡 Navegando para https://www.clubefii.com.br/fiis/${ticker}...`);
        
        await page.goto(`https://www.clubefii.com.br/fiis/${ticker}`, {
            waitUntil: 'networkidle2',
            timeout: 30000
        });

        console.log('⏳ Aguardando carregamento da página...');
        
        // Aguardar alguns segundos para Cloudflare
        await new Promise(resolve => setTimeout(resolve, 5000));

        // Extrair informações
        const info = await page.evaluate(() => {
            const getText = (selector) => {
                const el = document.querySelector(selector);
                return el ? el.textContent.trim() : 'N/A';
            };

            return {
                // Tentar vários seletores possíveis
                nome: getText('h1') || getText('.fund-name') || getText('[class*="nome"]'),
                preco: getText('[class*="preco"]') || getText('[class*="cotacao"]') || getText('[class*="price"]'),
                dividendYield: getText('[class*="dy"]') || getText('[class*="yield"]'),
                pvp: getText('[class*="pvp"]') || getText('[class*="p/vp"]'),
                tipo: getText('[class*="tipo"]') || getText('[class*="segmento"]'),
                ultimoDividendo: getText('[class*="ultimo"]') || getText('[class*="dividendo"]'),
                liquidezDiaria: getText('[class*="liquidez"]'),
                patrimonio: getText('[class*="patrimonio"]'),
                
                // HTML para debug
                htmlSnippet: document.body.innerHTML.substring(0, 1000)
            };
        });

        console.log('✅ Dados extraídos com sucesso!\n');
        
        return {
            ticker: ticker,
            fonte: 'ClubeFII (Puppeteer)',
            ...info
        };

    } catch (error) {
        console.error('❌ Erro ao buscar ClubeFII:', error.message);
        throw error;
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

/**
 * Teste
 */
async function main() {
    const ticker = process.argv[2] || 'BRCO11';
    
    console.log('\n🕷️ SCRAPER CLUBEFII COM PUPPETEER\n');
    console.log('═══════════════════════════════════════════════════\n');

    try {
        const info = await buscarFIIClubeFIIPuppeteer(ticker);
        
        console.log('═══════════════════════════════════════════════════');
        console.log('📊 INFORMAÇÕES EXTRAÍDAS DO CLUBEFII:\n');
        console.log(`Ticker: ${info.ticker}`);
        console.log(`Nome: ${info.nome}`);
        console.log(`Preço: ${info.preco}`);
        console.log(`Dividend Yield: ${info.dividendYield}`);
        console.log(`P/VP: ${info.pvp}`);
        console.log(`Tipo: ${info.tipo}`);
        console.log(`Último Dividendo: ${info.ultimoDividendo}`);
        console.log(`Liquidez Diária: ${info.liquidezDiaria}`);
        console.log(`Patrimônio: ${info.patrimonio}`);
        console.log('\n═══════════════════════════════════════════════════\n');
        
        console.log('🔍 HTML Snippet (primeiros 1000 chars):\n');
        console.log(info.htmlSnippet);
        console.log('\n═══════════════════════════════════════════════════\n');
        
    } catch (error) {
        console.error('\n❌ ERRO:', error.message);
        console.log('\n💡 O ClubeFII tem proteção Cloudflare forte.');
        console.log('   Pode ser necessário:');
        console.log('   - Aguardar mais tempo');
        console.log('   - Usar puppeteer-extra com stealth plugin');
        console.log('   - Ou continuar usando Status Invest que funciona melhor\n');
    }
}

if (require.main === module) {
    main();
}

module.exports = { buscarFIIClubeFIIPuppeteer };
