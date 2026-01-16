import { NextResponse } from 'next/server';
import { db } from '@/db';
import { 
  userTable, 
  userFiiFollowTable,
  fiiFundTable,
  sentAlertTable 
} from '@/db/schema';
import { eq, inArray, and } from 'drizzle-orm';
import { sendWhatsAppMessage } from '@/lib/whatsapp-api';
import { 
  getComunicadosRecentes, 
  formatComunicadosForWhatsApp,
  ComunicadoStatusInvest 
} from '@/lib/status-invest-service';

/**
 * API para enviar alertas de comunicados via Status Invest
 * 
 * Filtra apenas: Relatórios Gerenciais, Fatos Relevantes, Informes Mensais
 * 
 * POST - Busca comunicados e envia alertas para usuários
 * GET  - Testa a busca de comunicados
 */

// Filtrar apenas os tipos de documentos relevantes
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

export async function POST(request: Request) {
  try {
    // Verificar autenticação do webhook
    const webhookSecret = request.headers.get('X-Webhook-Secret');
    const expectedSecret = process.env.EASYCRON_WEBHOOK_SECRET;
    
    if (expectedSecret && webhookSecret !== expectedSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Permitir modo teste via query param
    const url = new URL(request.url);
    const diasBusca = parseInt(url.searchParams.get('dias') || '2'); // 2 dias por padrão

    console.log('[StatusInvest Cron] Iniciando busca de comunicados...');
    console.log(`[StatusInvest Cron] Buscando comunicados dos últimos ${diasBusca} dias`);
    
    // Buscar usuários ativos com WhatsApp verificado e alertas StatusInvest habilitados
    const users = await db
      .select()
      .from(userTable)
      .where(
        and(
          eq(userTable.whatsappVerified, true),
          eq(userTable.alertPreferencesStatusInvest, true)
        )
      );
    
    if (!users.length) {
      return NextResponse.json({ 
        success: true, 
        message: 'Nenhum usuário com alertas de Comunicados habilitados' 
      });
    }
    
    console.log(`[StatusInvest] Encontrados ${users.length} usuários com alertas de Comunicados`);
    
    let totalAlertsSent = 0;
    const results: any[] = [];
    
    for (const user of users) {
      if (!user.whatsappNumber) continue;
      
      // Buscar FIIs do usuário (com join para obter ticker)
      const userFIIs = await db
        .select({ ticker: fiiFundTable.ticker })
        .from(userFiiFollowTable)
        .innerJoin(fiiFundTable, eq(userFiiFollowTable.fundId, fiiFundTable.id))
        .where(eq(userFiiFollowTable.userId, user.id));
      
      if (!userFIIs.length) {
        console.log(`[StatusInvest] Usuário ${user.id} não tem FIIs cadastrados`);
        continue;
      }
      
      const tickers = userFIIs.map(f => f.ticker);
      console.log(`[StatusInvest] Buscando comunicados para ${tickers.length} FIIs do usuário ${user.id}: ${tickers.join(', ')}`);
      
      // Buscar comunicados para cada FII
      const allComunicados: ComunicadoStatusInvest[] = [];
      
      for (const ticker of tickers) {
        const comunicados = await getComunicadosRecentes(ticker, diasBusca);
        // Filtrar apenas tipos relevantes
        const comunicadosRelevantes = filtrarComunicadosRelevantes(comunicados);
        allComunicados.push(...comunicadosRelevantes);
      }
      
      if (!allComunicados.length) {
        console.log(`[StatusInvest] Nenhum comunicado relevante para usuário ${user.id}`);
        continue;
      }
      
      // Filtrar alertas já enviados
      const alertKeys = allComunicados.map(c => `statusinvest-${c.fnetDocId}`);
      const sentAlerts = await db
        .select()
        .from(sentAlertTable)
        .where(inArray(sentAlertTable.alertKey, alertKeys));
      
      const sentKeys = new Set(sentAlerts.map(a => a.alertKey));
      const newComunicados = allComunicados.filter(c => !sentKeys.has(`statusinvest-${c.fnetDocId}`));
      
      if (!newComunicados.length) {
        console.log(`[StatusInvest] Todos comunicados já foram enviados para usuário ${user.id}`);
        continue;
      }
      
      console.log(`[StatusInvest] ${newComunicados.length} novos comunicados para usuário ${user.id}`);
      
      // Formatar mensagem
      const message = formatComunicadosForWhatsApp(newComunicados);
      
      // Enviar via WhatsApp
      try {
        await sendWhatsAppMessage(user.whatsappNumber, message);
        totalAlertsSent++;
        
        // Marcar como enviados
        for (const com of newComunicados) {
          await db.insert(sentAlertTable).values({
            alertKey: `statusinvest-${com.fnetDocId}`,
            alertType: 'status-invest-comunicado',
            userId: user.id,
            sentAt: new Date()
          }).onConflictDoNothing();
        }
        
        results.push({
          userId: user.id,
          phone: user.whatsappNumber.slice(-4),
          comunicados: newComunicados.length,
          status: 'sent'
        });
      } catch (error) {
        console.error(`[StatusInvest] Erro ao enviar para ${user.id}:`, error);
        results.push({
          userId: user.id,
          phone: user.whatsappNumber.slice(-4),
          status: 'error',
          error: error instanceof Error ? error.message : 'Erro desconhecido'
        });
      }
    }
    
    return NextResponse.json({
      success: true,
      totalAlertsSent,
      results
    });
    
  } catch (error) {
    console.error('[StatusInvest Cron] Erro:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const ticker = searchParams.get('ticker') || 'KNRI11';
    const dias = parseInt(searchParams.get('dias') || '7');
    
    console.log(`[StatusInvest] Testando busca para ${ticker} (últimos ${dias} dias)`);
    
    const comunicados = await getComunicadosRecentes(ticker, dias);
    
    return NextResponse.json({
      success: true,
      ticker,
      dias,
      total: comunicados.length,
      comunicados: comunicados.slice(0, 10),
      mensagemWhatsApp: formatComunicadosForWhatsApp(comunicados.slice(0, 5))
    });
    
  } catch (error) {
    console.error('[StatusInvest GET] Erro:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    );
  }
}
