#!/usr/bin/env node

/**
 * Script de Debug: Usuários Investidor10
 * Verifica usuários com alertPreferencesFnet ativo e seus FIIs seguidos
 */

const baseURL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

async function debugInvestidor10Usuarios() {
  console.log('🔍 Debug: Usuários Investidor10\n');
  console.log('='.repeat(60));

  try {
    // 1. Buscar usuários com FNet ativo
    console.log('\n1️⃣ Buscando usuários com alertPreferencesFnet ativo...');
    const response = await fetch(`${baseURL}/api/debug/user-preferences`);
    
    if (!response.ok) {
      console.error('❌ Erro ao buscar preferências:', response.status);
      return;
    }
    
    const result = await response.json();
    const usuariosFnet = result.users.filter(user => user.alertPreferencesFnet === true);
    
    console.log(`✅ ${usuariosFnet.length} usuários com alertPreferencesFnet ativo`);
    
    if (usuariosFnet.length === 0) {
      console.log('\n❌ PROBLEMA: Nenhum usuário com alertPreferencesFnet ativo!');
      console.log('   Solução: Ativar alertas Investidor10 para pelo menos um usuário.');
      return;
    }
    
    // 2. Verificar detalhes de cada usuário
    console.log('\n2️⃣ Verificando detalhes dos usuários...\n');
    
    const usuariosCompletos = [];
    
    for (const user of usuariosFnet) {
      console.log(`📧 ${user.email}`);
      
      try {
        const detailsResponse = await fetch(`${baseURL}/api/test-user-details`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id })
        });
        
        if (detailsResponse.ok) {
          const userDetails = await detailsResponse.json();
          
          console.log(`   📱 WhatsApp: ${userDetails.whatsappNumber || 'NÃO DEFINIDO'}`);
          console.log(`   ✅ WhatsApp Verificado: ${userDetails.whatsappVerified ? 'SIM' : 'NÃO'}`);
          console.log(`   📊 FIIs Seguidos: ${userDetails.followedFIIs?.length || 0}`);
          
          if (userDetails.followedFIIs && userDetails.followedFIIs.length > 0) {
            console.log(`   🔗 Tickers: [${userDetails.followedFIIs.join(', ')}]`);
          } else {
            console.log('   ⚠️  NENHUM FII SENDO SEGUIDO!');
          }
          
          if (userDetails.whatsappVerified && userDetails.whatsappNumber && userDetails.followedFIIs?.length > 0) {
            usuariosCompletos.push({
              email: userDetails.email,
              whatsapp: userDetails.whatsappNumber,
              fiis: userDetails.followedFIIs
            });
          }
        } else {
          console.log(`   ❌ Erro ao buscar detalhes: ${detailsResponse.status}`);
        }
      } catch (error) {
        console.log(`   ❌ Erro: ${error.message}`);
      }
      
      console.log('');
    }
    
    // 3. Resumo
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMO');
    console.log('='.repeat(60));
    console.log(`✅ Usuários com FNet ativo: ${usuariosFnet.length}`);
    console.log(`✅ Usuários válidos (WhatsApp + FIIs): ${usuariosCompletos.length}`);
    
    if (usuariosCompletos.length === 0) {
      console.log('\n❌ PROBLEMA ENCONTRADO:');
      console.log('   Nenhum usuário tem todos os requisitos:');
      console.log('   - alertPreferencesFnet ativo ✅');
      console.log('   - WhatsApp verificado');
      console.log('   - FIIs sendo seguidos');
      console.log('\n💡 SOLUÇÃO:');
      console.log('   1. Acesse o sistema como um usuário');
      console.log('   2. Ative o alerta "Investidor10" nas preferências');
      console.log('   3. Configure e verifique seu WhatsApp');
      console.log('   4. Siga pelo menos um FII (exemplo: HGLG11, VISC11, etc)');
    } else {
      console.log('\n✅ FIIs únicos sendo acompanhados:');
      const fiisUnicos = [...new Set(usuariosCompletos.flatMap(u => u.fiis))];
      console.log(`   [${fiisUnicos.join(', ')}]`);
      
      console.log('\n💡 O sistema está configurado corretamente!');
      console.log('   Quando houver relatórios novos desses FIIs, os alertas serão enviados.');
    }
    
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

// Executar
debugInvestidor10Usuarios().catch(console.error);
