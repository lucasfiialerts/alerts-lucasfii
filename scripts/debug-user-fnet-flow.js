#!/usr/bin/env node

/**
 * Script para debugar por que o usuário com FNet ativo não está recebendo alertas
 */

const baseURL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

async function debugUserFNetFlow() {
  console.log('🔍 Debug completo do fluxo FNet para usuário...\n');

  try {
    // 1. Buscar usuário com FNet ativo via API debug
    console.log('1️⃣ Buscando usuário com FNet ativo...');
    const prefResponse = await fetch(`${baseURL}/api/debug/user-preferences`);
    const prefResult = await prefResponse.json();
    
    const fnetUser = prefResult.users.find(user => user.alertPreferencesFnet === true);
    if (!fnetUser) {
      console.log('❌ Nenhum usuário com FNet ativo');
      return;
    }

    console.log(`✅ Usuário: ${fnetUser.email} (${fnetUser.id})`);

    // 2. Verificar detalhes do usuário no banco
    console.log('\n2️⃣ Verificando detalhes do usuário no banco...');
    
    // Simular busca do banco (usando a mesma lógica do webhook)
    const testResponse = await fetch(`${baseURL}/api/test-user-details`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: fnetUser.id })
    });

    if (testResponse.ok) {
      const userDetails = await testResponse.json();
      console.log(`   📧 Email: ${userDetails.email}`);
      console.log(`   📱 WhatsApp: ${userDetails.whatsappNumber || 'NÃO DEFINIDO'}`);
      console.log(`   ✅ WhatsApp Verificado: ${userDetails.whatsappVerified ? 'SIM' : 'NÃO'}`);
      console.log(`   🔗 FNet Ativo: ${userDetails.alertPreferencesFnet ? 'SIM' : 'NÃO'}`);
      console.log(`   📊 FIIs Seguidos: ${userDetails.followedFIIs?.length || 0}`);
      
      if (userDetails.followedFIIs?.length > 0) {
        console.log(`   📈 Lista FIIs: ${userDetails.followedFIIs.join(', ')}`);
      }
    } else {
      console.log(`   ❌ Erro ao buscar detalhes do usuário: ${testResponse.status}`);
    }

    // 3. Testar busca de documentos FNet
    console.log('\n3️⃣ Testando busca de documentos FNet...');
    const fnetDocsResponse = await fetch(`${baseURL}/api/cron/fnet-alerts?test=true&debug=true`);
    
    if (fnetDocsResponse.ok) {
      const fnetResult = await fnetDocsResponse.json();
      console.log(`   📄 Documentos encontrados: ${fnetResult.count}`);
      
      if (fnetResult.count > 0) {
        console.log('   📋 Primeiros documentos:');
        fnetResult.documents.slice(0, 3).forEach((doc, i) => {
          console.log(`      ${i+1}. ${doc.fundoName} - ${doc.documentType}`);
        });
      }
    }

    // 4. Executar webhook e verificar logs
    console.log('\n4️⃣ Executando webhook FNet com debug...');
    const webhookResponse = await fetch(`${baseURL}/api/cron/fnet-alerts`, {
      method: 'POST',
      headers: {
        'x-webhook-secret': 'fii-alerts-webhook-2025-secure-key',
        'Content-Type': 'application/json'
      }
    });

    if (webhookResponse.ok) {
      const webhookResult = await webhookResponse.json();
      console.log(`   ✅ Webhook executado:`);
      console.log(`      👥 Usuários processados: ${webhookResult.processedUsers}`);
      console.log(`      📱 Alertas enviados: ${webhookResult.sentAlerts}`);
      console.log(`      📝 Mensagem: ${webhookResult.message}`);
      
      if (webhookResult.processedUsers === 0) {
        console.log(`\n❌ PROBLEMA IDENTIFICADO: Usuário não foi processado`);
        console.log(`   Possíveis causas:`);
        console.log(`   • WhatsApp não verificado`);
        console.log(`   • Nenhum FII seguido`);
        console.log(`   • Erro na consulta do banco de dados`);
      }
    }

  } catch (error) {
    console.error('❌ Erro no debug:', error);
  }
}

debugUserFNetFlow().catch(console.error);