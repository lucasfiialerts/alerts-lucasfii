import { NextRequest, NextResponse } from 'next/server';
import { brapiService } from '@/lib/brapi';

/**
 * Endpoint para verificar todos os dados disponíveis de um FII específico
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ticker = searchParams.get('ticker') || 'GGRC11';
    
    console.log(`🔍 Buscando dados completos para ${ticker}...`);
    
    const result = await brapiService.getFiiData([ticker]);
    
    if (result.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'FII não encontrado'
      }, { status: 404 });
    }
    
    const fiiData = result[0];
    
    // Retornar todos os dados disponíveis
    return NextResponse.json({
      success: true,
      ticker: ticker,
      allAvailableData: fiiData,
      // Dados organizados para mensagem
      organizedData: {
        basic: {
          symbol: fiiData.symbol,
          name: fiiData.shortName || fiiData.longName,
          price: fiiData.regularMarketPrice,
          variation: fiiData.regularMarketChangePercent,
          volume: fiiData.regularMarketVolume
        },
        financial: {
          marketCap: fiiData.marketCap,
          priceEarnings: fiiData.priceEarnings,
          earningsPerShare: fiiData.earningsPerShare,
          dayRange: fiiData.regularMarketDayRange,
          fiftyTwoWeekRange: `${fiiData.fiftyTwoWeekLow} - ${fiiData.fiftyTwoWeekHigh}`
        },
        technical: {
          previousClose: fiiData.regularMarketPreviousClose,
          dayHigh: fiiData.regularMarketDayHigh,
          dayLow: fiiData.regularMarketDayLow,
          change: fiiData.regularMarketChange
        }
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Erro ao buscar dados detalhados:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}