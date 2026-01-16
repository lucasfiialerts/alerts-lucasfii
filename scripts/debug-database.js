#!/usr/bin/env node

/**
 * Script Debug - Verificar Dados no Banco
 */

const baseURL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

async function debugDatabase() {
  console.log('🔍 Verificando dados no banco...');

  try {
    // Importar db e schema (simulado com fetch para API route)
    console.log('\n📊 Buscando usuários com FIIs seguidos...');
    
    // Vou criar uma API route para debug
    const response = await fetch(`${baseURL}/api/debug/fii-follows`, {
      method: 'GET',
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('Resultado:', JSON.stringify(result, null, 2));
    } else {
      console.log('❌ Erro na API de debug:', response.status);
    }

  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

debugDatabase().catch(console.error);
