#!/usr/bin/env node

/**
 * Script para verificar usuários com FNet B3 ativo
 */

const baseURL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

async function checkFnetUsers() {
  console.log('🔍 Verificando usuários com FNet B3 ativo...\n');

  try {
    const response = await fetch(`${baseURL}/api/debug/user-preferences`);
    
    if (!response.ok) {
      console.log('❌ Erro ao buscar preferências dos usuários');
      return;
    }

    const result = await response.json();
    
    console.log(`📊 Total de usuários: ${result.users.length}\n`);

    // Filtrar usuários com FNet ativo
    const fnetUsers = result.users.filter(user => user.alertPreferencesFnet === true);
    
    console.log(`🎯 Usuários com FNet B3 ativo: ${fnetUsers.length}\n`);
    
    if (fnetUsers.length > 0) {
      fnetUsers.forEach((user, index) => {
        console.log(`${index + 1}. 👤 ${user.email || 'Email não informado'}`);
        console.log(`   ID: ${user.id}`);
        console.log(`   🔗 FNet B3: ✅ ATIVO`);
        console.log('   ' + '─'.repeat(50));
      });
      
      console.log(`\n✅ ${fnetUsers.length} usuário(s) receberão alertas do FNet B3`);
    } else {
      console.log('⚠️  Nenhum usuário tem o FNet B3 ativo');
      console.log('💡 Para ativar, acesse a página de configuração e ative o card "FNet B3 - Documentos Oficiais"');
    }

  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

checkFnetUsers().catch(console.error);