#!/usr/bin/env node

/**
 * Script para verificar inconsistência nos dados do usuário
 */

const baseURL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

async function checkDataInconsistency() {
  console.log('🔍 Verificando inconsistência de dados...\n');

  try {
    // 1. Verificar preferências via API de debug
    console.log('📊 1. Dados da API de preferências:');
    const prefsResponse = await fetch(`${baseURL}/api/debug/user-preferences`);
    const prefsResult = await prefsResponse.json();
    
    const targetUser = prefsResult.users.find(u => u.id === 'mTqkl1psaUNhKnwZ3nEMAOkY7Y6EpLS2');
    if (targetUser) {
      console.log(`   👤 ${targetUser.email}`);
      console.log(`   📋 alertPreferencesReports: ${targetUser.alertPreferencesReports}`);
    }

    // 2. Verificar que usuários a API de notificação encontra para VTLT11
    console.log('\n📊 2. Dados da API de notificação:');
    const notifyResponse = await fetch(`${baseURL}/api/fii/notify-followers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ticker: 'VTLT11',
        pdfUrl: 'https://test.pdf',
        reportDate: 'Test/2025',
        testMode: true
      })
    });
    
    const notifyResult = await notifyResponse.json();
    console.log(`   👥 Seguidores encontrados: ${notifyResult.data?.followersFound || 0}`);
    
    if (notifyResult.data?.sentResults) {
      notifyResult.data.sentResults.forEach(result => {
        console.log(`   📱 WhatsApp: ${result.phone}`);
      });
    }

    // 3. Análise
    console.log('\n🔍 3. Análise:');
    if (targetUser && !targetUser.alertPreferencesReports && notifyResult.data?.followersFound > 0) {
      console.log('⚠️  INCONSISTÊNCIA DETECTADA:');
      console.log('   - API de preferências mostra: alertPreferencesReports = false');
      console.log('   - API de notificação encontra o usuário (deveria filtrar)');
      console.log('   - Possível problema: dados diferentes entre APIs');
    } else if (targetUser && targetUser.alertPreferencesReports) {
      console.log('✅ DADOS CONSISTENTES:');
      console.log('   - Usuário tem preferência ativa');
      console.log('   - API de notificação encontrou corretamente');
    } else {
      console.log('✅ FILTRO FUNCIONANDO:');
      console.log('   - Preferência inativa e API não encontrou usuário');
    }

  } catch (error) {
    console.error('❌ Erro na verificação:', error);
  }
}

checkDataInconsistency().catch(console.error);