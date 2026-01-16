/**
 * 🔍 Explorador de API Status Invest - Relatórios e Fatos Relevantes
 * Testa vários endpoints para encontrar dados de documentos FII
 */

const https = require('https');

/**
 * Função genérica para fazer request ao Status Invest
 */
function requestStatusInvest(path) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'statusinvest.com.br',
            path: path,
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'application/json, text/html',
                'Accept-Language': 'pt-BR,pt;q=0.9'
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                resolve({
                    status: res.statusCode,
                    data: data
                });
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
 * Testa vários endpoints do Status Invest
 */
async function explorarStatusInvest(ticker) {
    console.log(`\n🔍 EXPLORANDO API STATUS INVEST - ${ticker}\n`);
    console.log('═══════════════════════════════════════════════════\n');

    const endpoints = [
        {
            nome: 'Dividendos',
            path: `/fii/companytickerprovents?ticker=${ticker}`,
            tipo: 'json'
        },
        {
            nome: 'Página Principal',
            path: `/fundos-imobiliarios/${ticker}`,
            tipo: 'html'
        },
        {
            nome: 'Eventos',
            path: `/fii/ticker-events?ticker=${ticker}`,
            tipo: 'json'
        },
        {
            nome: 'Fatos Relevantes',
            path: `/fii/facts?ticker=${ticker}`,
            tipo: 'json'
        },
        {
            nome: 'Relatórios',
            path: `/fii/reports?ticker=${ticker}`,
            tipo: 'json'
        },
        {
            nome: 'Documentos',
            path: `/fii/documents?ticker=${ticker}`,
            tipo: 'json'
        },
        {
            nome: 'Indicadores',
            path: `/fii/tickerdetails?ticker=${ticker}`,
            tipo: 'json'
        },
        {
            nome: 'Informações Gerais',
            path: `/fii/companyticker?ticker=${ticker}`,
            tipo: 'json'
        },
        {
            nome: 'Dados Financeiros',
            path: `/fii/ticker-financial-data?ticker=${ticker}`,
            tipo: 'json'
        }
    ];

    const resultados = [];

    for (const endpoint of endpoints) {
        try {
            console.log(`📡 Testando: ${endpoint.nome}`);
            console.log(`   URL: https://statusinvest.com.br${endpoint.path}`);
            
            const result = await requestStatusInvest(endpoint.path);
            
            if (result.status === 200) {
                console.log(`   ✅ Status: ${result.status}`);
                
                let preview;
                if (endpoint.tipo === 'json') {
                    try {
                        const json = JSON.parse(result.data);
                        preview = JSON.stringify(json).substring(0, 200);
                        console.log(`   📊 Dados: ${preview}...`);
                        
                        resultados.push({
                            endpoint: endpoint.nome,
                            path: endpoint.path,
                            status: 'sucesso',
                            tamanho: result.data.length,
                            preview: preview,
                            dados: json
                        });
                    } catch (e) {
                        console.log(`   ⚠️  Não é JSON válido`);
                        preview = result.data.substring(0, 200);
                        console.log(`   📄 HTML: ${preview}...`);
                    }
                } else {
                    preview = result.data.substring(0, 200);
                    console.log(`   📄 HTML Preview: ${preview}...`);
                }
            } else {
                console.log(`   ❌ Status: ${result.status}`);
            }
            
            console.log('');
            
            // Delay para não sobrecarregar
            await new Promise(resolve => setTimeout(resolve, 500));
            
        } catch (error) {
            console.log(`   ❌ Erro: ${error.message}\n`);
        }
    }

    return resultados;
}

/**
 * Teste principal
 */
async function main() {
    const ticker = process.argv[2] || 'HGLG11';
    
    try {
        const resultados = await explorarStatusInvest(ticker);
        
        console.log('═══════════════════════════════════════════════════');
        console.log('📊 RESUMO DOS RESULTADOS\n');
        
        const sucessos = resultados.filter(r => r.status === 'sucesso');
        
        if (sucessos.length > 0) {
            console.log(`✅ ${sucessos.length} endpoint(s) funcionando:\n`);
            
            sucessos.forEach(r => {
                console.log(`\n🔹 ${r.endpoint}`);
                console.log(`   Path: ${r.path}`);
                console.log(`   Tamanho: ${r.tamanho} bytes`);
                
                if (r.dados) {
                    console.log(`   Campos disponíveis:`);
                    const campos = Object.keys(r.dados);
                    campos.slice(0, 10).forEach(campo => {
                        console.log(`      • ${campo}`);
                    });
                    if (campos.length > 10) {
                        console.log(`      ... e mais ${campos.length - 10} campos`);
                    }
                }
            });
        } else {
            console.log('❌ Nenhum endpoint funcionou');
        }
        
        console.log('\n═══════════════════════════════════════════════════\n');
        
        // Salvar resultados completos
        const fs = require('fs');
        const outputFile = './logs/status-invest-exploration.json';
        
        fs.mkdirSync('./logs', { recursive: true });
        fs.writeFileSync(outputFile, JSON.stringify(resultados, null, 2));
        
        console.log(`💾 Resultados completos salvos em: ${outputFile}\n`);
        
    } catch (error) {
        console.error('❌ Erro:', error);
    }
}

if (require.main === module) {
    main();
}

module.exports = { explorarStatusInvest, requestStatusInvest };
