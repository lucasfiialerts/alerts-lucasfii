import { NextRequest, NextResponse } from 'next/server';
import { fiiAlertService } from '@/lib/fii-alerts';

/**
 * Endpoint para comparar mensagens simples vs completas
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ticker = searchParams.get('ticker') || 'HGLG11';
    
    console.log(`🧪 Comparando tipos de mensagem para ${ticker}...`);
    
    // Buscar dados estendidos
    const extendedData = await fiiAlertService.getExtendedFiiData(ticker);
    
    if (!extendedData) {
      return NextResponse.json({
        success: false,
        error: `Dados não encontrados para ${ticker}`
      }, { status: 404 });
    }
    
    // Criar ambas as versões
    const completeMessage = fiiAlertService.createAlertMessage(
      ticker, 
      extendedData.shortName || extendedData.longName, 
      extendedData,
      extendedData
    );
    
    const simpleMessage = fiiAlertService.createSimpleAlertMessage(
      ticker,
      extendedData.shortName || extendedData.longName,
      extendedData
    );
    
    return NextResponse.json({
      success: true,
      ticker: ticker,
      comparison: {
        complete: {
          title: "MENSAGEM COMPLETA (Relatórios e Eventos = ATIVO)",
          message: completeMessage,
          features: [
            "💰 Cotação e variação",
            "📊 Volume negociado",
            "📋 Faixas de preço (dia e 52 semanas)",
            "💼 Valor patrimonial (VP)",
            "💰 Patrimônio líquido", 
            "📅 Competência",
            "📈 Reavaliação patrimonial"
          ]
        },
        simple: {
          title: "MENSAGEM SIMPLES (Relatórios e Eventos = DESATIVADO)",
          message: simpleMessage,
          features: [
            "💰 Cotação e variação básica",
            "🚀 Status de alta/baixa",
            "🔗 Link do site"
          ]
        }
      },
      explanation: {
        logic: "Se 'Relatórios e Eventos' estiver ATIVO na configuração → mensagem COMPLETA. Se DESATIVADO → mensagem SIMPLES.",
        userControl: "Usuário pode escolher o nível de detalhamento nas preferências"
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Erro ao comparar mensagens:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}