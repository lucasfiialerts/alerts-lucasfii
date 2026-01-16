#!/usr/bin/env node

/**
 * Teste de conexão com o novo banco usando configurações do drizzle
 */

require('dotenv').config();
const { Pool } = require('pg');

async function testNewDatabase() {
  console.log('🔍 Testando conexão com novo banco...\n');

  let pool;

  try {
    // Verificar configurações do .env
    console.log('🔍 Verificando configurações:');
    console.log('DATABASE_URL:', !!process.env.DATABASE_URL ? 'Configurado' : 'Não configurado');
    console.log('POSTGRES_HOST:', process.env.POSTGRES_HOST || 'Não configurado');
    console.log('POSTGRES_DATABASE:', process.env.POSTGRES_DATABASE || 'Não configurado');

    // Criar pool usando DATABASE_URL se disponível, senão usar variáveis separadas
    if (process.env.DATABASE_URL) {
      console.log('\n🔗 Conectando via DATABASE_URL...');
      pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
      });
    } else {
      console.log('\n🔗 Conectando via variáveis individuais...');
      pool = new Pool({
        host: process.env.POSTGRES_HOST,
        port: parseInt(process.env.POSTGRES_PORT || "5432"),
        user: process.env.POSTGRES_USER,
        password: process.env.POSTGRES_PASSWORD,
        database: process.env.POSTGRES_DATABASE,
        ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
      });
    }

    // Testar consulta simples
    console.log('📊 Executando query de teste...');
    
    const result = await pool.query(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN alert_preferences_bitcoin = true THEN 1 END) as bitcoin_users,
        COUNT(CASE WHEN whatsapp_verified = true THEN 1 END) as whatsapp_users
      FROM "user"
    `);

    const stats = result.rows[0];
    console.log('✅ Conexão bem-sucedida!');
    console.log('📊 Estatísticas do banco:');
    console.log(`   👥 Total usuários: ${stats.total_users}`);
    console.log(`   ₿ Com Bitcoin ativo: ${stats.bitcoin_users}`);
    console.log(`   📱 WhatsApp verificado: ${stats.whatsapp_users}`);

    // Buscar usuários específicos com Bitcoin ativo
    const bitcoinResult = await pool.query(`
      SELECT 
        email,
        whatsapp_number,
        whatsapp_verified,
        alert_preferences_bitcoin
      FROM "user" 
      WHERE alert_preferences_bitcoin = true
      LIMIT 5
    `);

    console.log('\n👤 Usuários com Bitcoin ativo:');
    if (bitcoinResult.rows.length === 0) {
      console.log('   ⚠️ Nenhum usuário encontrado com Bitcoin ativo');
      console.log('   💡 Ative o toggle na página de configuração primeiro');
    } else {
      bitcoinResult.rows.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.email}`);
        console.log(`      📱 WhatsApp: ${user.whatsapp_number || 'Não configurado'}`);
        console.log(`      ✅ Verificado: ${user.whatsapp_verified ? 'Sim' : 'Não'}`);
      });
    }

  } catch (error) {
    console.error('❌ Erro de conexão:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Possíveis soluções:');
      console.log('   • Verificar se DATABASE_URL está correto no .env');
      console.log('   • Confirmar se o novo banco está rodando');
      console.log('   • Verificar firewall/rede');
    }
  } finally {
    if (pool) {
      await pool.end();
    }
  }
}

testNewDatabase();