import { and, eq, gte } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { db } from "@/db";
import { 
  fiiFundTable, 
  fiiReportTable,
  userFiiFollowTable, 
  userTable
} from "@/db/schema";
import { auth } from "@/lib/auth";
import { sendFiiReportToWhatsApp } from "@/lib/whatsapp-api";

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ticker = searchParams.get('ticker');
    const reportMonth = searchParams.get('month');
    
    if (!ticker || !reportMonth) {
      return NextResponse.json(
        { error: "Ticker e mês do relatório são obrigatórios" }, 
        { status: 400 }
      );
    }

    console.log(`Enviando notificações para ${ticker} - ${reportMonth}...`);
    
    // Buscar o fundo
    const fund = await db
      .select()
      .from(fiiFundTable)
      .where(eq(fiiFundTable.ticker, ticker.toUpperCase()))
      .limit(1);

    if (fund.length === 0) {
      return NextResponse.json({ error: "Fundo não encontrado" }, { status: 404 });
    }

    // Buscar o relatório específico
    const report = await db
      .select()
      .from(fiiReportTable)
      .where(
        and(
          eq(fiiReportTable.fundId, fund[0].id),
          eq(fiiReportTable.reportMonth, reportMonth)
        )
      )
      .limit(1);

    if (report.length === 0) {
      return NextResponse.json({ error: "Relatório não encontrado" }, { status: 404 });
    }

    // Buscar todos os usuários que seguem este fundo
    const followers = await db
      .select({
        userId: userFiiFollowTable.userId,
        notificationsEnabled: userFiiFollowTable.notificationsEnabled,
        userPhone: userTable.whatsappNumber,
        userVerified: userTable.whatsappVerified,
      })
      .from(userFiiFollowTable)
      .innerJoin(userTable, eq(userFiiFollowTable.userId, userTable.id))
      .where(
        and(
          eq(userFiiFollowTable.fundId, fund[0].id),
          eq(userFiiFollowTable.notificationsEnabled, true)
        )
      );

    console.log(`Encontrados ${followers.length} seguidores para ${ticker}`);

    const notifications = [];
    const errors = [];

    // Enviar notificações para cada seguidor
    for (const follower of followers) {
      try {
        // Verificar se o usuário tem WhatsApp verificado
        if (!follower.userVerified || !follower.userPhone) {
          console.log(`Usuário ${follower.userId} não tem WhatsApp verificado`);
          continue;
        }

        // Enviar mensagem
        const result = await sendFiiReportToWhatsApp(
          follower.userPhone,
          fund[0].ticker,
          fund[0].name,
          report[0].reportMonth,
          report[0].reportUrl || `https://relatoriosfiis.com.br/${ticker.toUpperCase()}`
        );

        notifications.push({
          userId: follower.userId,
          phone: follower.userPhone,
          status: 'sent',
          result
        });

        // Aguardar um pouco entre as mensagens para não sobrecarregar a API
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.error(`Erro ao enviar para usuário ${follower.userId}:`, error);
        errors.push({
          userId: follower.userId,
          phone: follower.userPhone,
          error: error instanceof Error ? error.message : 'Erro desconhecido'
        });
      }
    }

    return NextResponse.json({
      message: "Notificações enviadas",
      fund: {
        ticker: fund[0].ticker,
        name: fund[0].name,
      },
      report: {
        month: report[0].reportMonth,
        url: report[0].reportUrl,
      },
      stats: {
        totalFollowers: followers.length,
        notificationsSent: notifications.length,
        errors: errors.length,
      },
      notifications,
      errors,
    });

  } catch (error) {
    console.error("Erro ao enviar notificações:", error);
    return NextResponse.json(
      { error: "Erro ao enviar notificações" },
      { status: 500 }
    );
  }
}

// API para envio manual de notificação para um usuário específico
export async function PUT(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { fundId } = await request.json();

    if (!fundId) {
      return NextResponse.json(
        { error: "ID do fundo é obrigatório" },
        { status: 400 }
      );
    }

    // Buscar informações do fundo
    const fund = await db
      .select()
      .from(fiiFundTable)
      .where(eq(fiiFundTable.id, fundId))
      .limit(1);

    if (fund.length === 0) {
      return NextResponse.json({ error: "Fundo não encontrado" }, { status: 404 });
    }

    // Verificar se o usuário segue este fundo
    const followCheck = await db
      .select()
      .from(userFiiFollowTable)
      .where(
        and(
          eq(userFiiFollowTable.userId, session.user.id),
          eq(userFiiFollowTable.fundId, fundId)
        )
      )
      .limit(1);

    if (followCheck.length === 0) {
      return NextResponse.json(
        { error: "Você não segue este fundo" },
        { status: 403 }
      );
    }

    // Buscar o relatório mais recente usando a API de relatórios
    const reportResponse = await fetch(`${request.nextUrl.origin}/api/fii/reports?fundId=${fundId}`, {
      method: 'GET'
    });
    
    let latestReportData;
    if (reportResponse.ok) {
      latestReportData = await reportResponse.json();
    } else {
      // Fallback: buscar no banco de dados
      const latestReport = await db
        .select()
        .from(fiiReportTable)
        .where(eq(fiiReportTable.fundId, fundId))
        .orderBy(fiiReportTable.reportDate)
        .limit(1);

      if (latestReport.length === 0) {
        return NextResponse.json({ 
          error: "Nenhum relatório encontrado. Tente sincronizar os fundos primeiro." 
        }, { status: 404 });
      }
      
      latestReportData = {
        latestReport: latestReport[0],
        fund: fund[0]
      };
    }

    const reportToSend = latestReportData.latestReport;
    const fundInfo = latestReportData.fund;

    // Buscar informações do usuário
    const user = await db
      .select({
        phone: userTable.whatsappNumber,
        verified: userTable.whatsappVerified,
      })
      .from(userTable)
      .where(eq(userTable.id, session.user.id))
      .limit(1);

    if (user.length === 0) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    }

    if (!user[0].verified || !user[0].phone) {
      return NextResponse.json(
        { error: "Seu WhatsApp não está verificado. Vá para Configurações para verificar." },
        { status: 400 }
      );
    }

    // Enviar notificação com o relatório mais recente
    const result = await sendFiiReportToWhatsApp(
      user[0].phone,
      fundInfo.ticker,
      fundInfo.name,
      reportToSend.reportMonth,
      reportToSend.reportUrl || `https://relatoriosfiis.com.br/${fundInfo.ticker}`
    );

    return NextResponse.json({
      message: `Relatório mais recente enviado via WhatsApp (${reportToSend.reportMonth})`,
      fund: {
        ticker: fundInfo.ticker,
        name: fundInfo.name,
      },
      report: {
        month: reportToSend.reportMonth,
        date: reportToSend.reportDate,
        url: reportToSend.reportUrl,
      },
      user: {
        phone: user[0].phone,
      },
      result,
    });

  } catch (error) {
    console.error("Erro ao enviar notificação manual:", error);
    return NextResponse.json(
      { error: "Erro ao enviar notificação" },
      { status: 500 }
    );
  }
}