#!/bin/bash

# Script para testar a conexão com o banco de dados
# Execute com: npm run test-db

echo "🔧 Testando conexão com o banco de dados..."

# Verificar se as variáveis de ambiente estão definidas
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL não está definida no arquivo .env"
    exit 1
fi

echo "✅ DATABASE_URL configurada"

# Tentar conectar ao banco
node -e "
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 5000,
});

async function testConnection() {
  try {
    const client = await pool.connect();
    console.log('✅ Conexão com banco estabelecida com sucesso');
    
    const result = await client.query('SELECT NOW()');
    console.log('⏰ Hora do servidor:', result.rows[0].now);
    
    client.release();
    await pool.end();
    console.log('✅ Teste de conexão finalizado');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao conectar com o banco:', error.message);
    process.exit(1);
  }
}

testConnection();
"