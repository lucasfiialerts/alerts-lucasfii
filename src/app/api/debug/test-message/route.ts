import { NextRequest, NextResponse } from 'next/server';
import { fiiAlertService } from '@/lib/fii-alerts';

/**
 * Endpoint para testar mensagens de alerta com dados estendidos
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ticker = searchParams.get('ticker') || 'GGRC11';
    
    console.log(`🧪 Testando mensagem expandida para ${ticker}...`);
    
    // Buscar dados estendidos
    const extendedData = await fiiAlertService.getExtendedFiiData(ticker);
    
    if (!extendedData) {
      return NextResponse.json({
        success: false,
        error: `Dados não encontrados para ${ticker}`
      }, { status: 404 });
    }
    
    // Criar mensagem de exemplo
    const message = fiiAlertService.createAlertMessage(
      ticker, 
      extendedData.shortName || extendedData.longName, 
      extendedData,
      extendedData
    );
    
    return NextResponse.json({
      success: true,
      ticker: ticker,
      message: message,
      rawData: {
        basic: {
          price: extendedData.regularMarketPrice,
          variation: extendedData.regularMarketChangePercent,
          volume: extendedData.regularMarketVolume
        },
        extended: {
          patrimonioLiquido: extendedData.patrimonioLiquido,
          valorPatrimonial: extendedData.valorPatrimonial,
          competencia: extendedData.competenciaReavaliacao,
          variacaoReavaliacao: extendedData.variacaoReavaliacao
        }
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Erro ao testar mensagem:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}