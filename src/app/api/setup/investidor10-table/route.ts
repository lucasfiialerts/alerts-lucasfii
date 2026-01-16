import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

/**
 * Criar tabela de controle de alertas
 */
export async function GET(request: NextRequest) {
  try {
    const pool = new Pool({ 
      connectionString: process.env.DATABASE_URL!,
      ssl: process.env.DATABASE_URL?.includes('neon.tech') ? { rejectUnauthorized: false } : false
    });
    
    // Criar tabela
    await pool.query(`
      CREATE TABLE IF NOT EXISTS investidor10_alertas_enviados (
        id SERIAL PRIMARY KEY,
        user_id TEXT NOT NULL,
        ticker TEXT NOT NULL,
        documento_tipo TEXT NOT NULL,
        documento_data TEXT NOT NULL,
        documento_url TEXT NOT NULL,
        documento_hash TEXT,
        enviado_em TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id, ticker, documento_data, documento_tipo)
      )
    `);
    
    // Criar índices
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_alertas_user_ticker 
      ON investidor10_alertas_enviados(user_id, ticker)
    `);
    
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_alertas_enviado_em 
      ON investidor10_alertas_enviados(enviado_em)
    `);
    
    await pool.end();
    
    console.log('✅ Tabela investidor10_alertas_enviados criada');
    
    return NextResponse.json({
      success: true,
      message: 'Tabela criada com sucesso'
    });
    
  } catch (error: any) {
    console.error('❌ Erro ao criar tabela:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error.message
      },
      { status: 500 }
    );
  }
}
