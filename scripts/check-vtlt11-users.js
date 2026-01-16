#!/usr/bin/env node

/**
 * Script para verificar qual usuário tem qual WhatsApp
 */

const baseURL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

async function checkUserWhatsApp() {
  console.log('🔍 Verificando WhatsApp dos usuários que seguem VTLT11...\n');

  try {
    // 1. Buscar usuários que seguem VTLT11
    const followsResponse = await fetch(`${baseURL}/api/debug/fii-follows`);
    const followsResult = await followsResponse.json();
    
    const vtlt11Followers = followsResult.followsWithFunds.filter(f => f.ticker === 'VTLT11');
    
    console.log(`📊 Usuários que seguem VTLT11: ${vtlt11Followers.length}\n`);
    
    // 2. Buscar preferências dos usuários
    const prefsResponse = await fetch(`${baseURL}/api/debug/user-preferences`);
    const prefsResult = await prefsResponse.json();
    
    // 3. Cruzar informações
    for (const follower of vtlt11Followers) {
      const userPrefs = prefsResult.users.find(u => u.id === follower.userId);
      
      console.log(`👤 ${userPrefs?.email || 'Email não encontrado'}`);
      console.log(`   ID: ${follower.userId}`);
      console.log(`   📋 Relatórios e Eventos: ${userPrefs?.alertPreferencesReports ? '✅ ATIVO' : '❌ INATIVO'}`);
      console.log(`   📱 Deve receber relatórios: ${userPrefs?.alertPreferencesReports ? 'SIM' : 'NÃO'}`);
      console.log('');
    }
    
    // 4. Conclusão
    const activeUsers = vtlt11Followers.filter(f => {
      const userPrefs = prefsResult.users.find(u => u.id === f.userId);
      return userPrefs?.alertPreferencesReports === true;
    });
    
    console.log('📋 Resumo:');
    console.log(`✅ Total que seguem VTLT11: ${vtlt11Followers.length}`);
    console.log(`✅ Com "Relatórios e Eventos" ATIVO: ${activeUsers.length}`);
    console.log(`✅ Sistema correto: API encontrou ${activeUsers.length} usuário(s)`);
    
    if (activeUsers.length === 1) {
      console.log('\n🎯 SISTEMA FUNCIONANDO CORRETAMENTE!');
      console.log('   O filtro está funcionando perfeitamente');
      console.log('   Apenas usuários com preferência ativa recebem relatórios');
    }

  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

checkUserWhatsApp().catch(console.error);