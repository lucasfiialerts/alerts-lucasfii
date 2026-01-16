#!/usr/bin/env node
/**
 * Teste do serviço Status Invest em TypeScript via tsx
 * 
 * Uso: npx tsx scripts/test-statusinvest-service.ts KNRI11
 */

import { 
  getComunicadosStatusInvest, 
  getComunicadosRecentes, 
  formatComunicadosForWhatsApp 
} from '../src/lib/status-invest-service';

const ticker = (process.argv[2] || 'KNRI11').toUpperCase();
const dias = parseInt(process.argv[3] || '7');

async function main() {
  console.log(`\n🔍 Testando Status Invest Service para ${ticker}...\n`);
  
  // Teste 1: Buscar todos os comunicados
  console.log('═'.repeat(70));
  console.log('TESTE 1: getComunicadosStatusInvest()');
  console.log('═'.repeat(70));
  
  const todosComunicados = await getComunicadosStatusInvest(ticker);
  console.log(`✅ Total de comunicados: ${todosComunicados.length}`);
  
  if (todosComunicados.length > 0) {
    console.log('\n📋 Primeiro comunicado:');
    console.log(JSON.stringify(todosComunicados[0], null, 2));
  }
  
  // Teste 2: Buscar comunicados recentes
  console.log('\n' + '═'.repeat(70));
  console.log(`TESTE 2: getComunicadosRecentes(${dias} dias)`);
  console.log('═'.repeat(70));
  
  const comunicadosRecentes = await getComunicadosRecentes(ticker, dias);
  console.log(`✅ Comunicados nos últimos ${dias} dias: ${comunicadosRecentes.length}`);
  
  comunicadosRecentes.forEach((com, i) => {
    console.log(`\n${i + 1}. ${com.description}`);
    console.log(`   📅 Entrega: ${com.dataEntrega}`);
    console.log(`   🔗 ${com.link}`);
  });
  
  // Teste 3: Formatação para WhatsApp
  console.log('\n' + '═'.repeat(70));
  console.log('TESTE 3: formatComunicadosForWhatsApp()');
  console.log('═'.repeat(70));
  
  const mensagem = formatComunicadosForWhatsApp(comunicadosRecentes.slice(0, 3));
  console.log('\n📱 Prévia da mensagem WhatsApp:\n');
  console.log(mensagem);
  
  console.log('\n' + '═'.repeat(70));
  console.log('✅ Todos os testes concluídos!');
  console.log('═'.repeat(70));
}

main().catch(console.error);
