#!/usr/bin/env node
/**
 * Script de teste para enviar alertas de comunicados via Status Invest
 */

import { db } from '../src/db';
import { userTable, userFiiFollowTable, fiiFundTable, sentAlertTable } from '../src/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { getComunicadosRecentes, formatComunicadosForWhatsApp, ComunicadoStatusInvest } from '../src/lib/status-invest-service';
import { sendWhatsAppMessage } from '../src/lib/whatsapp-api';

// Filtro de comunicados relevantes
function filtrarComunicadosRelevantes(comunicados: ComunicadoStatusInvest[]): ComunicadoStatusInvest[] {
  return comunicados.filter(com => {
    const cat = com.categoria.toLowerCase();
    const tipo = com.tipo.toLowerCase();
    const desc = com.description.toLowerCase();
    
    // Incluir: Relatórios Gerenciais
    if (cat.includes('relatório') && tipo.includes('gerencial')) return true;
    
    // Incluir: Fatos Relevantes
    if (cat.includes('fato') || desc.includes('fato relevante')) return true;
    
    // Incluir: Informes Mensais e Trimestrais
    if (cat.includes('informe') || desc.includes('informe')) {
      if (tipo.includes('mensal') || tipo.includes('trimestral') || 
          desc.includes('informe mensal') || desc.includes('informe trimestral')) {
        return true;
      }
    }
    
    return false;
  });
}

async function main() {
  console.log('🔍 Buscando usuários com alerta StatusInvest ativo...\n');
  
  const users = await db.select().from(userTable).where(
    and(
      eq(userTable.whatsappVerified, true),
      eq(userTable.alertPreferencesStatusInvest, true)
    )
  );
  
  console.log(`👥 Usuários encontrados: ${users.length}`);
  
  for (const user of users) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📧 Usuário: ${user.email}`);
    console.log(`📱 WhatsApp: ${user.whatsappNumber}`);
    
    // Buscar FIIs do usuário
    const fiis = await db.select({ ticker: fiiFundTable.ticker })
      .from(userFiiFollowTable)
      .innerJoin(fiiFundTable, eq(userFiiFollowTable.fundId, fiiFundTable.id))
      .where(eq(userFiiFollowTable.userId, user.id));
    
    console.log(`📊 FIIs seguidos: ${fiis.map(f => f.ticker).join(', ')}`);
    
    if (fiis.length === 0) {
      console.log('⚠️ Nenhum FII seguido');
      continue;
    }
    
    // Buscar comunicados de cada FII
    const allComunicados: ComunicadoStatusInvest[] = [];
    
    for (const fii of fiis) {
      console.log(`\n🔎 Buscando ${fii.ticker}...`);
      const comunicados = await getComunicadosRecentes(fii.ticker, 7);
      const relevantes = filtrarComunicadosRelevantes(comunicados);
      console.log(`   Total: ${comunicados.length}, Relevantes: ${relevantes.length}`);
      allComunicados.push(...relevantes);
    }
    
    console.log(`\n📋 Total de comunicados relevantes: ${allComunicados.length}`);
    
    if (allComunicados.length === 0) {
      console.log('⚠️ Nenhum comunicado relevante nos últimos 7 dias');
      continue;
    }
    
    // Listar comunicados
    allComunicados.forEach(c => {
      console.log(`   - ${c.ticker}: ${c.description} (${c.dataEntrega})`);
    });
    
    // Verificar já enviados
    const alertKeys = allComunicados.map(c => `statusinvest-${c.fnetDocId}`);
    const sent = await db.select().from(sentAlertTable).where(inArray(sentAlertTable.alertKey, alertKeys));
    const sentKeys = new Set(sent.map(a => a.alertKey));
    const novos = allComunicados.filter(c => !sentKeys.has(`statusinvest-${c.fnetDocId}`));
    
    console.log(`\n✉️ Novos (não enviados ainda): ${novos.length}`);
    
    if (novos.length === 0) {
      console.log('✅ Todos os comunicados já foram enviados anteriormente');
      continue;
    }
    
    // Formatar mensagem
    const msg = formatComunicadosForWhatsApp(novos);
    console.log('\n📱 Mensagem a enviar:');
    console.log('─'.repeat(40));
    console.log(msg);
    console.log('─'.repeat(40));
    
    // Enviar
    console.log(`\n🚀 Enviando para ${user.whatsappNumber}...`);
    try {
      await sendWhatsAppMessage(user.whatsappNumber!, msg);
      console.log('✅ Enviado com sucesso!');
      
      // Marcar como enviado
      for (const c of novos) {
        await db.insert(sentAlertTable).values({
          alertKey: `statusinvest-${c.fnetDocId}`,
          alertType: 'status-invest-comunicado',
          userId: user.id
        }).onConflictDoNothing();
      }
      console.log('📝 Marcados como enviados no banco');
    } catch (error) {
      console.error('❌ Erro ao enviar:', error);
    }
  }
  
  console.log(`\n${'='.repeat(60)}`);
  console.log('✅ Teste concluído!');
  process.exit(0);
}

main().catch(console.error);
