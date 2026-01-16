/**
 * 🤖 Sistema Inteligente de Resumo de Fatos Relevantes
 * 
 * Integra múltiplas fontes de dados:
 * - BRAPI: Dividendos e dados básicos
 * - FNET B3: Documentos oficiais
 * - Status Invest: Fatos relevantes
 * 
 * Usa IA para gerar resumo e envia via WhatsApp
 */

const https = require('https');
const { google } = require('@ai-sdk/google');
const { generateText } = require('ai');
require('dotenv').config();

/**
 * 1. Busca fatos relevantes do Status Invest
 */
async function buscarFatosRelevantesStatusInvest(ticker) {
    console.log(`📊 Buscando fatos relevantes de ${ticker} no Status Invest...`);
    
    try {
        const response = await fetch(
            `https://statusinvest.com.br/fii/companytickerprovents?ticker=${ticker}`,
            {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            }
        );

        if (response.ok) {
            const data = await response.json();
            return data;
        }
        return null;
    } catch (error) {
        console.error(`❌ Erro ao buscar Status Invest:`, error.message);
        return null;
    }
}

/**
 * 2. Busca dividendos da BRAPI
 */
async function buscarDividendosBRAPI(ticker) {
    console.log(`💰 Buscando dividendos de ${ticker} na BRAPI...`);
    
    const token = process.env.BRAPI_TOKEN;
    const url = `https://brapi.dev/api/quote/${ticker}?token=${token}&dividends=true`;
    
    try {
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.results && data.results[0]) {
            return data.results[0];
        }
        return null;
    } catch (error) {
        console.error(`❌ Erro ao buscar BRAPI:`, error.message);
        return null;
    }
}

/**
 * 3. Busca documentos do FNET B3
 */
async function buscarDocumentosFNET(nomeFundo) {
    console.log(`🏛️ Buscando documentos do FNET B3 para ${nomeFundo}...`);
    
    return new Promise((resolve) => {
        const options = {
            hostname: 'fnet.bmfbovespa.com.br',
            path: '/fnet/publico/pesquisarGerenciadorDocumentosDados?tipoBusca=0&tipoDocumento=1&d=1&s=0&l=30',
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0',
                'Accept': 'application/json'
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    if (res.statusCode === 200) {
                        const json = JSON.parse(data);
                        // Filtrar documentos deste fundo
                        const docs = json.data?.filter(doc => 
                            doc.descricaoFundo?.toLowerCase().includes(nomeFundo.toLowerCase()) ||
                            doc.descricaoFundo?.includes(nomeFundo.toUpperCase())
                        ) || [];
                        resolve(docs);
                    } else {
                        resolve([]);
                    }
                } catch (e) {
                    resolve([]);
                }
            });
        });

        req.on('error', () => resolve([]));
        req.setTimeout(10000, () => {
            req.destroy();
            resolve([]);
        });
        req.end();
    });
}

/**
 * 4. Consolida todas as informações
 */
async function consolidarInformacoes(ticker) {
    console.log(`\n🔄 Consolidando informações de ${ticker}...\n`);

    const [brapi, statusInvest, fnetDocs] = await Promise.all([
        buscarDividendosBRAPI(ticker),
        buscarFatosRelevantesStatusInvest(ticker),
        buscarDocumentosFNET(ticker)
    ]);

    return {
        ticker,
        brapi,
        statusInvest,
        fnetDocs,
        timestamp: new Date().toISOString()
    };
}

/**
 * 5. Gera resumo inteligente com IA
 */
async function gerarResumoInteligente(dados) {
    console.log(`🤖 Gerando resumo inteligente com IA...`);

    const prompt = `Você é um analista especialista em Fundos Imobiliários. Analise os dados abaixo e crie um resumo executivo claro e acionável para investidores.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 DADOS DO FII: ${dados.ticker}

${dados.brapi ? `
💰 INFORMAÇÕES BÁSICAS (BRAPI):
• Nome: ${dados.brapi.shortName}
• Preço: R$ ${dados.brapi.regularMarketPrice?.toFixed(2)}
• Variação: ${dados.brapi.regularMarketChangePercent?.toFixed(2)}%
• Volume: ${dados.brapi.regularMarketVolume?.toLocaleString()}
• Máxima 52 semanas: R$ ${dados.brapi.fiftyTwoWeekHigh?.toFixed(2)}
• Mínima 52 semanas: R$ ${dados.brapi.fiftyTwoWeekLow?.toFixed(2)}

📈 ÚLTIMOS DIVIDENDOS:
${dados.brapi.dividendsData?.cashDividends?.slice(0, 5).map(div => 
    `• ${div.paymentDate}: R$ ${div.rate?.toFixed(2)} (${div.label})`
).join('\n') || 'Sem dados de dividendos'}
` : ''}

${dados.statusInvest ? `
📋 STATUS INVEST:
${JSON.stringify(dados.statusInvest, null, 2).substring(0, 500)}
` : ''}

${dados.fnetDocs && dados.fnetDocs.length > 0 ? `
🏛️ DOCUMENTOS RECENTES (FNET B3):
${dados.fnetDocs.slice(0, 3).map(doc => 
    `• ${doc.tipoDocumento} - ${doc.dataEntrega || 'N/A'}`
).join('\n')}
` : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Por favor, forneça um resumo estruturado seguindo este formato:

🎯 **RESUMO EXECUTIVO**
[Visão geral do FII em 2-3 frases]

📊 **ANÁLISE DE DESEMPENHO**
• Cotação e tendência
• Histórico recente
• Volume de negociação

💰 **DIVIDENDOS E YIELD**
• Últimos pagamentos
• Análise da consistência
• Projeção (se possível)

📈 **PONTOS POSITIVOS**
[Bullets]

⚠️ **PONTOS DE ATENÇÃO**
[Bullets]

💡 **RECOMENDAÇÃO**
[Análise objetiva para investidores]

IMPORTANTE:
- Seja objetivo e direto
- Use linguagem clara
- Foque em informações acionáveis
- Destaque oportunidades e riscos`;

    try {
        const { text } = await generateText({
            model: google('models/gemini-2.0-flash-exp'),
            prompt: prompt,
            maxTokens: 2000
        });

        return text;
    } catch (error) {
        console.error('❌ Erro ao gerar resumo com IA:', error);
        
        // Resumo básico em caso de erro
        return `📊 *${dados.ticker}*

💰 Preço: R$ ${dados.brapi?.regularMarketPrice?.toFixed(2) || 'N/A'}
📈 Variação: ${dados.brapi?.regularMarketChangePercent?.toFixed(2)}%

Último dividendo: R$ ${dados.brapi?.dividendsData?.cashDividends?.[0]?.rate?.toFixed(2) || 'N/A'}

[Erro ao gerar análise completa com IA]`;
    }
}

/**
 * 6. Envia resumo via WhatsApp
 */
async function enviarResumoWhatsApp(ticker, resumo, usuarios) {
    console.log(`📱 Enviando resumo via WhatsApp para ${usuarios.length} usuários...`);

    const mensagem = `📊 *Análise Inteligente - ${ticker}*

${resumo}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
_Análise gerada automaticamente com IA_ ✨
_Data: ${new Date().toLocaleString('pt-BR')}_`;

    // Importar função de envio do WhatsApp
    const { enviarMensagemWhatsApp } = require('./enviar-fnet-direto');
    
    let enviados = 0;
    for (const usuario of usuarios) {
        try {
            if (usuario.whatsappNumber && usuario.whatsappVerified) {
                await enviarMensagemWhatsApp(usuario.whatsappNumber, mensagem);
                console.log(`  ✅ Enviado para ${usuario.name || usuario.email}`);
                enviados++;
                
                // Delay entre envios
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        } catch (error) {
            console.error(`  ❌ Erro ao enviar para ${usuario.name}:`, error.message);
        }
    }

    return enviados;
}

/**
 * 7. Busca usuários que seguem o FII
 */
async function buscarUsuariosDoFII(ticker) {
    try {
        const baseURL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const response = await fetch(`${baseURL}/api/test-user-details`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ticker })
        });

        if (response.ok) {
            const data = await response.json();
            return data.users || [];
        }
        return [];
    } catch (error) {
        console.error('Erro ao buscar usuários:', error);
        return [];
    }
}

/**
 * Função principal
 */
async function processarFII(ticker) {
    console.log('\n🤖 SISTEMA DE RESUMO INTELIGENTE DE FIIs\n');
    console.log('═══════════════════════════════════════════════════\n');
    console.log(`📊 Analisando: ${ticker}`);
    console.log(`📅 ${new Date().toLocaleString('pt-BR')}\n`);

    try {
        // 1. Consolidar informações de múltiplas fontes
        const dados = await consolidarInformacoes(ticker);
        
        if (!dados.brapi) {
            console.log(`❌ FII ${ticker} não encontrado na BRAPI`);
            return;
        }

        // 2. Gerar resumo com IA
        const resumo = await gerarResumoInteligente(dados);
        
        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📄 RESUMO GERADO:\n');
        console.log(resumo);
        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        // 3. Buscar usuários interessados
        const usuarios = await buscarUsuariosDoFII(ticker);
        console.log(`👥 ${usuarios.length} usuários seguem este FII`);

        // 4. Enviar via WhatsApp
        if (usuarios.length > 0) {
            const enviados = await enviarResumoWhatsApp(ticker, resumo, usuarios);
            console.log(`✅ ${enviados} mensagens enviadas\n`);
        }

        console.log('═══════════════════════════════════════════════════');
        console.log('✅ Processamento concluído!\n');

        return { success: true, resumo, usuariosNotificados: usuarios.length };

    } catch (error) {
        console.error('\n❌ Erro no processamento:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Processa múltiplos FIIs em lote
 */
async function processarMultiplosFIIs(tickers) {
    console.log(`\n🚀 Processando ${tickers.length} FIIs...\n`);
    
    const resultados = [];
    
    for (const ticker of tickers) {
        const resultado = await processarFII(ticker);
        resultados.push({ ticker, ...resultado });
        
        // Delay entre FIIs
        await new Promise(resolve => setTimeout(resolve, 5000));
    }

    return resultados;
}

// Executar
if (require.main === module) {
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
        console.log('❌ Uso: node resumo-fii-ia.js <TICKER1> [TICKER2] ...');
        console.log('Exemplo: node resumo-fii-ia.js VTLT11 SAPI11 HGLG11');
        process.exit(1);
    }

    processarMultiplosFIIs(args)
        .then(resultados => {
            console.log('\n📊 RESUMO FINAL:');
            resultados.forEach(r => {
                console.log(`  ${r.ticker}: ${r.success ? '✅' : '❌'} (${r.usuariosNotificados || 0} notificados)`);
            });
        })
        .catch(console.error);
}

module.exports = { 
    processarFII, 
    processarMultiplosFIIs,
    consolidarInformacoes,
    gerarResumoInteligente 
};
