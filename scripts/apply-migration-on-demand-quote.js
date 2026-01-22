#!/usr/bin/env node

/**
 * Script para aplicar migration: adicionar coluna alert_preferences_on_demand_quote
 */

const { Client } = require('pg');
require('dotenv').config();

async function applyMigration() {
  console.log('🔄 Aplicando migration: add_on_demand_quote\n');
  
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });
  
  try {
    await client.connect();
    console.log('✅ Conectado ao banco de dados\n');
    
    // Verificar se a coluna já existe
    const checkResult = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'user' 
        AND column_name = 'alert_preferences_on_demand_quote'
    `);
    
    if (checkResult.rows.length > 0) {
      console.log('⚠️  Coluna já existe! Migration já foi aplicada.\n');
      return;
    }
    
    // Aplicar migration
    console.log('📝 Adicionando coluna alert_preferences_on_demand_quote...');
    await client.query(`
      ALTER TABLE "user" 
      ADD COLUMN "alert_preferences_on_demand_quote" boolean DEFAULT false
    `);
    
    console.log('✅ Coluna adicionada com sucesso!\n');
    
    // Verificar resultado
    const verifyResult = await client.query(`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns 
      WHERE table_name = 'user' 
        AND column_name = 'alert_preferences_on_demand_quote'
    `);
    
    console.log('📊 Verificação:');
    console.log(verifyResult.rows[0]);
    console.log('\n✅ Migration aplicada com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro ao aplicar migration:', error.message);
    throw error;
  } finally {
    await client.end();
  }
}

applyMigration().catch(console.error);
