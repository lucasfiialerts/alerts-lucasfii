import { NextRequest, NextResponse } from 'next/server';
import { fiiAlertService } from '@/lib/fii-alerts';
import { brapiService } from '@/lib/brapi';

/**
 * Endpoint para testar alertas com threshold personalizado
 */
export async function POST(request: NextRequest) {
  try {
    const { ticker, threshold = 0.01 } = await request.json();
    
    console.log(`🧪 Teste de alerta para ${ticker} com threshold ${threshold}%`);
    
    // Buscar cotação atual
    const fiiData = await brapiService.getFiiData([ticker]);
    if (!fiiData || fiiData.length === 0) {
      return NextResponse.json({ 
        error: `Cotação não encontrada para ${ticker}` 
      }, { status: 404 });
    }
    
    const quote = fiiData[0];
    console.log(`📊 ${ticker}: ${quote.regularMarketPrice} (${quote.regularMarketChangePercent}%)`);
    
    // Simular alerta se a variação atual for maior que o threshold
    const shouldAlert = Math.abs(quote.regularMarketChangePercent) >= threshold;
    
    return NextResponse.json({
      success: true,
      ticker,
      currentPrice: quote.regularMarketPrice,
      variation: quote.regularMarketChangePercent,
      threshold,
      shouldAlert,
      message: shouldAlert ? 
        `✅ ALERTA: ${ticker} variou ${quote.regularMarketChangePercent}% (threshold: ${threshold}%)` :
        `❌ Sem alerta: variação ${quote.regularMarketChangePercent}% é menor que ${threshold}%`
    });
    
  } catch (error) {
    console.error('Erro no teste de alerta:', error);
    return NextResponse.json({ 
      error: 'Erro interno do servidor' 
    }, { status: 500 });
  }
}