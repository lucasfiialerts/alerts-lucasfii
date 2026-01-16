#!/usr/bin/env node

/**
 * Script para testar a query SQL diretamente
 */

const baseURL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

async function testNotifyAPI() {
  console.log('🧪 Testando API de notificação diretamente...\n');

  try {
    // Testar com o VTLT11 que sabemos que o usuário segue
    const response = await fetch(`${baseURL}/api/fii/notify-followers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ticker: 'VTLT11',
        pdfUrl: 'https://test-pdf-url.com/test.pdf',
        reportDate: 'Teste/2025',
        testMode: true // Modo teste para não enviar de verdade
      })
    });

    if (!response.ok) {
      console.log('❌ Erro na API:', response.status);
      const errorText = await response.text();
      console.log('Erro:', errorText);
      return;
    }

    const result = await response.json();
    console.log('📊 Resultado da API:');
    console.log('✅ Status:', result.success);
    console.log('📋 Mensagem:', result.data?.message || result.message);
    console.log('👥 Seguidores encontrados:', result.data?.followersFound || 0);
    
    if (result.data?.followersFound > 0) {
      console.log('\n⚠️  PROBLEMA CONFIRMADO:');
      console.log('A API ainda está encontrando seguidores mesmo com o filtro');
      console.log('Isso significa que o usuário tem alertPreferencesReports = true no banco');
      console.log('Mas na interface aparece como false');
    } else {
      console.log('\n✅ FILTRO FUNCIONANDO:');
      console.log('Nenhum seguidor encontrado, filtro está correto');
    }

  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

testNotifyAPI().catch(console.error);