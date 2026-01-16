/**
 * 🤖 Sistema Automatizado de Resumo de Fatos Relevantes FII com IA
 * 
 * Este é o script principal usado pelo alertPreferencesFnet (setFnetDocumentos)
 * 
 * Fluxo completo:
 * 1. Busca novos documentos na API FNET B3 (fatos relevantes, relatórios)
 * 2. Baixa PDFs/XMLs dos documentos oficiais
 * 3. Extrai texto do conteúdo usando pdf-parse
 * 4. Gera resumo inteligente com IA (Gemini 2.0 Flash)
 * 5. Envia resumo via WhatsApp para usuários com alertPreferencesFnet=true
 * 
 * CRON: Pode ser executado via /api/cron/fnet-alerts ou diretamente
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse/lib/pdf-parse.js');
const { google } = require('@ai-sdk/google');
const { generateText } = require('ai');

require('dotenv').config();

// Configurações
const PROCESSED_DOCS_FILE = './logs/processed-fnet-docs.json';
const CACHE_DIR = './logs/fnet-cache';

/**
 * Busca novos documentos do FNET B3
 */
async function buscarDocumentosFNet(limite = 30) {
    console.log('🌐 Buscando documentos do FNet B3...');
    
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'fnet.bmfbovespa.com.br',
            path: `/fnet/publico/pesquisarGerenciadorDocumentosDados?tipoBusca=0&tipoDocumento=1&d=1&s=0&l=${limite}`,
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'application/json',
                'Accept-Language': 'pt-BR,pt;q=0.9',
                'Referer': 'https://fnet.bmfbovespa.com.br/',
                'Origin': 'https://fnet.bmfbovespa.com.br'
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    if (res.statusCode === 200) {
                        const json = JSON.parse(data);
                        resolve(json);
                    } else {
                        reject(new Error(`Status ${res.statusCode}`));
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
 * Baixa documento específico do FNET
 */
async function baixarDocumentoFNet(docId) {
    console.log(`📥 Baixando documento ${docId}...`);
    
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'fnet.bmfbovespa.com.br',
            path: `/fnet/publico/downloadDocumento?id=${docId}`,
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Referer': 'https://fnet.bmfbovespa.com.br/',
                'Origin': 'https://fnet.bmfbovespa.com.br'
            }
        };

        const req = https.request(options, (res) => {
            const chunks = [];
            
            res.on('data', chunk => chunks.push(chunk));
            res.on('end', () => {
                if (res.statusCode === 200) {
                    const buffer = Buffer.concat(chunks);
                    resolve({
                        buffer,
                        contentType: res.headers['content-type'],
                        contentLength: buffer.length
                    });
                } else {
                    reject(new Error(`Status ${res.statusCode}`));
                }
            });
        });

        req.on('error', reject);
        req.setTimeout(30000, () => {
            req.destroy();
            reject(new Error('Timeout ao baixar documento'));
        });
        req.end();
    });
}

/**
 * Extrai texto de PDF ou XML
 */
async function extrairTexto(buffer, contentType) {
    try {
        // Se for PDF
        if (contentType?.includes('pdf') || buffer.toString('utf8', 0, 4) === '%PDF') {
            console.log('📄 Extraindo texto do PDF...');
            const data = await pdf(buffer);
            return {
                tipo: 'PDF',
                texto: data.text,
                paginas: data.numpages
            };
        }
        
        // Se for XML
        if (contentType?.includes('xml') || buffer.toString('utf8', 0, 5).includes('<?xml')) {
            console.log('📄 Extraindo texto do XML...');
            const xmlText = buffer.toString('utf8');
            // Remover tags XML e extrair apenas o conteúdo
            const textoLimpo = xmlText
                .replace(/<[^>]+>/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();
            
            return {
                tipo: 'XML',
                texto: textoLimpo,
                tamanho: textoLimpo.length
            };
        }

        // Texto simples
        console.log('📄 Processando como texto...');
        return {
            tipo: 'TXT',
            texto: buffer.toString('utf8'),
            tamanho: buffer.length
        };

    } catch (error) {
        console.error('❌ Erro ao extrair texto:', error);
        throw error;
    }
}

/**
 * Gera resumo inteligente com IA
 */
async function gerarResumoIA(documento, textoExtraido) {
    try {
        console.log('🤖 Gerando resumo com IA...');

        const prompt = `Você é um analista especialista em Fundos Imobiliários (FIIs). Analise este documento oficial do FNET B3 e crie um resumo estruturado.

📋 INFORMAÇÕES DO DOCUMENTO:
• Fundo: ${documento.descricaoFundo || 'N/A'}
• Tipo: ${documento.tipoDocumento || 'N/A'}
• Categoria: ${documento.categoriaDocumento || 'N/A'}
• Data Referência: ${documento.dataReferencia || 'N/A'}
• Data Entrega: ${documento.dataEntrega || 'N/A'}

📄 CONTEÚDO DO DOCUMENTO:
${textoExtraido.texto.substring(0, 8000)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Por favor, forneça um resumo estruturado seguindo este formato:

🏛️ **RESUMO EXECUTIVO**
[2-3 parágrafos principais sobre o documento]

🔑 **PONTOS-CHAVE**
• [Tópicos mais importantes em bullets]

💰 **INFORMAÇÕES FINANCEIRAS** (se aplicável)
• [Dados financeiros relevantes]

📊 **INDICADORES** (se aplicável)
• [Métricas e KPIs]

⚠️ **PONTOS DE ATENÇÃO**
• [Alertas ou informações críticas]

💡 **ANÁLISE**
[Sua interpretação profissional do documento]

IMPORTANTE:
- Seja objetivo e direto
- Destaque informações que investidores precisam saber
- Use linguagem clara mas técnica
- Foque em dados acionáveis`;

        const { text } = await generateText({
            model: google('models/gemini-2.0-flash-exp'),
            prompt: prompt,
            maxTokens: 2000
        });

        return text;

    } catch (error) {
        console.error('❌ Erro ao gerar resumo:', error);
        // Retornar resumo básico em caso de erro
        return `📋 RESUMO AUTOMÁTICO

Documento: ${documento.tipoDocumento}
Fundo: ${documento.descricaoFundo}
Data: ${documento.dataEntrega}

Conteúdo: ${textoExtraido.texto.substring(0, 500)}...

[Erro ao gerar resumo completo com IA]`;
    }
}

/**
 * Envia resumo via WhatsApp
 */
async function enviarResumoWhatsApp(resumo, documento, usuarios) {
    console.log('📱 Enviando resumos via WhatsApp...');

    const { enviarMensagemWhatsApp } = require('./enviar-fnet-direto');
    
    const mensagem = `🏛️ *Novo Documento FNet B3*

📄 *${documento.tipoDocumento}*
🏢 ${documento.descricaoFundo}
📅 ${documento.dataReferencia}

${resumo}

_Resumo gerado automaticamente com IA_ ✨`;

    let enviados = 0;
    for (const usuario of usuarios) {
        try {
            await enviarMensagemWhatsApp(usuario.whatsappNumber, mensagem);
            console.log(`  ✅ Enviado para ${usuario.name}`);
            enviados++;
            
            // Delay entre envios
            await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (error) {
            console.error(`  ❌ Erro ao enviar para ${usuario.name}:`, error);
        }
    }

    return enviados;
}

/**
 * Carrega lista de documentos já processados
 */
function carregarProcessados() {
    try {
        if (fs.existsSync(PROCESSED_DOCS_FILE)) {
            return JSON.parse(fs.readFileSync(PROCESSED_DOCS_FILE, 'utf-8'));
        }
    } catch (error) {
        console.error('Erro ao carregar documentos processados:', error);
    }
    return [];
}

/**
 * Salva lista de documentos processados
 */
function salvarProcessados(docs) {
    try {
        const dir = path.dirname(PROCESSED_DOCS_FILE);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(PROCESSED_DOCS_FILE, JSON.stringify(docs, null, 2));
    } catch (error) {
        console.error('Erro ao salvar documentos processados:', error);
    }
}

/**
 * Busca usuários interessados no FII
 */
async function buscarUsuariosInteressados(codigoFII) {
    try {
        const baseURL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const response = await fetch(`${baseURL}/api/debug/user-preferences`);
        const result = await response.json();
        
        // Filtrar usuários que seguem este FII ou tem FNet ativo
        const usuarios = result.users.filter(user => 
            user.alertPreferencesFnet === true &&
            user.whatsappVerified &&
            user.whatsappNumber
        );

        return usuarios;
    } catch (error) {
        console.error('Erro ao buscar usuários:', error);
        return [];
    }
}

/**
 * Função principal
 */
async function main() {
    console.log('\n🤖 SISTEMA DE RESUMO AUTOMÁTICO DE FATOS RELEVANTES\n');
    console.log('═══════════════════════════════════════════════════\n');
    console.log('📅', new Date().toLocaleString('pt-BR'));
    console.log('\n');

    try {
        // 1. Buscar documentos do FNET
        const resultado = await buscarDocumentosFNet(30);
        console.log(`✅ ${resultado.data?.length || 0} documentos encontrados\n`);

        if (!resultado.data || resultado.data.length === 0) {
            console.log('⚠️  Nenhum documento novo encontrado');
            return;
        }

        // 2. Filtrar documentos relevantes (não processados)
        const processados = carregarProcessados();
        const novosDocumentos = resultado.data.filter(doc => 
            !processados.find(p => p.id === doc.id)
        );

        console.log(`📋 ${novosDocumentos.length} documentos novos para processar\n`);

        // 3. Processar cada documento
        let processadosAgora = 0;
        
        for (const doc of novosDocumentos.slice(0, 5)) { // Limitar a 5 por vez
            try {
                console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
                console.log(`📄 Processando: ${doc.tipoDocumento}`);
                console.log(`🏢 ${doc.descricaoFundo}`);
                console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

                // Baixar documento
                const download = await baixarDocumentoFNet(doc.id);
                console.log(`✅ Download: ${(download.contentLength / 1024).toFixed(1)} KB`);

                // Extrair texto
                const textoExtraido = await extrairTexto(download.buffer, download.contentType);
                console.log(`✅ Texto extraído: ${textoExtraido.texto.length} caracteres`);

                // Gerar resumo com IA
                const resumo = await gerarResumoIA(doc, textoExtraido);
                console.log(`✅ Resumo gerado\n`);

                // Buscar usuários interessados
                const usuarios = await buscarUsuariosInteressados(doc.descricaoFundo);
                console.log(`👥 ${usuarios.length} usuários interessados`);

                // Enviar via WhatsApp (se houver usuários)
                if (usuarios.length > 0) {
                    const enviados = await enviarResumoWhatsApp(resumo, doc, usuarios);
                    console.log(`✅ ${enviados} mensagens enviadas`);
                }

                // Marcar como processado
                processados.push({
                    id: doc.id,
                    dataProcessamento: new Date().toISOString(),
                    tipo: doc.tipoDocumento,
                    fundo: doc.descricaoFundo
                });

                processadosAgora++;

                // Delay entre documentos
                await new Promise(resolve => setTimeout(resolve, 3000));

            } catch (error) {
                console.error(`❌ Erro ao processar documento ${doc.id}:`, error);
            }
        }

        // 4. Salvar progresso
        salvarProcessados(processados);

        console.log(`\n═══════════════════════════════════════════════════`);
        console.log(`✅ Processamento concluído!`);
        console.log(`📊 ${processadosAgora} novos documentos processados`);
        console.log(`═══════════════════════════════════════════════════\n`);

    } catch (error) {
        console.error('\n❌ Erro no processamento:', error);
    }
}

// Executar
if (require.main === module) {
    main().catch(console.error);
}

module.exports = { main };
