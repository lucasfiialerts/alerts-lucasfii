import { NextRequest, NextResponse } from 'next/server';
import { brapiService } from '@/lib/brapi';

/**
 * Endpoint para testar a conexão com a BRAPI e validar melhorias
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    console.log('🧪 Testando conexão com BRAPI...');
    
    // Testar com alguns FIIs populares
    const testTickers = ['KNIP11', 'VTLT11', 'SAPI11'];
    
    const result = await brapiService.getFiiData(testTickers);
    
    const executionTime = Date.now() - startTime;
    
    return NextResponse.json({
      success: true,
      message: 'BRAPI funcionando corretamente',
      tickersTested: testTickers,
      resultCount: result.length,
      executionTimeMs: executionTime,
      timestamp: new Date().toISOString(),
      data: result.map(item => ({
        ticker: item.symbol,
        price: item.regularMarketPrice,
        variation: item.regularMarketChangePercent
      }))
    });
    
  } catch (error) {
    const executionTime = Date.now() - startTime;
    
    console.error('❌ Erro no teste da BRAPI:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      executionTimeMs: executionTime,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

/**
 * Endpoint para testar o processamento de alertas sem enviar
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    console.log('🧪 Testando processamento de alertas...');
    
    const { fiiAlertService } = await import('@/lib/fii-alerts');
    
    // Processar alertas sem enviar (modo dry-run)
    const alerts = await fiiAlertService.processAllAlerts();
    
    const executionTime = Date.now() - startTime;
    
    return NextResponse.json({
      success: true,
      message: 'Processamento de alertas testado com sucesso',
      alertsGenerated: alerts.length,
      executionTimeMs: executionTime,
      timestamp: new Date().toISOString(),
      alerts: alerts.map(alert => ({
        ticker: alert.ticker,
        price: alert.price,
        variation: alert.variation,
        userId: alert.userId.substring(0, 8) + '...'
      }))
    });
    
  } catch (error) {
    const executionTime = Date.now() - startTime;
    
    console.error('❌ Erro no teste de alertas:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      executionTimeMs: executionTime,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}