import { NextResponse } from 'next/server';

import { fiiAlertService } from '@/lib/fii-alerts';

export async function POST() {
  try {
    console.log('🚀 Iniciando envio de alertas de FIIs...');
    
    // Processar todos os alertas
    const alerts = await fiiAlertService.processAllAlerts();
    
    if (alerts.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Nenhum alerta para enviar no momento',
        alertsSent: 0
      });
    }

    const results = [];
    let successCount = 0;
    let failureCount = 0;

    // Enviar cada alerta via WhatsApp
    for (const alert of alerts) {
      try {
        // Buscar dados do usuário para obter WhatsApp
        const userResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/user/${alert.userId}/whatsapp-data`, {
          method: 'GET',
        });

        if (!userResponse.ok) {
          console.log(`⚠️ Usuário ${alert.userId} não encontrado ou sem WhatsApp configurado`);
          failureCount++;
          continue;
        }

        const userData = await userResponse.json();
        
        if (!userData.whatsappNumber || !userData.whatsappVerified) {
          console.log(`⚠️ Usuário ${alert.userId} não tem WhatsApp verificado`);
          failureCount++;
          continue;
        }

        // Enviar mensagem via WhatsApp
        const whatsappResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/whatsapp/send-alert`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            phoneNumber: userData.whatsappNumber,
            message: alert.message,
            userId: alert.userId,
            ticker: alert.ticker,
          }),
        });

        if (whatsappResponse.ok) {
          // Registrar que o alerta foi enviado
          await fiiAlertService.logAlert(alert);
          
          console.log(`✅ Alerta enviado para usuário ${alert.userId}: ${alert.ticker}`);
          successCount++;
          
          results.push({
            userId: alert.userId,
            ticker: alert.ticker,
            status: 'success',
            message: 'Alerta enviado com sucesso'
          });
        } else {
          console.log(`❌ Falha ao enviar alerta para usuário ${alert.userId}: ${alert.ticker}`);
          failureCount++;
          
          results.push({
            userId: alert.userId,
            ticker: alert.ticker,
            status: 'error',
            message: 'Falha ao enviar WhatsApp'
          });
        }

        // Delay entre envios para evitar spam
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.error(`❌ Erro ao processar alerta para usuário ${alert.userId}:`, error);
        failureCount++;
        
        results.push({
          userId: alert.userId,
          ticker: alert.ticker,
          status: 'error',
          message: error instanceof Error ? error.message : 'Erro desconhecido'
        });
      }
    }

    console.log(`📊 Resumo dos alertas: ${successCount} enviados, ${failureCount} falharam`);

    return NextResponse.json({
      success: true,
      message: `Alertas processados: ${successCount} enviados, ${failureCount} falharam`,
      alertsGenerated: alerts.length,
      alertsSent: successCount,
      alertsFailed: failureCount,
      results
    });

  } catch (error) {
    console.error('❌ Erro ao processar alertas:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido ao processar alertas' 
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    console.log('📊 Verificando alertas pendentes...');
    
    // Apenas processar e retornar os alertas sem enviar
    const alerts = await fiiAlertService.processAllAlerts();
    
    return NextResponse.json({
      success: true,
      alertsFound: alerts.length,
      alerts: alerts.map(alert => ({
        ticker: alert.ticker,
        name: alert.name,
        variation: alert.variation,
        price: alert.price,
        userId: alert.userId.substring(0, 8) + '...' // Ofuscar ID do usuário
      }))
    });

  } catch (error) {
    console.error('❌ Erro ao verificar alertas:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido ao verificar alertas' 
      },
      { status: 500 }
    );
  }
}