/**
 * 📄 Script de Cron para Processar PDFs e Gerar Resumos com IA
 * 
 * Este script pode ser configurado no EasyCron para:
 * - Buscar PDFs de uma pasta específica
 * - Enviar para a API de IA
 * - Gerar resumos automáticos
 * - Enviar notificações via WhatsApp
 */

const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
// Node.js 18+ has native fetch
require('dotenv').config();

// Configurações
const PDF_FOLDER = process.env.PDF_WATCH_FOLDER || './public/reports';
const API_URL = process.env.API_URL || 'http://localhost:3000';
const WHATSAPP_ENABLED = process.env.WHATSAPP_PDF_ALERTS === 'true';

// Lista de PDFs já processados (em produção, use banco de dados)
const PROCESSED_FILE = './logs/processed-pdfs.json';

/**
 * Carrega lista de PDFs já processados
 */
function loadProcessedPdfs() {
    try {
        if (fs.existsSync(PROCESSED_FILE)) {
            return JSON.parse(fs.readFileSync(PROCESSED_FILE, 'utf-8'));
        }
    } catch (error) {
        console.error('Erro ao carregar PDFs processados:', error);
    }
    return [];
}

/**
 * Salva lista de PDFs processados
 */
function saveProcessedPdfs(pdfs) {
    try {
        const dir = path.dirname(PROCESSED_FILE);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(PROCESSED_FILE, JSON.stringify(pdfs, null, 2));
    } catch (error) {
        console.error('Erro ao salvar PDFs processados:', error);
    }
}

/**
 * Busca novos PDFs na pasta
 */
function findNewPdfs() {
    const processedPdfs = loadProcessedPdfs();
    const allPdfs = [];

    if (!fs.existsSync(PDF_FOLDER)) {
        console.log('📁 Pasta de PDFs não encontrada:', PDF_FOLDER);
        return [];
    }

    const files = fs.readdirSync(PDF_FOLDER);
    
    for (const file of files) {
        if (file.endsWith('.pdf')) {
            const filePath = path.join(PDF_FOLDER, file);
            const stats = fs.statSync(filePath);
            
            // Verificar se já foi processado
            const fileInfo = {
                name: file,
                path: filePath,
                size: stats.size,
                modified: stats.mtime.getTime()
            };

            const alreadyProcessed = processedPdfs.find(
                p => p.name === file && p.modified === fileInfo.modified
            );

            if (!alreadyProcessed) {
                allPdfs.push(fileInfo);
            }
        }
    }

    return allPdfs;
}

/**
 * Envia PDF para API e recebe resumo
 */
async function processPdf(pdfInfo) {
    try {
        console.log('📤 Enviando PDF para análise:', pdfInfo.name);

        const formData = new FormData();
        const fileStream = fs.createReadStream(pdfInfo.path);
        formData.append('file', fileStream, pdfInfo.name);

        const response = await fetch(`${API_URL}/api/chat-ia`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error(`API retornou erro: ${response.status}`);
        }

        const result = await response.json();
        console.log('✅ Resumo gerado com sucesso!');

        return result;

    } catch (error) {
        console.error('❌ Erro ao processar PDF:', error);
        throw error;
    }
}

/**
 * Envia notificação via WhatsApp (opcional)
 */
async function sendWhatsAppNotification(pdfInfo, summary) {
    if (!WHATSAPP_ENABLED) {
        return;
    }

    try {
        // Implementar integração com WhatsApp
        // Usar a mesma lógica dos outros scripts de alerta
        console.log('📱 Enviando notificação WhatsApp...');
        
        const message = `
📄 *Novo PDF Analisado*

📋 Arquivo: ${pdfInfo.name}
📊 Páginas: ${summary.pageCount}

${summary.summary.substring(0, 500)}...

_Resumo completo disponível no sistema_
        `.trim();

        // Aqui você implementaria o envio via ZAPI
        // Similar ao que já existe em outros scripts

    } catch (error) {
        console.error('Erro ao enviar WhatsApp:', error);
    }
}

/**
 * Salva resumo em arquivo JSON
 */
function saveSummary(pdfInfo, summary) {
    try {
        const summaryFolder = './logs/pdf-summaries';
        if (!fs.existsSync(summaryFolder)) {
            fs.mkdirSync(summaryFolder, { recursive: true });
        }

        const summaryFile = path.join(
            summaryFolder,
            `${path.basename(pdfInfo.name, '.pdf')}-summary.json`
        );

        const data = {
            pdfInfo,
            summary,
            processedAt: new Date().toISOString()
        };

        fs.writeFileSync(summaryFile, JSON.stringify(data, null, 2));
        console.log('💾 Resumo salvo:', summaryFile);

    } catch (error) {
        console.error('Erro ao salvar resumo:', error);
    }
}

/**
 * Função principal
 */
async function main() {
    console.log('\n🤖 Iniciando processamento de PDFs...');
    console.log('📅', new Date().toLocaleString('pt-BR'));
    console.log('📁 Pasta:', PDF_FOLDER);
    console.log('─────────────────────────────────\n');

    const newPdfs = findNewPdfs();

    if (newPdfs.length === 0) {
        console.log('✅ Nenhum PDF novo encontrado.');
        return;
    }

    console.log(`📄 ${newPdfs.length} PDF(s) novo(s) encontrado(s):\n`);

    const processedPdfs = loadProcessedPdfs();

    for (const pdfInfo of newPdfs) {
        try {
            console.log(`\n🔄 Processando: ${pdfInfo.name}`);
            
            // Processar PDF
            const summary = await processPdf(pdfInfo);

            // Salvar resumo
            saveSummary(pdfInfo, summary);

            // Enviar notificação
            await sendWhatsAppNotification(pdfInfo, summary);

            // Marcar como processado
            processedPdfs.push({
                name: pdfInfo.name,
                modified: pdfInfo.modified,
                processedAt: new Date().toISOString()
            });

            console.log('✅ Concluído:', pdfInfo.name);

        } catch (error) {
            console.error('❌ Erro ao processar:', pdfInfo.name, error);
        }
    }

    // Salvar lista atualizada
    saveProcessedPdfs(processedPdfs);

    console.log('\n─────────────────────────────────');
    console.log('✅ Processamento concluído!');
}

// Executar
if (require.main === module) {
    main().catch(console.error);
}

module.exports = { main };
