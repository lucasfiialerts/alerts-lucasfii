import { NextRequest, NextResponse } from 'next/server';
import { BrapiFiiData, brapiService, BrapiService } from '@/lib/brapi';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tickers = searchParams.get('tickers');
    
    if (!tickers) {
      return NextResponse.json(
        { error: 'Parâmetro tickers é obrigatório' },
        { status: 400 }
      );
    }

    const tickerList = tickers.split(',').map(ticker => ticker.trim().toUpperCase());
    
    console.log(`📊 Buscando cotações para: ${tickerList.join(', ')}`);
    
    const fiiData = await brapiService.getFiiData(tickerList);
    
    // Processar dados para o formato da resposta
    const processedData = fiiData.map((fii: BrapiFiiData) => ({
      ticker: fii.symbol,
      name: fii.longName || fii.shortName,
      price: fii.regularMarketPrice,
      variation: fii.regularMarketChangePercent,
      variationValue: fii.regularMarketChange,
      volume: fii.regularMarketVolume,
      marketCap: fii.marketCap,
      dayHigh: fii.regularMarketDayHigh,
      dayLow: fii.regularMarketDayLow,
      previousClose: fii.regularMarketPreviousClose,
      updatedAt: fii.regularMarketTime,
      formattedPrice: BrapiService.formatPrice(fii.regularMarketPrice),
      formattedVariation: BrapiService.formatVariation(fii.regularMarketChangePercent),
      emoji: BrapiService.getVariationEmoji(fii.regularMarketChangePercent),
    }));

    return NextResponse.json({
      success: true,
      data: processedData,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('❌ Erro ao buscar cotações:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido ao buscar cotações' 
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { tickers } = await request.json();
    
    if (!Array.isArray(tickers) || tickers.length === 0) {
      return NextResponse.json(
        { error: 'Array de tickers é obrigatório' },
        { status: 400 }
      );
    }

    const tickerList = tickers.map((ticker: string) => ticker.trim().toUpperCase());
    
    console.log(`📊 Buscando cotações (POST) para: ${tickerList.join(', ')}`);
    
    const fiiData = await brapiService.getFiiData(tickerList);
    
    // Processar dados para o formato da resposta
    const processedData = fiiData.map((fii: BrapiFiiData) => ({
      ticker: fii.symbol,
      name: fii.longName || fii.shortName,
      price: fii.regularMarketPrice,
      variation: fii.regularMarketChangePercent,
      variationValue: fii.regularMarketChange,
      volume: fii.regularMarketVolume,
      marketCap: fii.marketCap,
      dayHigh: fii.regularMarketDayHigh,
      dayLow: fii.regularMarketDayLow,
      previousClose: fii.regularMarketPreviousClose,
      updatedAt: fii.regularMarketTime,
      formattedPrice: BrapiService.formatPrice(fii.regularMarketPrice),
      formattedVariation: BrapiService.formatVariation(fii.regularMarketChangePercent),
      emoji: BrapiService.getVariationEmoji(fii.regularMarketChangePercent),
    }));

    return NextResponse.json({
      success: true,
      data: processedData,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('❌ Erro ao buscar cotações:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido ao buscar cotações' 
      },
      { status: 500 }
    );
  }
}
