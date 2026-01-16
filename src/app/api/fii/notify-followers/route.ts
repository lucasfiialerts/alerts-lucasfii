import { and,eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/db';
import { fiiFundTable, userFiiFollowTable, userTable } from '@/db/schema';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      ticker, 
      pdfUrl, 
      reportDate,
      testMode = false
    } = body;

    console.log(`📱 Iniciando notificação WhatsApp para ${ticker}...`);
    console.log(`🔍 DEBUG: Buscando usuários com alertPreferencesReports = true`);

    if (!ticker || !pdfUrl) {
      return NextResponse.json({
        success: false,
        error: 'Ticker e PDF URL são obrigatórios'
      }, { status: 400 });
    }

    const followers = await db
      .select({
        userId: userTable.id,
        userPhone: userTable.whatsappNumber,
        userWhatsappVerified: userTable.whatsappVerified,
        alertPreferencesReports: userTable.alertPreferencesReports, // ADICIONAR: Buscar preferência de relatórios
        ticker: fiiFundTable.ticker,
        fundName: fiiFundTable.name,
        followedAt: userFiiFollowTable.createdAt
      })
      .from(userFiiFollowTable)
      .innerJoin(fiiFundTable, eq(userFiiFollowTable.fundId, fiiFundTable.id))
      .innerJoin(userTable, eq(userFiiFollowTable.userId, userTable.id))
      .where(
        and(
          eq(fiiFundTable.ticker, ticker),
          eq(userTable.whatsappVerified, true),
          eq(userTable.alertPreferencesReports, true) // ADICIONAR: Filtrar apenas usuários com relatórios ativos
        )
      );

    console.log(`🔍 DEBUG: Query encontrou ${followers.length} usuários`);
    
    // DEBUG: Mostrar dados dos usuários encontrados
    const debugData: any[] = [];
    followers.forEach(follower => {
      console.log(`🔍 DEBUG: Usuário ${follower.userId} - alertPreferencesReports: ${follower.alertPreferencesReports}`);
      debugData.push({
        userId: follower.userId,
        alertPreferencesReports: follower.alertPreferencesReports,
        userPhone: follower.userPhone
      });
    });

    if (followers.length === 0) {
      return NextResponse.json({
        success: true,
        message: `Nenhum usuário seguindo ${ticker} com WhatsApp verificado e "Relatórios e Eventos" ativo`,
        debug: { query: 'No users found', debugData }
      });
    }

    console.log(`📊 Encontrados ${followers.length} seguidores para ${ticker} com "Relatórios e Eventos" ativo`);

    const whatsappMessage = formatWhatsAppMessage(ticker, pdfUrl, reportDate);

    console.log('💬 Mensagem formatada:', whatsappMessage.substring(0, 200) + '...');

    const sentResults = [];
    
    for (const follower of followers) {
      if (!testMode && follower.userPhone) {
        try {
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
            console.log(`✅ WhatsApp enviado para ${follower.userPhone}`);
            sentResults.push({
              phone: follower.userPhone,
              status: 'success'
            });
          } else {
            console.warn(`❌ Falha no envio WhatsApp para ${follower.userPhone}:`, whatsappResponse.status);
            sentResults.push({
              phone: follower.userPhone,
              status: 'failed',
              error: `HTTP ${whatsappResponse.status}`
            });
          }

        } catch (whatsappError) {
          console.error(`❌ Erro no WhatsApp para ${follower.userPhone}:`, whatsappError);
          sentResults.push({
            phone: follower.userPhone,
            status: 'error',
            error: whatsappError instanceof Error ? whatsappError.message : 'Erro desconhecido'
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        ticker: ticker,
        reportDate: reportDate,
        followersFound: followers.length,
        messagesSent: sentResults.length,
        message: whatsappMessage,
        pdfUrl: pdfUrl,
        sentResults: sentResults,
        testMode: testMode
      }
    }, { status: 200 });

  } catch (error) {
    console.error('❌ Erro na notificação:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Falha ao processar notificação',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}

function formatWhatsAppMessage(ticker: string, pdfUrl: string, reportDate?: string): string {
  const date = reportDate || new Date().toLocaleDateString('pt-BR');
  
  const message = `🔔 *Novo Relatório ${ticker}*

�� ${date}

📄 Relatório completo: ${pdfUrl}

📱 Configure seus alertas em: lucasfiialerts.com`;

  return message;
}

export async function GET() {
  try {
    return NextResponse.json({
      service: 'FII WhatsApp Notifications',
      status: 'active',
      features: {
        simpleNotifications: true,
        whatsappIntegration: true,
        directPDFLinks: true
      }
    }, { status: 200 });

  } catch (error) {
    return NextResponse.json({
      service: 'FII WhatsApp Notifications',
      status: 'error',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}
