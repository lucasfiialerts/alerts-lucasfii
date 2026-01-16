/**
 * 🧪 Teste Direto do Resumo com IA
 * Força o processamento de um documento específico para testar a IA
 */

const { gerarResumoInteligente } = require('./gemini-resumo');

async function testarResumoIA() {
    console.log('\n🧪 TESTE DE RESUMO COM IA GEMINI\n');
    console.log('═══════════════════════════════════════════════════\n');

    // Dados simulados de um documento FNet real
    const dadosDocumento = {
        nomeFundo: 'HGLG11 - Hospital da Luz Gestão FII',
        cnpj: '28.757.546/0001-00',
        competencia: '12/2025',
        patrimonio: '1234567890.50',
        qtdCotas: '15000000',
        valorCota: '82.50',
        rendimentos: '12500000.00',
        administrador: 'BTG Pactual Serviços Financeiros',
        classificacao: 'Fundo de Tijolo - Hospitais',
        segmentoAtuacao: 'Saúde e Educação',
        publicoAlvo: 'Investidores Qualificados'
    };

    const tipoDocumento = 'Informe Mensal Estruturado';
    const codigoFII = 'HGLG11';

    console.log('📋 DADOS DO DOCUMENTO:\n');
    console.log(`   Fundo: ${dadosDocumento.nomeFundo}`);
    console.log(`   Tipo: ${tipoDocumento}`);
    console.log(`   Competência: ${dadosDocumento.competencia}`);
    console.log(`   Patrimônio: R$ ${parseFloat(dadosDocumento.patrimonio).toLocaleString('pt-BR')}`);
    console.log(`   Cotas: ${parseInt(dadosDocumento.qtdCotas).toLocaleString('pt-BR')}`);
    console.log(`   Valor/Cota: R$ ${parseFloat(dadosDocumento.valorCota).toFixed(2)}`);
    console.log(`   Rendimentos: R$ ${parseFloat(dadosDocumento.rendimentos).toLocaleString('pt-BR')}`);
    console.log(`   Administrador: ${dadosDocumento.administrador}`);
    console.log(`   Classificação: ${dadosDocumento.classificacao}\n`);

    console.log('🤖 Gerando resumo com IA...\n');

    try {
        const startTime = Date.now();
        
        // Chamar a função de resumo
        const resumo = await gerarResumoInteligente(
            dadosDocumento,
            tipoDocumento,
            codigoFII
        );

        const duration = ((Date.now() - startTime) / 1000).toFixed(2);

        console.log('✅ RESUMO GERADO COM SUCESSO!\n');
        console.log('═══════════════════════════════════════════════════\n');
        console.log('📝 RESUMO COMPLETO:\n');
        console.log(resumo);
        console.log('\n═══════════════════════════════════════════════════\n');
        console.log(`⏱️  Tempo de processamento: ${duration}s`);
        console.log(`📏 Tamanho do resumo: ${resumo.length} caracteres\n`);

        // Validações
        console.log('✅ VALIDAÇÕES:\n');
        console.log(`   ${resumo.includes('HGLG11') ? '✅' : '❌'} Contém código do FII`);
        console.log(`   ${resumo.includes('🤖') ? '✅' : '❌'} Contém assinatura da IA`);
        console.log(`   ${resumo.length > 100 ? '✅' : '❌'} Tamanho adequado (>100 chars)`);
        console.log(`   ${resumo.includes('R$') || resumo.includes('patrimônio') ? '✅' : '❌'} Contém análise financeira`);

        // Simular mensagem WhatsApp
        console.log('\n📱 PRÉVIA DA MENSAGEM WHATSAPP:\n');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        
        const mensagemWhatsApp = `🏛️ *Novo Documento FNet B3*

📄 *${tipoDocumento}*
🏢 ${dadosDocumento.nomeFundo}
📅 ${dadosDocumento.competencia}

${resumo}

_Resumo gerado automaticamente com IA_ ✨`;

        console.log(mensagemWhatsApp);
        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        
        console.log('✅ Teste concluído com sucesso!\n');
        
    } catch (error) {
        console.error('\n❌ ERRO NO TESTE:\n');
        console.error(error);
        console.error('\n📋 Checklist:\n');
        console.error('   [ ] GOOGLE_GENERATIVE_AI_API_KEY está configurada?');
        console.error('   [ ] A API Gemini está funcionando?');
        console.error('   [ ] As dependências estão instaladas? (npm install)\n');
        process.exit(1);
    }
}

// Executar teste
testarResumoIA().catch(console.error);
