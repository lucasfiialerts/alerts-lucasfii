import { NextRequest, NextResponse } from 'next/server';

import { generateFIIComparison,generateFIIReportSummary } from '@/lib/ai';
// Temporariamente desabilitado para build
// import { extractPDFText } from '@/lib/pdf-processor';

// Mock temporário para permitir build
const extractPDFText = async (url: string, options?: any) => ({
  success: false,
  text: '',
  metadata: undefined,
  error: 'PDF processing temporarily disabled for production build'
});

/**
 * Endpoint para gerar resumos em lote dos relatórios FII
 * 
 * POST /api/fii/batch-summary
 * 
 * Body:
 * - tickers: Array de códigos FII para processar
 * - useDatabase: Se deve usar dados já extraídos (default: true)
 * - generateComparison: Se deve gerar análise comparativa (default: false)
 * 
 * Integra com dados de relatoriosfiis.com.br já extraídos
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      tickers = [], 
      useDatabase = true, 
      generateComparison = false,
      maxTickers = 5 // Limite para evitar timeout
    } = body;

    if (!tickers.length) {
      return NextResponse.json({
        success: false,
        error: 'Lista de tickers é obrigatória'
      }, { status: 400 });
    }

    if (tickers.length > maxTickers) {
      return NextResponse.json({
        success: false,
        error: `Máximo ${maxTickers} tickers por vez`
      }, { status: 400 });
    }

    console.log(`🔄 Processamento em lote iniciado: ${tickers.join(', ')}`);

    // 1. Buscar PDFs dos tickers solicitados
    let pdfSources: Array<{ ticker: string; url: string; }> = [];
    
    if (useDatabase) {
      // Buscar dados já extraídos do relatoriosfiis.com.br
      console.log('📊 Buscando dados já extraídos...');
      
      const htmxResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/fii/reports-htmx`);
      
      if (htmxResponse.ok) {
        const htmxData = await htmxResponse.json();
        
        if (htmxData.success && htmxData.results) {
          // Filtrar apenas os tickers solicitados com PDF disponível
          pdfSources = htmxData.results
            .filter((result: any) => 
              tickers.includes(result.ticker) && result.pdfUrl
            )
            .map((result: any) => ({
              ticker: result.ticker,
              url: result.pdfUrl
            }));
        }
      }
    } else {
      // Buscar diretamente do relatoriosfiis.com.br (pode ser mais lento)
      console.log('🕷️ Buscando diretamente do relatoriosfiis.com.br...');
      
      for (const ticker of tickers) {
        try {
          // Simular busca no site (você pode implementar scraping aqui)
          const searchResponse = await fetch(`https://relatoriosfiis.com.br/${ticker}`);
          if (searchResponse.ok) {
            // Extrair URL do PDF (implementar parsing HTML se necessário)
            // Por ora, usar dados já disponíveis
          }
        } catch (error) {
          console.warn(`Falha ao buscar ${ticker} diretamente:`, error);
        }
      }
    }

    console.log(`📄 Encontrados ${pdfSources.length} PDFs para processar`);

    if (pdfSources.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Nenhum PDF encontrado para os tickers informados',
        availableTickers: tickers
      }, { status: 404 });
    }

    // 2. Processar PDFs e gerar resumos
    const summaryResults = [];
    const reportsForComparison = [];

    for (const source of pdfSources) {
      try {
        console.log(`📖 Processando ${source.ticker}...`);

        // Extrair texto do PDF
        const pdfResult = await extractPDFText(source.url, {
          maxPages: 30,
          cleanText: true
        });

        if (pdfResult.success && pdfResult.text) {
          // Gerar resumo com IA
          const summaryResult = await generateFIIReportSummary(
            pdfResult.text,
            source.ticker,
            'RESUMO_EXECUTIVO' // Usar resumo mais conciso para lotes
          );

          summaryResults.push({
            ticker: source.ticker,
            success: summaryResult.success,
            summary: summaryResult.summary,
            error: summaryResult.error,
            pdfMetadata: pdfResult.metadata
          });

          // Guardar para comparação se solicitado
          if (generateComparison && summaryResult.success) {
            reportsForComparison.push({
              ticker: source.ticker,
              content: pdfResult.text.substring(0, 8000) // Limitar tamanho
            });
          }

        } else {
          summaryResults.push({
            ticker: source.ticker,
            success: false,
            error: pdfResult.error || 'Falha na extração PDF'
          });
        }

        // Pausa entre processamentos para não sobrecarregar
        await new Promise(resolve => setTimeout(resolve, 2000));

      } catch (error) {
        console.error(`Erro processando ${source.ticker}:`, error);
        summaryResults.push({
          ticker: source.ticker,
          success: false,
          error: error instanceof Error ? error.message : 'Erro desconhecido'
        });
      }
    }

    // 3. Gerar análise comparativa se solicitado
    let comparison = null;
    if (generateComparison && reportsForComparison.length >= 2) {
      console.log('🔍 Gerando análise comparativa...');
      
      const comparisonResult = await generateFIIComparison(reportsForComparison);
      if (comparisonResult.success) {
        comparison = comparisonResult.comparison;
      }
    }

    // 4. Estatísticas do processamento
    const successCount = summaryResults.filter(r => r.success).length;
    const failureCount = summaryResults.length - successCount;

    console.log(`✅ Processamento concluído: ${successCount} sucessos, ${failureCount} falhas`);

    return NextResponse.json({
      success: true,
      data: {
        summaries: summaryResults,
        comparison: comparison,
        statistics: {
          requested: tickers.length,
          found: pdfSources.length,
          processed: summaryResults.length,
          successful: successCount,
          failed: failureCount
        },
        tickers: {
          requested: tickers,
          processed: pdfSources.map(s => s.ticker),
          notFound: tickers.filter((t: string) => !pdfSources.some(s => s.ticker === t))
        }
      }
    }, { status: 200 });

  } catch (error) {
    console.error('❌ Erro no processamento em lote:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Erro interno no processamento em lote',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}

/**
 * GET /api/fii/batch-summary - Informações sobre o serviço
 */
export async function GET() {
  try {
    // Buscar tickers disponíveis do sistema existente
    const htmxResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/fii/reports-htmx`);
    
    let availableTickers = [];
    if (htmxResponse.ok) {
      const htmxData = await htmxResponse.json();
      if (htmxData.success && htmxData.results) {
        availableTickers = htmxData.results
          .filter((r: any) => r.pdfUrl)
          .map((r: any) => r.ticker);
      }
    }

    return NextResponse.json({
      service: 'FII Batch Summary Service',
      description: 'Processamento em lote de resumos FII com IA',
      integration: 'relatoriosfiis.com.br',
      availability: {
        total: availableTickers.length,
        tickers: availableTickers.slice(0, 20), // Mostrar apenas os primeiros 20
        hasMore: availableTickers.length > 20
      },
      limits: {
        maxTickers: 5,
        timeout: '5 minutos',
        rateLimit: 'Pausa de 2s entre processamentos'
      },
      usage: {
        endpoint: 'POST /api/fii/batch-summary',
        examples: [
          {
            description: 'Resumo de múltiplos FII',
            body: {
              tickers: ['HGLG11', 'BTLG11', 'XPML11'],
              useDatabase: true,
              generateComparison: false
            }
          },
          {
            description: 'Resumo com análise comparativa',
            body: {
              tickers: ['HGLG11', 'BTLG11'],
              generateComparison: true
            }
          }
        ]
      }
    }, { status: 200 });

  } catch (error) {
    return NextResponse.json({
      service: 'FII Batch Summary Service',
      status: 'error',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}
