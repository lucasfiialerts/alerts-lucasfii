/**
 * 🔄 Cron Job para Gerar Resumos Diários de FIIs
 * 
 * Busca FIIs mais seguidos pelos usuários e gera resumos automáticos
 * com IA combinando dados de múltiplas fontes
 */

const { processarMultiplosFIIs } = require('./resumo-fii-ia');
require('dotenv').config();

/**
 * Busca os FIIs mais seguidos pelos usuários
 */
async function buscarFIIsMaisSeguidos() {
    try {
        const baseURL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const response = await fetch(`${baseURL}/api/debug/user-preferences`);
        const result = await response.json();
        
        // Contar quantos usuários seguem cada FII
        const contagemFIIs = {};
        
        result.users.forEach(user => {
            if (user.followedFIIs) {
                user.followedFIIs.forEach(fii => {
                    contagemFIIs[fii] = (contagemFIIs[fii] || 0) + 1;
                });
            }
        });

        // Ordenar por popularidade
        const fiisOrdenados = Object.entries(contagemFIIs)
            .sort((a, b) => b[1] - a[1])
            .map(([ticker, count]) => ({ ticker, seguidores: count }));

        return fiisOrdenados;

    } catch (error) {
        console.error('Erro ao buscar FIIs mais seguidos:', error);
        return [];
    }
}

/**
 * Função principal do cron
 */
async function executarCronResumos() {
    console.log('\n🤖 CRON: Resumos Diários de FIIs com IA\n');
    console.log('═══════════════════════════════════════════════════\n');
    console.log(`📅 ${new Date().toLocaleString('pt-BR')}\n`);

    try {
        // 1. Buscar FIIs mais populares
        const fiisMaisSeguidos = await buscarFIIsMaisSeguidos();
        
        if (fiisMaisSeguidos.length === 0) {
            console.log('⚠️  Nenhum FII sendo seguido pelos usuários');
            return;
        }

        console.log(`📊 ${fiisMaisSeguidos.length} FIIs únicos sendo seguidos:`);
        fiisMaisSeguidos.slice(0, 10).forEach(({ ticker, seguidores }) => {
            console.log(`   • ${ticker}: ${seguidores} seguidor(es)`);
        });
        console.log('');

        // 2. Processar top 10 FIIs (ou menos se configurado)
        const limite = parseInt(process.env.CRON_FII_LIMIT || '10');
        const fiisParaProcessar = fiisMaisSeguidos
            .slice(0, limite)
            .map(f => f.ticker);

        console.log(`🔄 Processando top ${fiisParaProcessar.length} FIIs...\n`);

        // 3. Gerar resumos e enviar
        const resultados = await processarMultiplosFIIs(fiisParaProcessar);

        // 4. Relatório final
        const sucessos = resultados.filter(r => r.success).length;
        const falhas = resultados.filter(r => !r.success).length;
        const totalNotificados = resultados.reduce((sum, r) => sum + (r.usuariosNotificados || 0), 0);

        console.log('\n═══════════════════════════════════════════════════');
        console.log('📊 RELATÓRIO FINAL DO CRON:\n');
        console.log(`   ✅ Sucessos: ${sucessos}`);
        console.log(`   ❌ Falhas: ${falhas}`);
        console.log(`   📱 Total notificações: ${totalNotificados}`);
        console.log('═══════════════════════════════════════════════════\n');

        // 5. Salvar log
        const fs = require('fs');
        const logFile = './logs/cron-resumos.log';
        const logEntry = {
            timestamp: new Date().toISOString(),
            fiisProcessados: fiisParaProcessar.length,
            sucessos,
            falhas,
            totalNotificados,
            detalhes: resultados
        };
        
        fs.appendFileSync(
            logFile,
            JSON.stringify(logEntry, null, 2) + '\n\n'
        );

        return { success: true, ...logEntry };

    } catch (error) {
        console.error('\n❌ Erro no cron:', error);
        return { success: false, error: error.message };
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    executarCronResumos()
        .then(resultado => {
            console.log(resultado.success ? '✅ Cron executado com sucesso' : '❌ Cron falhou');
            process.exit(resultado.success ? 0 : 1);
        })
        .catch(error => {
            console.error('❌ Erro fatal:', error);
            process.exit(1);
        });
}

module.exports = { executarCronResumos, buscarFIIsMaisSeguidos };
