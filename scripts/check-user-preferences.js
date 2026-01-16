#!/usr/bin/env node

/**
 * Script Debug - Verificar Preferências de Usuários
 */

const baseURL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

async function checkUserPreferences() {
  console.log('🔍 Verificando preferências dos usuários...\n');

  try {
    // Criar API route para verificar preferências
    const response = await fetch(`${baseURL}/api/debug/user-preferences`, {
      method: 'GET',
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log(`📊 Encontrados ${result.users.length} usuários:\n`);

      result.users.forEach((user, index) => {
        console.log(`${index + 1}. 👤 ${user.email || 'Email não informado'}`);
        console.log(`   ID: ${user.id}`);
        console.log(`   📋 Relatórios e Eventos: ${user.alertPreferencesReports ? '✅ Ativo' : '❌ Inativo'}`);
        console.log(`   📈 Variação: ${user.alertPreferencesVariation ? '✅ Ativo' : '❌ Inativo'}`);
        console.log(`   � Fechamento do Mercado: ${user.alertPreferencesMarketClose ? '✅ Ativo' : '❌ Inativo'}`);
        console.log(`   �️  Tesouro Direto: ${user.alertPreferencesTreasury ? '✅ Ativo' : '❌ Inativo'}`);
        console.log(`   � Atualização Automática: ${user.alertPreferencesAutoUpdate ? '✅ Ativo' : '❌ Inativo'}`);
        console.log(`   💰 Rendimentos: ${user.alertPreferencesYield ? '✅ Ativo' : '❌ Inativo'}`);
        console.log('   ' + '─'.repeat(50));
      });
    } else {
      console.log('❌ Erro na API de debug:', response.status);
    }

  } catch (error) {
    console.error('❌ Erro ao verificar preferências:', error);
  }
}

checkUserPreferences().catch(console.error);