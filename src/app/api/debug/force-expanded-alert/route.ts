import { NextRequest, NextResponse } from 'next/server';
import { fiiAlertService } from '@/lib/fii-alerts';

/**
 * Endpoint para forçar um alerta de teste com informações expandidas
 */
export async function POST(request: NextRequest) {
  try {
    const { ticker } = await request.json();
    const targetTicker = ticker || 'GGRC11';
    
    console.log(`🧪 Forçando alerta de teste expandido para ${targetTicker}...`);
    
    // Buscar dados estendidos
    const extendedData = await fiiAlertService.getExtendedFiiData(targetTicker);
    
    if (!extendedData) {
      return NextResponse.json({
        success: false,
        error: `Dados não encontrados para ${targetTicker}`
      }, { status: 404 });
    }
    
    // Simular envio de alerta expandido
    const message = fiiAlertService.createAlertMessage(
      targetTicker,
      extendedData.shortName || extendedData.longName,
      extendedData,
      extendedData
    );
    
    // Simular envio via WhatsApp (pode ser usado para teste real)
    const simulateWhatsApp = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/whatsapp/send-alert`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phoneNumber: '+5511999999999', // Número de teste
        message: message,
        userId: 'test-user',
        ticker: targetTicker,
      }),
    });

    const whatsappResult = await simulateWhatsApp.json();
    
    return NextResponse.json({
      success: true,
      message: 'Alerta de teste expandido criado',
      ticker: targetTicker,
      alertMessage: message,
      whatsappSimulation: whatsappResult,
      extendedData: {
        patrimonioLiquido: extendedData.patrimonioLiquido,
        valorPatrimonial: extendedData.valorPatrimonial,
        competencia: extendedData.competenciaReavaliacao,
        variacaoReavaliacao: extendedData.variacaoReavaliacao
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Erro ao criar alerta de teste:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}