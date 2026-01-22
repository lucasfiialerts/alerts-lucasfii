#!/usr/bin/env node

/**
 * Teste local do processamento Investidor10
 */

const baseURL = 'http://localhost:3000';

async function testar() {
  console.log('🧪 Testando processamento Investidor10 localmente\n');
  console.log('='.repeat(70));
  
  try {
    console.log('\n1️⃣ Chamando API de processamento...\n');
    
    const response = await fetch(
      `${baseURL}/api/cron/investidor10-relatorios?secret=fii-alerts-webhook-2025-secure-key&limite=3`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    const result = await response.json();
    
    console.log('📊 Resultado:');
    console.log(JSON.stringify(result, null, 2));
    
    console.log('\n' + '='.repeat(70));
    
    if (result.success) {
      console.log('✅ Processamento concluído com sucesso!');
      console.log(`   📊 FIIs processados: ${result.stats.fiis_processados}`);
      console.log(`   📤 Mensagens enviadas: ${result.stats.mensagens_enviadas}`);
      console.log(`   👥 Usuários ativos: ${result.stats.usuarios_ativos}`);
      console.log(`   ⏱️  Duração: ${result.stats.duracao_segundos}s`);
      
      if (result.stats.mensagens_enviadas === 0 && result.stats.fiis_processados > 0) {
        console.log('\n⚠️  ATENÇÃO: Nenhuma mensagem foi enviada!');
        console.log('   Possíveis causas:');
        console.log('   - Usuários não acompanham os FIIs processados');
        console.log('   - Relatórios não são recentes (últimos 30 dias)');
        console.log('   - WhatsApp não está verificado');
      } else if (result.stats.usuarios_ativos === 0) {
        console.log('\n⚠️  ATENÇÃO: Nenhum usuário ativo!');
        console.log('   Verifique se há usuários com alertPreferencesFnet ativo');
      } else if (result.stats.fiis_processados === 0) {
        console.log('\n⚠️  ATENÇÃO: Nenhum FII processado!');
        console.log('   Usuários ativos não estão acompanhando nenhum FII');
      }
    } else {
      console.log('❌ Erro no processamento:', result.error);
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

testar().catch(console.error);
