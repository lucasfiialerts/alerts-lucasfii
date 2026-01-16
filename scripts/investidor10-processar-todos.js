/**
 * 🔄 Processador de TODOS os FIIs - Investidor10
 * Busca lista de FIIs, processa relatórios e envia alertas
 */

require('dotenv').config();
const https = require('https');
const cheerio = require('cheerio');
const zlib = require('zlib');

// Importar módulo de relatórios
const {
    buscarComunicados,
    obterLinkPDF,
    baixarPDF,
    extrairTextoPDF,
    enviarWhatsApp
} = require('./relatorio-investidor10-ia');

const { gerarResumoInteligente } = require('./gemini-resumo');

// Importar controle de alertas
const {
    jaEnviouAlerta,
    registrarAlertaEnviado,
    buscarFIIsAcompanhados,
    isDocumentoRecente,
    limparAlertasAntigos
} = require('./controle-alertas');

/**
 * Busca lista de FIIs acompanhados pelos usuários
 */
async function buscarListaFIIs(usuarios = []) {
    console.log('\n📋 Buscando FIIs acompanhados...\n');

    if (usuarios.length === 0) {
        console.log('⚠️  Nenhum usuário ativo, nenhum FII para processar\n');
        return [];
    }

    const fiisAcompanhados = await buscarFIIsAcompanhados(usuarios);
    
    console.log(`✅ ${fiisAcompanhados.length} FIIs acompanhados pelos usuários\n`);
    return fiisAcompanhados;
}

/**
 * Busca usuários com FNet ativo
 */
async function buscarUsuariosAtivos() {
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
                    }
                }
            } catch (error) {
                // Silencioso
            }
        }
        
        return usuariosCompletos;
    } catch (error) {
        console.error('❌ Erro ao buscar usuários:', error.message);
        return [];
    }
}

/**
 * Processa um FII completo
 */
async function processarFII(ticker, usuarios, enviar = false, enviarTodos = false) {
    console.log(`\n${'═'.repeat(60)}`);
    console.log(`📊 Processando: ${ticker}`);
    console.log('═'.repeat(60));
    
    try {
        // 1. Buscar comunicados
        const comunicados = await buscarComunicados(ticker);
        const relatorio = comunicados.find(c => c.tipo === 'Relatório Gerencial');
        
        if (!relatorio) {
            console.log(`   ⚠️  Nenhum Relatório Gerencial encontrado`);
            return { ticker, status: 'sem_relatorio' };
        }
        
        console.log(`   📄 Relatório: ${relatorio.data}`);
        
        // Verificar se é recente (últimos 30 dias)
        if (!isDocumentoRecente(relatorio.data)) {
            console.log(`   ⏳ Relatório antigo (${relatorio.data}), pulando...`);
            return { ticker, status: 'antigo', data: relatorio.data };
        }
        
        // 2. Obter link do PDF
        const linkPDF = await obterLinkPDF(relatorio.url);
        
        // 3. Baixar PDF
        const pdfBuffer = await baixarPDF(linkPDF);
        
        // 4. Extrair texto (silenciar warnings)
        const textoCompleto = await extrairTextoPDF(pdfBuffer);
        
        // 5. Gerar resumo com IA
        const resumo = await gerarResumoInteligente(ticker, textoCompleto, 'Relatório Gerencial');
        
        console.log(`   ✅ Resumo gerado (${resumo.length} caracteres)`);
        
        // 6. Preparar mensagem
        const mensagemWhatsApp = `*📊 Relatório Gerencial - ${ticker}*\n` +
                                 `📅 Data: ${relatorio.data}\n\n` +
                                 `${resumo}\n\n` +
                                 `🔗 Documento: ${linkPDF}`;
        
        // 7. Enviar se solicitado
        if (enviar && usuarios.length > 0) {
            let enviados = 0;
            let pulados = 0;
            
            for (const usuario of usuarios) {
                // Verificar se acompanha este FII (ou se --todos foi usado)
                let acompanhaFII = false;
                
                if (usuario.fiisAcompanhados && Array.isArray(usuario.fiisAcompanhados)) {
                    acompanhaFII = usuario.fiisAcompanhados.some(fii => {
                        // Pode ser string simples ou objeto {ticker: "XXX"}
                        const fiiTicker = typeof fii === 'string' ? fii : (fii?.ticker || '');
                        return fiiTicker.toUpperCase() === ticker.toUpperCase();
                    });
                }
                
                if (enviarTodos || acompanhaFII || !usuario.fiisAcompanhados || usuario.fiisAcompanhados.length === 0) {
                    try {
                        await enviarWhatsApp(usuario.whatsappNumber, mensagemWhatsApp);
                        enviados++;
                        console.log(`   ✅ Enviado para ${usuario.email}`);
                        await new Promise(resolve => setTimeout(resolve, 2000));
                    } catch (error) {
                        console.error(`   ❌ Erro ao enviar para ${usuario.email}: ${error.message}`);
                    }
                } else {
                    pulados++;
                }
            }
            
            if (pulados > 0) {
                console.log(`   ⏭️  ${pulados} usuário(s) não acompanham ${ticker}`);
            }
            
            console.log(`   📤 Total enviados: ${enviados}`);
            return { ticker, status: 'enviado', enviados, pulados };
        } else {
            console.log(`   ℹ️  Preview gerado (use --enviar para enviar)`);
            return { ticker, status: 'preview', resumo: resumo.substring(0, 200) + '...' };
        }
        
    } catch (error) {
        console.error(`   ❌ Erro: ${error.message}`);
        return { ticker, status: 'erro', erro: error.message };
    }
}

/**
 * Processo principal
 */
async function main() {
    const args = process.argv.slice(2);
    const enviar = args.includes('--enviar');
    const enviarTodos = args.includes('--todos');
    const limite = args.find(a => a.startsWith('--limite='))?.split('=')[1];
    const maxFIIs = limite ? parseInt(limite) : null;
    
    console.log('\n🤖 PROCESSADOR DE FIIs - INVESTIDOR10\n');
    console.log('═══════════════════════════════════════════════════\n');
    
    try {
        // 1. Buscar usuários ativos
        console.log('👥 Buscando usuários ativos...\n');
        const usuarios = await buscarUsuariosAtivos();
        console.log(`✅ ${usuarios.length} usuários com alertas ativos\n`);
        
        if (usuarios.length === 0) {
            console.log('⚠️  Nenhum usuário ativo. Nada para processar.\n');
            return;
        }
        
        // Limpar alertas antigos (mais de 90 dias)
        await limparAlertasAntigos();
        
        // 2. Buscar FIIs acompanhados
        const fiis = await buscarListaFIIs(usuarios);
        
        if (fiis.length === 0) {
            console.log('❌ Nenhum FII sendo acompanhado pelos usuários.\n');
            return;
        }
        
        // 3. Determinar quais FIIs processar
        let fiisProcessar;
        
        if (maxFIIs) {
            // Usar limite especificado
            fiisProcessar = fiis.slice(0, maxFIIs);
        } else {
            fiisProcessar = fiis;
        }
        
        console.log(`📊 FIIs a processar: ${fiisProcessar.length}`);
        console.log(`🔄 Modo: ${enviar ? '📤 ENVIAR ALERTAS' : '👁️  PREVIEW (sem enviar)'}`);
        
        if (enviarTodos) {
            console.log(`🌐 Enviar para TODOS os usuários (ignorando FIIs acompanhados)`);
        }
        
        if (maxFIIs) {
            console.log(`⚠️  Limitado aos primeiros ${maxFIIs} FIIs`);
        }
        
        console.log('');
        
        // 4. Processar cada FII
        const resultados = [];
        
        for (let i = 0; i < fiisProcessar.length; i++) {
            const ticker = fiisProcessar[i];
            console.log(`\n[${i + 1}/${fiisProcessar.length}]`);
            
            const resultado = await processarFII(ticker, usuarios, enviar, enviarTodos);
            resultados.push(resultado);
            
            // Delay entre FIIs para não sobrecarregar
            if (i < fiisProcessar.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 3000));
            }
        }
        
        // 4. Resumo final
        console.log('\n' + '═'.repeat(60));
        console.log('📊 RESUMO FINAL');
        console.log('═'.repeat(60) + '\n');
        
        const porStatus = resultados.reduce((acc, r) => {
            acc[r.status] = (acc[r.status] || 0) + 1;
            return acc;
        }, {});
        
        console.log('Status dos processamentos:');
        Object.entries(porStatus).forEach(([status, count]) => {
            const emoji = {
                'enviado': '✅',
                'preview': '👁️',
                'sem_relatorio': '⚠️',
                'erro': '❌'
            }[status] || '❓';
            
            console.log(`   ${emoji} ${status}: ${count}`);
        });
        
        if (enviar) {
            const totalEnviados = resultados
                .filter(r => r.status === 'enviado')
                .reduce((sum, r) => sum + (r.enviados || 0), 0);
            
            console.log(`\n📤 Total de mensagens enviadas: ${totalEnviados}`);
        }
        
        // Salvar log
        const fs = require('fs');
        fs.mkdirSync('./logs', { recursive: true });
        fs.writeFileSync(
            `./logs/investidor10-processamento-${Date.now()}.json`,
            JSON.stringify({
                timestamp: new Date().toISOString(),
                total_fiis: fiisProcessar.length,
                usuarios: usuarios.length,
                modo: enviar ? 'enviar' : 'preview',
                resultados: resultados
            }, null, 2)
        );
        
        console.log('\n✅ Processo concluído!\n');
        
    } catch (error) {
        console.error('\n❌ Erro fatal:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = { buscarListaFIIs, processarFII };
