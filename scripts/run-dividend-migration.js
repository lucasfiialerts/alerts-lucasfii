#!/usr/bin/env node

require("dotenv/config");
const { Pool } = require("pg");
const fs = require("fs");

async function runMigration() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
  });

  try {
    console.log('📦 Aplicando migração de dividendos...');
    
    // Verificar se as tabelas já existem
    const checkQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('fii_dividend', 'dividend_alert_log')
    `;
    
    const existingTables = await pool.query(checkQuery);
    console.log(`   Tabelas existentes: ${existingTables.rows.length}/2`);
    
    if (existingTables.rows.length === 2) {
      console.log('✅ Tabelas já existem, migração não necessária');
      return;
    }
    
    // Ler e executar migração
    const sql = fs.readFileSync('drizzle/0009_add_dividend_tables.sql', 'utf8');
    await pool.query(sql);
    
    console.log('✅ Migração aplicada com sucesso!');
    
    // Verificar novamente
    const newTables = await pool.query(checkQuery);
    console.log(`   Tabelas criadas: ${newTables.rows.length}/2`);
    
    for (const row of newTables.rows) {
      console.log(`   📋 ${row.table_name}`);
    }
    
  } catch (error) {
    console.error('❌ Erro na migração:', error.message);
  } finally {
    await pool.end();
  }
}

runMigration();