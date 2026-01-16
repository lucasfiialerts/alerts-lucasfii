import { and,eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/db';
import { fiiFundTable, fiiReportTable,userFiiFollowTable, userTable } from '@/db/schema';

/**
 * API para enviar alertas automaticamente para TODOS os usuários
 * 
 * POST /api/fii/send-all-alerts
 * 
 * Envia alertas dos relatórios mais recentes para todos os usuários seguindo FIIs
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Iniciando envio de alertas para TODOS os usuários...');
    
    // 1. Buscar todos os FIIs que têm seguidores com WhatsApp verificado
    const activeFollows = await db
      .select({
        fundId: fiiFundTable.id,
        ticker: fiiFundTable.ticker,
        fundName: fiiFundTable.name,
        userId: userTable.id,
        userPhone: userTable.whatsappNumber,
        userVerified: userTable.whatsappVerified
      })
      .from(userFiiFollowTable)
      .innerJoin(fiiFundTable, eq(userFiiFollowTable.fundId, fiiFundTable.id))
      .innerJoin(userTable, eq(userFiiFollowTable.userId, userTable.id))
      .where(eq(userTable.whatsappVerified, true));

    if (activeFollows.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Nenhum usuário com WhatsApp verificado seguindo FIIs'
      });
    }

    console.log(`👥 Encontrados ${activeFollows.length} follows ativos com WhatsApp`);

    // 2. Agrupar por FII para evitar duplicação
    const fiiMap = new Map<string, {
      ticker: string,
      fundName: string,
      fundId: string,
      followers: Array<{userId: string, userPhone: string}>
    }>();

    activeFollows.forEach(follow => {
      if (!follow.userPhone) return; // Skip se não tem telefone
      
      if (!fiiMap.has(follow.ticker)) {
        fiiMap.set(follow.ticker, {
          ticker: follow.ticker,
          fundName: follow.fundName,
          fundId: follow.fundId,
          followers: []
        });
      }
      
      fiiMap.get(follow.ticker)?.followers.push({
        userId: follow.userId,
        userPhone: follow.userPhone
      });
    });

    console.log(`📊 ${fiiMap.size} FIIs únicos encontrados para notificação`);

    const results = [];
    const errors = [];

    // 3. Para cada FII, buscar relatório mais recente e enviar para todos os seguidores
    for (const [ticker, fiiData] of fiiMap) {
      try {
        console.log(`\n🔍 Processando ${ticker} (${fiiData.followers.length} seguidores)...`);

        // Buscar relatório mais recente do banco de dados
        const latestReport = await db
          .select()
          .from(fiiReportTable)
          .where(eq(fiiReportTable.fundId, fiiData.fundId))
          .orderBy(fiiReportTable.reportDate)
          .limit(1);

        if (latestReport.length === 0) {
          console.log(`⚠️ Nenhum relatório encontrado para ${ticker}`);
          errors.push({
            ticker,
            error: 'Nenhum relatório encontrado',
            followers: fiiData.followers.length
          });
          continue;
        }

        const report = latestReport[0];
        console.log(`📄 Relatório encontrado: ${report.reportMonth} - ${report.reportUrl}`);

        // Enviar para todos os seguidores deste FII
        const sentResults = [];
        
        for (const follower of fiiData.followers) {
          try {
            const reportUrl = report.reportUrl || `https://fnet.bmfbovespa.com.br/fnet/publico/downloadDocumento?id=1011029`;
            const whatsappMessage = formatWhatsAppMessage(ticker, reportUrl, report.reportMonth);
            
            const whatsappResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/send-whatsapp`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                phoneNumber: follower.userPhone,
                message: whatsappMessage
              })
            });

            if (whatsappResponse.ok) {
              console.log(`✅ WhatsApp enviado para ${follower.userPhone} (${ticker})`);
              sentResults.push({
                phone: follower.userPhone,
                status: 'success'
              });
            } else {
              console.warn(`❌ Falha no WhatsApp para ${follower.userPhone} (${ticker})`);
              sentResults.push({
                phone: follower.userPhone,
                status: 'failed',
                error: `HTTP ${whatsappResponse.status}`
              });
            }

            // Aguardar entre envios para não sobrecarregar a API
            await new Promise(resolve => setTimeout(resolve, 500));

          } catch (whatsappError) {
            console.error(`❌ Erro no WhatsApp para ${follower.userPhone} (${ticker}):`, whatsappError);
            sentResults.push({
              phone: follower.userPhone,
              status: 'error',
              error: whatsappError instanceof Error ? whatsappError.message : 'Erro desconhecido'
            });
          }
        }

        results.push({
          ticker,
          fundName: fiiData.fundName,
          reportMonth: report.reportMonth,
          reportUrl: report.reportUrl,
          followersCount: fiiData.followers.length,
          messagesSent: sentResults.filter(r => r.status === 'success').length,
          sentResults
        });

        console.log(`📊 ${ticker}: ${sentResults.filter(r => r.status === 'success').length}/${fiiData.followers.length} mensagens enviadas`);

      } catch (error) {
        console.error(`❌ Erro ao processar ${ticker}:`, error);
        errors.push({
          ticker,
          error: error instanceof Error ? error.message : 'Erro desconhecido',
          followers: fiiData.followers.length
        });
      }
    }

    const totalSent = results.reduce((acc, r) => acc + r.messagesSent, 0);
    const totalFollowers = results.reduce((acc, r) => acc + r.followersCount, 0);

    console.log(`\n🎉 Envio concluído: ${totalSent}/${totalFollowers} mensagens enviadas com sucesso`);

    return NextResponse.json({
      success: true,
      message: `Alertas enviados para todos os usuários`,
      stats: {
        totalFiiProcessed: fiiMap.size,
        totalFollowers: totalFollowers,
        totalMessagesSent: totalSent,
        totalErrors: errors.length
      },
      results,
      errors
    }, { status: 200 });

  } catch (error) {
    console.error('❌ Erro no envio de alertas em massa:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Erro no envio de alertas em massa',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}

/**
 * Formatar mensagem WhatsApp específica por FII
 */
function formatWhatsAppMessage(ticker: string, pdfUrl: string, reportDate?: string): string {
  const date = reportDate || new Date().toLocaleDateString('pt-BR');
  
  const message = `🔔 *Novo Relatório ${ticker}*

📅 ${date}

📄 Relatório completo: ${pdfUrl}

📱 Configure seus alertas em: lucasfiialerts.com`;

  return message;
}

/**
 * GET - Status do sistema de alertas em massa
 */
export async function GET() {
  try {
    // Buscar estatísticas dos follows ativos
    const activeFollows = await db
      .select({
        ticker: fiiFundTable.ticker,
        fundName: fiiFundTable.name,
        userPhone: userTable.whatsappNumber,
        userVerified: userTable.whatsappVerified
      })
      .from(userFiiFollowTable)
      .innerJoin(fiiFundTable, eq(userFiiFollowTable.fundId, fiiFundTable.id))
      .innerJoin(userTable, eq(userFiiFollowTable.userId, userTable.id))
      .where(eq(userTable.whatsappVerified, true));

    // Agrupar por FII
    const fiiStats = activeFollows.reduce((acc, follow) => {
      if (!acc[follow.ticker]) {
        acc[follow.ticker] = {
          ticker: follow.ticker,
          fundName: follow.fundName,
          followers: 0
        };
      }
      acc[follow.ticker].followers++;
      return acc;
    }, {} as Record<string, any>);

    return NextResponse.json({
      service: 'Send All Alerts',
      status: 'active',
      stats: {
        totalActiveFollows: activeFollows.length,
        uniqueFiis: Object.keys(fiiStats).length,
        fiiBreakdown: Object.values(fiiStats)
      },
      usage: {
        endpoint: 'POST /api/fii/send-all-alerts',
        description: 'Envia alertas dos relatórios mais recentes para TODOS os usuários seguindo FIIs'
      }
    }, { status: 200 });

  } catch (error) {
    return NextResponse.json({
      service: 'Send All Alerts',
      status: 'error',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}