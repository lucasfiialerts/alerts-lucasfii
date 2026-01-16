import { NextRequest, NextResponse } from 'next/server';

import { fiiAlertService } from '@/lib/fii-alerts';

// Chave secreta para segurança (adicione no .env)
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || 'sua-chave-secreta';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    console.log('⏰ Webhook de FII alerts executado em:', new Date().toLocaleString('pt-BR'));
    
    // Verificar autorização básica
    const authHeader = request.headers.get('authorization');
    const providedSecret = request.headers.get('x-webhook-secret');
    
    if (providedSecret !== WEBHOOK_SECRET && !authHeader?.includes('Bearer')) {
      console.log('🔒 Acesso não autorizado ao webhook de FII');
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }
    
    // Verificar se é horário de pregão (9h-17h) - Fuso horário de São Paulo
    const now = new Date();
    const brazilTime = new Date(now.toLocaleString("en-US", {timeZone: "America/Sao_Paulo"}));
    const hour = brazilTime.getHours();
    const dayOfWeek = brazilTime.getDay(); // 0=domingo, 1=segunda, ..., 6=sábado
    
    // Segunda a Sexta (1-5) e das 9h às 17h (horário de Brasília)
    const isMarketHours = dayOfWeek >= 1 && dayOfWeek <= 5 && hour >= 9 && hour <= 17;
    
    if (!isMarketHours) {
      console.log(`⏰ Fora do horário de pregão: ${hour}h (horário de Brasília), dia da semana: ${dayOfWeek}`);
      return NextResponse.json({
        success: true,
        message: 'Fora do horário de pregão',
        timestamp: now.toISOString(),
        brazilTime: brazilTime.toLocaleString('pt-BR'),
        marketHours: false
      });
    }

    // Processar alertas
    let alerts;
    try {
      alerts = await fiiAlertService.processAllAlerts();
    } catch (error) {
      console.error('❌ Erro ao processar alertas (possivelmente BRAPI):', error);
      
      // Se for erro da BRAPI, retornar sucesso mas sem alertas
      if (error instanceof Error && error.message.includes('BRAPI')) {
        return NextResponse.json({
          success: true,
          message: 'Erro temporário na BRAPI - tentando novamente no próximo ciclo',
          alertsSent: 0,
          timestamp: now.toISOString(),
          marketHours: true,
          brapiError: true
        });
      }
      
      // Para outros erros, retornar 500
      return NextResponse.json(
        { 
          success: false, 
          error: error instanceof Error ? error.message : 'Erro desconhecido',
          timestamp: now.toISOString()
        },
        { status: 500 }
      );
    }
    
    if (alerts.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Nenhum alerta para enviar no momento',
        alertsSent: 0,
        timestamp: now.toISOString(),
        marketHours: true
      });
    }

    const results = [];
    let successCount = 0;
    let failureCount = 0;

    // Enviar cada alerta via WhatsApp
    for (const alert of alerts) {
      try {
        // Buscar dados do usuário
        const userResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/user/${alert.userId}/whatsapp-data`);
        
        if (!userResponse.ok) {
          console.log(`⚠️ Usuário ${alert.userId} não encontrado ou sem WhatsApp`);
          failureCount++;
          continue;
        }

        const userData = await userResponse.json();
        
        if (!userData.whatsappNumber || !userData.whatsappVerified) {
          console.log(`⚠️ Usuário ${alert.userId} sem WhatsApp verificado`);
          failureCount++;
          continue;
        }

        // Enviar via WhatsApp
        const whatsappResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/whatsapp/send-alert`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phoneNumber: userData.whatsappNumber,
            message: alert.message,
            userId: alert.userId,
            ticker: alert.ticker,
          }),
        });

        if (whatsappResponse.ok) {
          await fiiAlertService.logAlert(alert);
          console.log(`✅ Alerta enviado: ${alert.ticker} para usuário ${alert.userId.substring(0, 8)}...`);
          successCount++;
          
          results.push({
            ticker: alert.ticker,
            userId: alert.userId.substring(0, 8) + '...',
            status: 'success'
          });
        } else {
          console.log(`❌ Falha ao enviar: ${alert.ticker}`);
          failureCount++;
          
          results.push({
            ticker: alert.ticker,
            userId: alert.userId.substring(0, 8) + '...',
            status: 'error'
          });
        }

        // Delay reduzido para evitar timeout do EasyCron
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (error) {
        console.error(`❌ Erro no alerta ${alert.ticker}:`, error);
        failureCount++;
      }
    }

    const executionTime = Date.now() - startTime;
    console.log(`📊 Webhook concluído em ${executionTime}ms: ${successCount} enviados, ${failureCount} falharam`);

    return NextResponse.json({
      success: true,
      message: `Webhook executado: ${successCount} enviados, ${failureCount} falharam`,
      alertsGenerated: alerts.length,
      alertsSent: successCount,
      alertsFailed: failureCount,
      marketHours: true,
      timestamp: now.toISOString(),
      executionTimeMs: executionTime,
      results
    });

  } catch (error) {
    const executionTime = Date.now() - startTime;
    console.error(`❌ Erro no webhook de FII após ${executionTime}ms:`, error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        timestamp: new Date().toISOString(),
        executionTimeMs: executionTime
      },
      { status: 500 }
    );
  }
}

// Endpoint GET para verificação de saúde
export async function GET() {
  const now = new Date();
  const brazilTime = new Date(now.toLocaleString("en-US", {timeZone: "America/Sao_Paulo"}));
  const hour = brazilTime.getHours();
  const dayOfWeek = brazilTime.getDay();
  const isMarketHours = dayOfWeek >= 1 && dayOfWeek <= 5 && hour >= 9 && hour <= 17;
  
  return NextResponse.json({
    status: 'healthy',
    service: 'FII Alerts Webhook',
    timestamp: now.toISOString(),
    brazilTime: brazilTime.toLocaleString('pt-BR'),
    marketHours: isMarketHours,
    nextExecution: 'A cada 10 minutos durante horário de pregão'
  });
}