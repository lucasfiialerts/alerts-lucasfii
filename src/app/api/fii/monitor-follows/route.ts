import { and, desc, eq, gt } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/db';
import { fiiFundTable, fiiReportTable, userFiiFollowTable, userTable } from '@/db/schema';

/**
 * API de Monitoramento Automático de FIIs Seguidos
 * 
 * POST /api/fii/monitor-follows
 * 
 * Verifica se há novos relatórios para os FIIs seguidos pelos usuários
 * e dispara notificações automáticas
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      checkLastHours = 24,
      maxFundsToCheck = 50,
      sendNotifications = true,
      testMode = false 
    } = body;

    console.log(`🔍 Iniciando monitoramento de FIIs seguidos...`);
    console.log(`⏰ Verificando últimas ${checkLastHours} horas`);

    // 1. Buscar todos os usuários que seguem FIIs com notificações ativas
    const usersWithFollows = await db
      .select({
        userId: userFiiFollowTable.userId,
        userPhone: userTable.whatsappNumber,
        userWhatsappVerified: userTable.whatsappVerified,
        alertPreferencesReports: userTable.alertPreferencesReports, // ADICIONAR: Preferência de relatórios
        fundId: fiiFundTable.id,
        ticker: fiiFundTable.ticker,
        fundName: fiiFundTable.name,
        notifications: userFiiFollowTable.notificationsEnabled,
        followedAt: userFiiFollowTable.createdAt
      })
      .from(userFiiFollowTable)
      .innerJoin(fiiFundTable, eq(userFiiFollowTable.fundId, fiiFundTable.id))
      .leftJoin(userTable, eq(userFiiFollowTable.userId, userTable.id))
      .where(
        and(
          eq(userFiiFollowTable.notificationsEnabled, true),
          eq(userTable.alertPreferencesReports, true) // ADICIONAR: Filtrar apenas usuários com relatórios ativos
        )
      )
      .limit(maxFundsToCheck);

    console.log(`👥 Encontrados ${usersWithFollows.length} follows com notificações ativas e "Relatórios e Eventos" habilitado`);

    if (usersWithFollows.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Nenhum usuário seguindo FIIs com notificações ativas e "Relatórios e Eventos" habilitado',
        data: { checked: 0, notifications: 0 }
      }, { status: 200 });
    }

    // 2. Agrupar por ticker para verificar novos relatórios
    const tickersToCheck = [...new Set(usersWithFollows.map(u => u.ticker))];
    console.log(`📊 Verificando ${tickersToCheck.length} tickers únicos: ${tickersToCheck.slice(0, 5).join(', ')}...`);

    // 3. Buscar novos relatórios do Investidor10 para cada ticker
    const newReports = [];
    
    for (const ticker of tickersToCheck) {
      try {
        console.log(`🔍 Verificando ${ticker} no Investidor10...`);
        
        // Chamar o script do Investidor10 via API interna
        const investidor10Response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/fii/investidor10-check`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ticker: ticker })
        });
        
        if (investidor10Response.ok) {
          const investidor10Data = await investidor10Response.json();
          
          if (investidor10Data.hasNewReport) {
            const reportData = investidor10Data.report;
            
            // Verificar se já temos esse relatório no banco (usando chave única: ticker + tipo + data)
            const reportKey = `${ticker}_${reportData.tipo}_${reportData.data}`;
            
            const existingReport = await db
              .select()
              .from(fiiReportTable)
              .innerJoin(fiiFundTable, eq(fiiReportTable.fundId, fiiFundTable.id))
              .where(
                and(
                  eq(fiiFundTable.ticker, ticker),
                  eq(fiiReportTable.reportMonth, reportKey) // Usar reportMonth como chave única
                )
              )
              .limit(1);

            // Se não existe, é um novo relatório
            if (existingReport.length === 0) {
              console.log(`🆕 NOVO RELATÓRIO: ${ticker} - ${reportData.tipo} - ${reportData.data}`);
              
              newReports.push({
                ticker: ticker,
                fundName: reportData.fundName || ticker,
                reportDate: reportData.data,
                reportType: reportData.tipo,
                pdfUrl: reportData.linkPDF,
                extractedText: reportData.textoExtraido,
                reportKey: reportKey
              });

              // Salvar o novo relatório no banco
              try {
                const fund = await db
                  .select()
                  .from(fiiFundTable)
                  .where(eq(fiiFundTable.ticker, ticker))
                  .limit(1);

                if (fund.length > 0) {
                  // Converter data brasileira (dd/mm/yyyy) para ISO
                  let reportDate = new Date();
                  if (reportData.data) {
                    const [day, month, year] = reportData.data.split('/');
                    reportDate = new Date(`${year}-${month}-${day}`);
                  }
                  
                  await db.insert(fiiReportTable).values({
                    fundId: fund[0].id,
                    reportDate: reportDate,
                    reportMonth: reportKey, // Chave única
                    reportUrl: reportData.linkPDF,
                    downloadUrl: reportData.linkPDF
                  });
                }
              } catch (dbError) {
                console.warn(`Erro ao salvar relatório ${ticker}:`, dbError);
              }
            } else {
              console.log(`✅ ${ticker}: Relatório já conhecido`);
            }
          } else {
            console.log(`📭 ${ticker}: Nenhum relatório novo encontrado`);
          }
        }
        
        // Pausa para não sobrecarregar
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error) {
        console.error(`❌ Erro verificando ${ticker}:`, error);
      }
    }

    console.log(`📋 Total de novos relatórios encontrados: ${newReports.length}`);

    // 4. Enviar notificações para usuários que seguem os fundos com novos relatórios
    const notificationResults = [];
    
    if (sendNotifications && newReports.length > 0) {
      console.log('📱 Enviando notificações...');
      
      for (const report of newReports) {
        // Buscar usuários que seguem este ticker e têm "Relatórios e Eventos" ativo
        const followers = usersWithFollows.filter(u => 
          u.ticker === report.ticker && 
          u.userWhatsappVerified && 
          u.userPhone &&
          u.alertPreferencesReports // ADICIONAR: Verificar se tem preferência de relatórios ativa
        );
        
        console.log(`📱 ${report.ticker}: ${followers.length} seguidores com "Relatórios e Eventos" ativo para notificar`);
        
        for (const follower of followers) {
          try {
            if (!testMode) {
              // Criar mensagem apenas com link do documento (SEM IA, SEM texto extraído)
              const mensagemWhatsApp = `*📊 ${report.reportType} - ${report.ticker}*\n` +
                                       `📅 Data: ${report.reportDate}\n\n` +
                                       `🔗 *Link do documento:*\n${report.pdfUrl}`;
              
              // Enviar via WhatsApp API
              const whatsappResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/whatsapp/send`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  phone: follower.userPhone,
                  message: mensagemWhatsApp
                })
              });
              
              if (whatsappResponse.ok) {
                console.log(`✅ Notificação enviada: ${follower.userPhone} sobre ${report.ticker}`);
                notificationResults.push({
                  ticker: report.ticker,
                  userPhone: follower.userPhone,
                  status: 'sent'
                });
              } else {
                console.warn(`⚠️ Falha na notificação: ${follower.userPhone} sobre ${report.ticker}`);
                notificationResults.push({
                  ticker: report.ticker,
                  userPhone: follower.userPhone,
                  status: 'failed'
                });
              }
            } else {
              // Modo teste - não envia realmente
              notificationResults.push({
                ticker: report.ticker,
                userPhone: follower.userPhone,
                status: 'test_mode'
              });
            }
            
            // Pausa entre notificações
            await new Promise(resolve => setTimeout(resolve, 2000));
            
          } catch (notError) {
            console.error(`❌ Erro enviando notificação:`, notError);
            notificationResults.push({
              ticker: report.ticker,
              userPhone: follower.userPhone,
              status: 'error',
              error: notError instanceof Error ? notError.message : 'Erro desconhecido'
            });
          }
        }
      }
    }

    // 5. Resultados finais
    const totalNotificationsSent = notificationResults.filter(n => n.status === 'sent').length;
    const totalNotificationsFailed = notificationResults.filter(n => n.status === 'failed').length;

    console.log('🎊 MONITORAMENTO CONCLUÍDO:');
    console.log(`📊 Tickers verificados: ${tickersToCheck.length}`);
    console.log(`📋 Novos relatórios: ${newReports.length}`);
    console.log(`📱 Notificações enviadas: ${totalNotificationsSent}`);
    console.log(`❌ Falhas: ${totalNotificationsFailed}`);

    return NextResponse.json({
      success: true,
      message: 'Monitoramento concluído',
      data: {
        monitoring: {
          tickersChecked: tickersToCheck.length,
          usersWithFollows: usersWithFollows.length,
          newReportsFound: newReports.length,
          checkLastHours: checkLastHours
        },
        newReports: newReports,
        notifications: {
          sent: totalNotificationsSent,
          failed: totalNotificationsFailed,
          testMode: testMode,
          results: notificationResults
        }
      }
    }, { status: 200 });

  } catch (error) {
    console.error('❌ Erro no monitoramento:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Falha no monitoramento automático',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}

/**
 * GET /api/fii/monitor-follows - Status do monitoramento
 */
export async function GET() {
  try {
    // Buscar estatísticas rápidas
    const totalFollows = await db
      .select()
      .from(userFiiFollowTable)
      .where(eq(userFiiFollowTable.notificationsEnabled, true));

    return NextResponse.json({
      service: 'FII Automatic Monitoring',
      status: 'active',
      statistics: {
        activeFollows: totalFollows.length,
        lastCheck: 'Manual trigger only',
        nextCheck: 'On demand'
      },
      features: {
        newReportDetection: true,
        automaticNotifications: true,
        whatsappIntegration: true,
        aiSummaries: true
      },
      usage: {
        trigger: 'POST /api/fii/monitor-follows',
        scheduling: 'Implement cron job to call this endpoint',
        testMode: 'Use testMode: true para não enviar WhatsApp real'
      }
    }, { status: 200 });

  } catch (error) {
    return NextResponse.json({
      service: 'FII Automatic Monitoring',
      status: 'error',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}
