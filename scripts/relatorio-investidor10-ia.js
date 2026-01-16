/**
 * 🤖 Sistema Completo: Investidor10 → IA → WhatsApp
 * Busca Relatórios Gerenciais, resume com IA e envia alertas
 */

require('dotenv').config();
const https = require('https');
const cheerio = require('cheerio');
const zlib = require('zlib');
const { gerarResumoInteligente } = require('./gemini-resumo');

/**
 * Busca comunicados no Investidor10
 */
async function buscarComunicados(ticker) {
    console.log(`\n📄 Buscando comunicados de ${ticker}...\n`);

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
            let stream = res;
            if (res.headers['content-encoding'] === 'br') {
                stream = res.pipe(zlib.createBrotliDecompress());
            } else if (res.headers['content-encoding'] === 'gzip') {
                stream = res.pipe(zlib.createGunzip());
            }

            let data = '';
            stream.on('data', chunk => data += chunk.toString());
            stream.on('end', () => {
                try {
                    const $ = cheerio.load(data);
                    const comunicados = [];
                    
                    $('.communication-card').each((i, elem) => {
                        const $card = $(elem);
                        const titulo = $card.find('.communication-card--content, p').first().text().trim();
                        const dataElem = $card.find('.card-date--content, .card-date span').last().text().trim();
                        const linkElem = $card.find('a.btn-download-communication, a[href*="link_comunicado"]');
                        const url = linkElem.attr('href');
                        
                        if (titulo && url) {
                            let tipo = 'Comunicado';
                            if (/relatório\s+gerencial/i.test(titulo)) tipo = 'Relatório Gerencial';
                            else if (/informe\s+mensal/i.test(titulo)) tipo = 'Informe Mensal';
                            else if (/aviso\s+aos\s+acionistas/i.test(titulo)) tipo = 'Aviso aos Acionistas';
                            
                            comunicados.push({
                                tipo,
                                titulo,
                                data: dataElem,
                                url: url.startsWith('http') ? url : `https://investidor10.com.br${url}`
                            });
                        }
                    });

                    resolve(comunicados);
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
 * Segue redirect e busca o link final do PDF (com tratamento de redirect HTTP)
 */
async function obterLinkPDF(url) {
    console.log(`\n🔗 Seguindo link: ${url}\n`);

    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        
        const options = {
            hostname: urlObj.hostname,
            path: urlObj.pathname,
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
                'Accept': 'text/html',
                'Accept-Language': 'pt-BR,pt;q=0.9'
            }
        };

        const req = https.request(options, (res) => {
            // Seguir redirect HTTP 301/302
            if (res.statusCode === 301 || res.statusCode === 302) {
                const redirectUrl = res.headers.location;
                console.log(`↪️  Redirect HTTP para: ${redirectUrl}`);
                
                // Chamar recursivamente com a nova URL
                obterLinkPDF(redirectUrl).then(resolve).catch(reject);
                return;
            }
            
            let data = '';
            res.on('data', chunk => data += chunk.toString());
            res.on('end', () => {
                try {
                    // Buscar por redirect JavaScript: window.location.href = "URL"
                    const redirectMatch = data.match(/window\.location\.href\s*=\s*["']([^"']+)["']/);
                    if (redirectMatch) {
                        let pdfUrl = redirectMatch[1];
                        // Decodificar entidades HTML
                        pdfUrl = pdfUrl.replace(/&amp;/g, '&');
                        console.log(`✅ Link do PDF encontrado: ${pdfUrl}`);
                        resolve(pdfUrl);
                    } else {
                        // Buscar por links diretos de PDF
                        const pdfMatch = data.match(/(https?:\/\/[^"'\s]+\.pdf)/i);
                        if (pdfMatch) {
                            console.log(`✅ Link direto do PDF: ${pdfMatch[1]}`);
                            resolve(pdfMatch[1]);
                        } else {
                            console.log('⚠️  HTML recebido (primeiros 500 chars):');
                            console.log(data.substring(0, 500));
                            reject(new Error('Link do PDF não encontrado no HTML'));
                        }
                    }
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
 * Baixa o PDF
 */
async function baixarPDF(url) {
    console.log(`\n📥 Baixando PDF: ${url}\n`);

    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        
        const options = {
            hostname: urlObj.hostname,
            path: urlObj.pathname + urlObj.search,
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
                'Accept': 'application/pdf,*/*'
            }
        };

        const req = https.request(options, (res) => {
            const chunks = [];
            res.on('data', chunk => chunks.push(chunk));
            res.on('end', () => {
                const buffer = Buffer.concat(chunks);
                console.log(`✅ PDF baixado: ${(buffer.length / 1024).toFixed(2)} KB`);
                resolve(buffer);
            });
        });

        req.on('error', reject);
        req.setTimeout(30000, () => {
            req.destroy();
            reject(new Error('Timeout ao baixar PDF'));
        });
        req.end();
    });
}

/**
 * Extrai texto do PDF usando pdfreader
 */
async function extrairTextoPDF(buffer) {
    console.log(`\n📖 Extraindo texto do PDF...\n`);
    
    try {
        // Tentar importar pdfreader de forma segura
        let PdfReader;
        try {
            PdfReader = require('pdfreader').PdfReader;
        } catch (importError) {
            console.warn('⚠️  pdfreader não disponível, retornando texto vazio');
            return '[Texto do PDF não pôde ser extraído - pdfreader não instalado]';
        }
        
        return new Promise((resolve, reject) => {
            let texto = '';
            let paginasProcessadas = 0;
            
            const reader = new PdfReader();
            
            reader.parseBuffer(buffer, (err, item) => {
                if (err) {
                    console.error('❌ Erro no parseBuffer:', err.message);
                    reject(err);
                } else if (!item) {
                    // Fim do arquivo
                    console.log(`✅ Texto extraído: ${texto.length} caracteres`);
                    resolve(texto || '[PDF processado mas nenhum texto extraído]');
                } else if (item.text) {
                    texto += item.text + ' ';
                } else if (item.page) {
                    paginasProcessadas++;
                }
            });
        });
    } catch (error) {
        console.error('❌ Erro geral na extração:', error);
        return '[Erro ao extrair texto do PDF]';
    }
}

/**
 * Envia mensagem via WhatsApp usando UltraMsg
 */
async function enviarWhatsApp(numero, mensagem) {
    console.log(`\n📱 Enviando para WhatsApp: ${numero}\n`);
    
    const token = process.env.ULTRAMSG_TOKEN;
    const instance = process.env.ULTRAMSG_INSTANCE;
    
    if (!token || !instance) {
        throw new Error('❌ ULTRAMSG_TOKEN ou ULTRAMSG_INSTANCE não configurados no .env');
    }
    
    // Formatar número: remover caracteres especiais e adicionar código do país
    let numeroLimpo = numero.replace(/\D/g, '');
    if (!numeroLimpo.startsWith('55')) {
        numeroLimpo = '55' + numeroLimpo;
    }
    
    const payload = JSON.stringify({
        token: token,
        to: numeroLimpo,
        body: mensagem
    });
    
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'api.ultramsg.com',
            path: `/${instance}/messages/chat`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(payload)
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode === 200) {
                    console.log(`✅ Mensagem enviada com sucesso!`);
                    resolve(JSON.parse(data));
                } else {
                    reject(new Error(`Erro HTTP ${res.statusCode}: ${data}`));
                }
            });
        });

        req.on('error', reject);
        req.setTimeout(30000, () => {
            req.destroy();
            reject(new Error('Timeout ao enviar WhatsApp'));
        });
        
        req.write(payload);
        req.end();
    });
}

/**
 * Busca usuários com FNet ativo
 */
async function buscarUsuariosAtivos() {
    console.log('\n👥 Buscando usuários com alertas ativos...\n');
    
    try {
        const baseURL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const response = await fetch(`${baseURL}/api/debug/user-preferences`);
        const result = await response.json();
        
        const usuariosFNet = result.users.filter(user => user.alertPreferencesFnet === true);
        
        const usuariosCompletos = [];
        
        for (const user of usuariosFNet) {
            try {
                const detailsResponse = await fetch(`${baseURL}/api/test-user-details`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: user.id })
                });
                
                if (detailsResponse.ok) {
                    const userDetails = await detailsResponse.json();
                    
                    if (userDetails.whatsappVerified && userDetails.whatsappNumber) {
                        usuariosCompletos.push({
                            id: userDetails.id,
                            email: userDetails.email,
                            name: userDetails.name || userDetails.email.split('@')[0],
                            whatsappNumber: userDetails.whatsappNumber,
                            fiisAcompanhados: userDetails.followedFIIs || []
                        });
                        
                        console.log(`   ✅ ${userDetails.email} - WhatsApp: ${userDetails.whatsappNumber}`);
                    }
                }
            } catch (error) {
                console.log(`   ⚠️ Erro ao buscar ${user.email}: ${error.message}`);
            }
        }
        
        return usuariosCompletos;
    } catch (error) {
        console.error('❌ Erro:', error);
        return [];
    }
}

/**
 * Processo principal
 */
async function main() {
    const ticker = process.argv[2] || 'KNRI11';
    const enviarParaUsuarios = process.argv.includes('--enviar');
    
    console.log('\n🤖 SISTEMA INVESTIDOR10 → IA → WHATSAPP\n');
    console.log('═══════════════════════════════════════════════════\n');
    
    try {
        // 1. Buscar comunicados
        const comunicados = await buscarComunicados(ticker);
        const relatorio = comunicados.find(c => c.tipo === 'Relatório Gerencial');
        
        if (!relatorio) {
            console.log(`❌ Nenhum Relatório Gerencial encontrado para ${ticker}`);
            return;
        }
        
        console.log(`📊 Relatório encontrado:`);
        console.log(`   Título: ${relatorio.titulo}`);
        console.log(`   Data: ${relatorio.data}`);
        console.log(`   URL: ${relatorio.url}`);
        
        // 2. Obter link do PDF
        const linkPDF = await obterLinkPDF(relatorio.url);
        
        // 3. Baixar PDF
        const pdfBuffer = await baixarPDF(linkPDF);
        
        // 4. Extrair texto
        const textoCompleto = await extrairTextoPDF(pdfBuffer);
        
        // 5. Gerar resumo com IA
        console.log(`\n🤖 Gerando resumo com IA Gemini...\n`);
        const resumo = await gerarResumoInteligente(ticker, textoCompleto, 'Relatório Gerencial');
        
        console.log('═══════════════════════════════════════════════════');
        console.log('📝 RESUMO GERADO:\n');
        console.log(resumo);
        console.log('\n═══════════════════════════════════════════════════\n');
        
        // 6. Preparar mensagem para WhatsApp
        const mensagemWhatsApp = `*📊 Relatório Gerencial - ${ticker}*\n` +
                                 `📅 Data: ${relatorio.data}\n\n` +
                                 `${resumo}\n\n` +
                                 `🔗 Documento completo: ${linkPDF}`;
        
        // 7. Enviar para usuários (se --enviar)
        if (enviarParaUsuarios) {
            const usuarios = await buscarUsuariosAtivos();
            
            console.log(`\n📤 Enviando para ${usuarios.length} usuários...\n`);
            
            for (const usuario of usuarios) {
                // Verificar se o usuário acompanha este FII
                const acompanhaFII = usuario.fiisAcompanhados && usuario.fiisAcompanhados.some(
                    fii => fii && fii.ticker && fii.ticker.toUpperCase() === ticker.toUpperCase()
                );
                
                if (acompanhaFII || !usuario.fiisAcompanhados || usuario.fiisAcompanhados.length === 0) {
                    try {
                        await enviarWhatsApp(usuario.whatsappNumber, mensagemWhatsApp);
                        console.log(`   ✅ Enviado para ${usuario.email}`);
                        
                        // Delay entre envios
                        await new Promise(resolve => setTimeout(resolve, 2000));
                    } catch (error) {
                        console.error(`   ❌ Erro ao enviar para ${usuario.email}: ${error.message}`);
                    }
                } else {
                    console.log(`   ⏭️  ${usuario.email} não acompanha ${ticker}`);
                }
            }
        } else {
            console.log('ℹ️  Use --enviar para enviar alertas aos usuários\n');
            console.log('📱 Prévia da mensagem WhatsApp:\n');
            console.log(mensagemWhatsApp);
        }
        
        console.log('\n✅ Processo concluído!\n');
        
    } catch (error) {
        console.error('\n❌ Erro:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = {
    buscarComunicados,
    obterLinkPDF,
    baixarPDF,
    extrairTextoPDF,
    enviarWhatsApp
};
