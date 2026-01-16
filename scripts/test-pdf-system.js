/**
 * 🧪 Script de Teste do Sistema de Resumo de PDFs
 * 
 * Use este script para testar a funcionalidade completa
 */

const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const fetch = require('node-fetch');

require('dotenv').config();

const API_URL = process.env.API_URL || 'http://localhost:3000';

async function testPdfUpload() {
    console.log('\n🧪 TESTE DO SISTEMA DE PDF COM IA\n');
    console.log('═══════════════════════════════════════\n');

    // 1. Verificar se há PDFs de teste
    const testFolder = './public/reports';
    
    if (!fs.existsSync(testFolder)) {
        console.log('📁 Criando pasta de reports...');
        fs.mkdirSync(testFolder, { recursive: true });
    }

    const pdfs = fs.readdirSync(testFolder).filter(f => f.endsWith('.pdf'));

    if (pdfs.length === 0) {
        console.log('⚠️  Nenhum PDF encontrado em', testFolder);
        console.log('📝 Coloque um PDF de teste na pasta e execute novamente.\n');
        console.log('Exemplo:');
        console.log(`  cp ~/Downloads/documento.pdf ${testFolder}/\n`);
        return;
    }

    console.log(`📄 ${pdfs.length} PDF(s) encontrado(s):\n`);
    pdfs.forEach((pdf, i) => {
        const stats = fs.statSync(path.join(testFolder, pdf));
        console.log(`  ${i + 1}. ${pdf} (${(stats.size / 1024).toFixed(1)} KB)`);
    });

    // 2. Testar upload do primeiro PDF
    const testPdf = pdfs[0];
    const pdfPath = path.join(testFolder, testPdf);

    console.log(`\n🚀 Testando upload: ${testPdf}\n`);

    try {
        const formData = new FormData();
        const fileStream = fs.createReadStream(pdfPath);
        formData.append('file', fileStream, testPdf);

        console.log('📤 Enviando para API...');
        const startTime = Date.now();

        const response = await fetch(`${API_URL}/api/chat-ia`, {
            method: 'POST',
            body: formData
        });

        const duration = ((Date.now() - startTime) / 1000).toFixed(2);

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`API retornou ${response.status}: ${error}`);
        }

        const result = await response.json();

        console.log('\n✅ SUCESSO! PDF processado em', duration, 'segundos\n');
        console.log('═══════════════════════════════════════\n');
        console.log('📊 INFORMAÇÕES DO PDF:\n');
        console.log('  • Arquivo:', result.fileName);
        console.log('  • Páginas:', result.pageCount);
        console.log('  • Caracteres extraídos:', result.textLength.toLocaleString());
        console.log('\n═══════════════════════════════════════\n');
        console.log('🤖 RESUMO GERADO PELA IA:\n');
        console.log(result.summary);
        console.log('\n═══════════════════════════════════════\n');

        // Salvar resultado
        const resultFile = './logs/test-pdf-result.json';
        const logDir = path.dirname(resultFile);
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }
        fs.writeFileSync(resultFile, JSON.stringify(result, null, 2));
        console.log('💾 Resultado salvo em:', resultFile);

    } catch (error) {
        console.error('\n❌ ERRO AO PROCESSAR PDF:\n');
        console.error(error.message);
        console.error('\n📋 Checklist de troubleshooting:\n');
        console.error('  [ ] O servidor Next.js está rodando? (npm run dev)');
        console.error('  [ ] A API_URL está correta no .env?');
        console.error('  [ ] O PDF não está corrompido?');
        console.error('  [ ] A variável GOOGLE_GENERATIVE_AI_API_KEY está configurada?');
    }

    console.log('\n═══════════════════════════════════════\n');
}

async function testCronEndpoint() {
    console.log('\n🧪 TESTE DO ENDPOINT DE CRON\n');
    console.log('═══════════════════════════════════════\n');

    try {
        const headers = {
            'Content-Type': 'application/json'
        };

        // Se houver CRON_SECRET, adicionar autorização
        if (process.env.CRON_SECRET) {
            headers['Authorization'] = `Bearer ${process.env.CRON_SECRET}`;
        }

        console.log('📤 Chamando endpoint de cron...');

        const response = await fetch(`${API_URL}/api/cron/pdf-summary`, {
            method: 'POST',
            headers
        });

        const result = await response.json();

        if (response.ok) {
            console.log('✅ Cron executado com sucesso!\n');
            console.log(result);
        } else {
            console.log('❌ Erro no cron:\n');
            console.log(result);
        }

    } catch (error) {
        console.error('❌ Erro ao testar cron:', error);
    }

    console.log('\n═══════════════════════════════════════\n');
}

async function main() {
    const args = process.argv.slice(2);

    if (args.includes('--cron')) {
        await testCronEndpoint();
    } else {
        await testPdfUpload();
    }

    console.log('✅ Testes concluídos!\n');
}

main().catch(console.error);
