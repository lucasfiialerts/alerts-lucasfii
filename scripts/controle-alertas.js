/**
 * 🔍 Sistema de Controle de Alertas Enviados
 * Previne duplicação de alertas e rastreia histórico
 */

const { Pool } = require('pg');
const crypto = require('crypto');

// Pool de conexões com o banco
let pool = null;

function getPool() {
    if (!pool) {
        pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: process.env.DATABASE_URL?.includes('neon.tech') ? { rejectUnauthorized: false } : false
        });
    }
    return pool;
}

/**
 * Verifica se um alerta já foi enviado
 */
async function jaEnviouAlerta(userId, ticker, documentoData, documentoTipo = 'Relatório Gerencial') {
    try {
        const client = getPool();
        
        const query = `
            SELECT id, enviado_em 
            FROM investidor10_alertas_enviados 
            WHERE user_id = $1 
              AND ticker = $2 
              AND documento_data = $3
              AND documento_tipo = $4
            LIMIT 1
        `;
        
        const result = await client.query(query, [userId, ticker, documentoData, documentoTipo]);
        
        if (result.rows.length > 0) {
            console.log(`   ⏭️  Alerta já enviado em ${result.rows[0].enviado_em.toISOString()}`);
            return true;
        }
        
        return false;
    } catch (error) {
        console.error('❌ Erro ao verificar alerta:', error.message);
        // Em caso de erro, permitir envio para não bloquear o sistema
        return false;
    }
}

/**
 * Registra que um alerta foi enviado
 */
async function registrarAlertaEnviado(userId, ticker, documentoData, documentoUrl, documentoTipo = 'Relatório Gerencial', textoCompleto = '') {
    try {
        const client = getPool();
        
        // Gerar hash do documento (para verificação futura)
        const hash = crypto.createHash('md5').update(textoCompleto || documentoUrl).digest('hex');
        
        const query = `
            INSERT INTO investidor10_alertas_enviados 
            (user_id, ticker, documento_tipo, documento_data, documento_url, documento_hash)
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (user_id, ticker, documento_data, documento_tipo) 
            DO UPDATE SET enviado_em = NOW()
            RETURNING id
        `;
        
        await client.query(query, [userId, ticker, documentoTipo, documentoData, documentoUrl, hash]);
        
        console.log(`   💾 Alerta registrado no banco`);
        return true;
    } catch (error) {
        console.error('❌ Erro ao registrar alerta:', error.message);
        return false;
    }
}

/**
 * Busca todos os FIIs que os usuários acompanham
 */
async function buscarFIIsAcompanhados(usuarios) {
    const fiisSet = new Set();
    
    for (const usuario of usuarios) {
        if (usuario.fiisAcompanhados && Array.isArray(usuario.fiisAcompanhados)) {
            usuario.fiisAcompanhados.forEach(fii => {
                const ticker = typeof fii === 'string' ? fii : fii?.ticker;
                if (ticker) {
                    fiisSet.add(ticker.toUpperCase());
                }
            });
        }
    }
    
    return Array.from(fiisSet).sort();
}

/**
 * Verifica se um documento é recente (últimos 30 dias)
 */
function isDocumentoRecente(documentoData) {
    try {
        // Parsear data do formato DD/MM/YYYY
        const [dia, mes, ano] = documentoData.split('/').map(Number);
        const dataDoc = new Date(ano, mes - 1, dia);
        const hoje = new Date();
        
        // Diferença em dias
        const diffTime = hoje - dataDoc;
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        
        // Considerar recente se for dos últimos 30 dias
        return diffDays <= 30;
    } catch (error) {
        console.error('Erro ao parsear data:', documentoData);
        return true; // Em caso de erro, considerar recente
    }
}

/**
 * Limpa alertas antigos (mais de 90 dias)
 */
async function limparAlertasAntigos() {
    try {
        const client = getPool();
        
        const query = `
            DELETE FROM investidor10_alertas_enviados 
            WHERE enviado_em < NOW() - INTERVAL '90 days'
        `;
        
        const result = await client.query(query);
        console.log(`🗑️  ${result.rowCount} alertas antigos removidos`);
        
        return result.rowCount;
    } catch (error) {
        console.error('❌ Erro ao limpar alertas antigos:', error.message);
        return 0;
    }
}

/**
 * Busca histórico de alertas de um usuário
 */
async function buscarHistoricoUsuario(userId, limite = 50) {
    try {
        const client = getPool();
        
        const query = `
            SELECT ticker, documento_tipo, documento_data, enviado_em
            FROM investidor10_alertas_enviados 
            WHERE user_id = $1
            ORDER BY enviado_em DESC
            LIMIT $2
        `;
        
        const result = await client.query(query, [userId, limite]);
        return result.rows;
    } catch (error) {
        console.error('❌ Erro ao buscar histórico:', error.message);
        return [];
    }
}

module.exports = {
    jaEnviouAlerta,
    registrarAlertaEnviado,
    buscarFIIsAcompanhados,
    isDocumentoRecente,
    limparAlertasAntigos,
    buscarHistoricoUsuario
};
