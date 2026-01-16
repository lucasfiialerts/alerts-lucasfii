import { NextRequest, NextResponse } from 'next/server';

// Chave secreta para segurança (use a mesma do outro endpoint)
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || 'sua-chave-secreta';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    console.log('📄 Webhook de FII Reports executado em:', new Date().toLocaleString('pt-BR'));
    
    // Verificar autorização básica (mesmo padrão do outro endpoint)
    const authHeader = request.headers.get('authorization');
    const providedSecret = request.headers.get('x-webhook-secret');
    
    // Permitir acesso se tiver o secret correto OU se for desenvolvimento local
    const isAuthorized = providedSecret === WEBHOOK_SECRET || 
                        authHeader?.includes('Bearer') ||
                        process.env.NODE_ENV === 'development';
    
    if (!isAuthorized) {
      console.log('🔒 Acesso não autorizado ao webhook de FII Reports');
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }
    
    console.log('🔍 Iniciando monitoramento de relatórios FII...');

    // Chamar a API de monitoramento que já existe
    const monitorResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/fii/monitor-follows`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        checkLastHours: 24, // Verificar últimas 24 horas
        maxFundsToCheck: 100, // Verificar até 100 fundos
        sendNotifications: true, // Enviar notificações reais
        testMode: false
      })
    });

    if (!monitorResponse.ok) {
      throw new Error(`Erro no monitoramento: ${monitorResponse.status}`);
    }

    const monitorResult = await monitorResponse.json();
    const executionTime = Date.now() - startTime;

    console.log(`📊 Webhook de relatórios concluído em ${executionTime}ms`);
    console.log(`📋 Novos relatórios: ${monitorResult.data?.newReports?.length || 0}`);
    console.log(`📱 Notificações enviadas: ${monitorResult.data?.notifications?.sent || 0}`);

    return NextResponse.json({
      success: true,
      message: 'Webhook de relatórios executado com sucesso',
      data: {
        reportsChecked: monitorResult.data?.monitoring?.tickersChecked || 0,
        newReportsFound: monitorResult.data?.newReports?.length || 0,
        notificationsSent: monitorResult.data?.notifications?.sent || 0,
        notificationsFailed: monitorResult.data?.notifications?.failed || 0,
        usersWithFollows: monitorResult.data?.monitoring?.usersWithFollows || 0
      },
      timestamp: new Date().toISOString(),
      executionTimeMs: executionTime,
      monitorResult: monitorResult
    });

  } catch (error) {
    const executionTime = Date.now() - startTime;
    console.error(`❌ Erro no webhook de relatórios após ${executionTime}ms:`, error);
    
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
  return NextResponse.json({
    status: 'healthy',
    service: 'FII Reports Webhook',
    timestamp: new Date().toISOString(),
    description: 'Monitora novos relatórios FII e envia para usuários com "Relatórios e Eventos" ativo',
    nextExecution: 'A cada 6 horas (recomendado: 6h, 12h, 18h, 24h)'
  });
}