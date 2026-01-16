#!/usr/bin/env node

/**
 * Debug completo para o usuário com FNet ativo
 */

const baseURL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

async function debugFnetUser() {
  console.log('🔍 Debug completo para usuário FNet...\n');

  try {
    // 1. Verificar usuários com FNet ativo
    console.log('1️⃣ Verificando usuários com FNet ativo...');
    const response = await fetch(`${baseURL}/api/debug/user-preferences`);
    
    if (!response.ok) {
      console.log('❌ Erro ao buscar preferências dos usuários');
      return;
    }

    const result = await response.json();
    const fnetUser = result.users.find(user => user.alertPreferencesFnet === true);
    
    if (!fnetUser) {
      console.log('❌ Nenhum usuário com FNet ativo encontrado');
      return;
    }

    console.log(`✅ Usuário encontrado: ${fnetUser.email} (ID: ${fnetUser.id})`);

    // 2. Verificar detalhes do usuário
    console.log('\n2️⃣ Verificando detalhes do usuário...');
    console.log(`   📧 Email: ${fnetUser.email}`);
    console.log(`   🆔 ID: ${fnetUser.id}`);
    console.log(`   🔗 FNet: ${fnetUser.alertPreferencesFnet ? '✅ ATIVO' : '❌ INATIVO'}`);
    
    // 3. Testar busca de documentos FNet
    console.log('\n3️⃣ Testando busca de documentos FNet...');
    const fnetResponse = await fetch(`${baseURL}/api/cron/fnet-alerts?test=true`);
    
    if (fnetResponse.ok) {
      const fnetResult = await fnetResponse.json();
      console.log(`✅ Documentos encontrados: ${fnetResult.count}`);
      
      if (fnetResult.count > 0) {
        console.log('📄 Exemplos de documentos:');
        fnetResult.documents.slice(0, 3).forEach((doc, index) => {
          console.log(`   ${index + 1}. ${doc.fundoName} - ${doc.documentType}`);
          console.log(`      📅 ${doc.receiptDate} | 🔗 ${doc.viewUrl}`);
        });
      }
    } else {
      console.log('❌ Erro ao buscar documentos FNet');
    }

    // 4. Simular execução do webhook
    console.log('\n4️⃣ Executando webhook FNet...');
    const webhookResponse = await fetch(`${baseURL}/api/cron/fnet-alerts`, {
      method: 'POST',
      headers: {
        'x-webhook-secret': 'fii-alerts-webhook-2025-secure-key'
      }
    });

    if (webhookResponse.ok) {
      const webhookResult = await webhookResponse.json();
      console.log(`✅ Webhook executado:`);
      console.log(`   👥 Usuários processados: ${webhookResult.processedUsers}`);
      console.log(`   📱 Alertas enviados: ${webhookResult.sentAlerts}`);
      console.log(`   💬 Mensagem: ${webhookResult.message}`);
    } else {
      console.log('❌ Erro ao executar webhook');
    }

  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

debugFnetUser().catch(console.error);