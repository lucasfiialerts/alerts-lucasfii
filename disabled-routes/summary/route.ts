import { NextRequest, NextResponse } from 'next/server';

import { checkGeminiHealth, FII_PROMPTS,generateFIIReportSummary } from '@/lib/ai';
import { extractFIIMetrics,extractPDFText, validateFIIReport } from '@/lib/pdf-processor';

/**
 * API de Resumos FII com IA
 * 
 * POST /api/fii/summary
 * 
 * Body:
 * - url: URL do PDF do relatório
 * - ticker: Código do FII (opcional)
 * - promptType: Tipo de análise (opcional)
 * 
 * Retorna:
 * - Resumo gerado pela IA
 * - Métricas extraídas
 * - Validação do conteúdo
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      url, 
      ticker = 'UNKNOWN', 
      promptType = 'RELATORIO_GERENCIAL' as keyof typeof FII_PROMPTS
    } = body;

    if (!url) {
      return NextResponse.json({
        success: false,
        error: 'URL do PDF é obrigatória'
      }, { status: 400 });
    }

    // Verificar se Gemini está configurado
    const healthCheck = await checkGeminiHealth();
    if (!healthCheck.configured) {
      return NextResponse.json({
        success: false,
        error: 'GEMINI_API_KEY não configurado',
        instructions: 'Configure GEMINI_API_KEY no arquivo .env'
      }, { status: 500 });
    }

    if (!healthCheck.working) {
      return NextResponse.json({
        success: false,
        error: 'Gemini API não está funcionando',
        details: healthCheck.error
      }, { status: 500 });
    }

    console.log(`🔍 Processando relatório FII: ${ticker} - ${url}`);

    // 1. Extrair texto do PDF
    console.log('📄 Extraindo texto do PDF...');
    const pdfResult = await extractPDFText(url, {
      maxPages: 50, // Limite para evitar PDFs muito grandes
      cleanText: true
    });

    if (!pdfResult.success || !pdfResult.text) {
      return NextResponse.json({
        success: false,
        error: 'Falha ao extrair texto do PDF',
        details: pdfResult.error
      }, { status: 500 });
    }

    console.log(`📊 PDF processado: ${pdfResult.metadata?.pages} páginas, ${pdfResult.text.length} caracteres`);

    // 2. Validar se é um relatório FII
    const validation = validateFIIReport(pdfResult.text);
    console.log(`✅ Validação FII: ${validation.confidence.toFixed(2)} confiança`);

    if (!validation.isValid) {
      return NextResponse.json({
        success: false,
        error: 'PDF não parece ser um relatório FII válido',
        validation,
        confidence: validation.confidence
      }, { status: 422 });
    }

    // 3. Extrair métricas específicas
    console.log('📈 Extraindo métricas do relatório...');
    const metrics = extractFIIMetrics(pdfResult.text);

    // 4. Gerar resumo com IA
    console.log('🤖 Gerando resumo com Gemini AI...');
    const summaryResult = await generateFIIReportSummary(
      pdfResult.text,
      ticker,
      promptType
    );

    if (!summaryResult.success) {
      return NextResponse.json({
        success: false,
        error: 'Falha ao gerar resumo com IA',
        details: summaryResult.error
      }, { status: 500 });
    }

    console.log('✨ Resumo gerado com sucesso!');

    // Resposta final
    return NextResponse.json({
      success: true,
      data: {
        ticker: metrics.ticker || ticker,
        summary: summaryResult.summary,
        metrics: {
          extracted: metrics,
          pdf: pdfResult.metadata,
          validation: {
            isValid: validation.isValid,
            confidence: validation.confidence,
            indicators: validation.indicators
          }
        },
        processing: {
          pdfTime: pdfResult.processingTime,
          aiUsage: summaryResult.usage,
          promptType: promptType
        }
      }
    }, { status: 200 });

  } catch (error) {
    console.error('❌ Erro no endpoint de resumo:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}

/**
 * GET /api/fii/summary - Health check e configuração
 */
export async function GET(request: NextRequest) {
  try {
    const health = await checkGeminiHealth();
    
    return NextResponse.json({
      service: 'FII AI Summary Service',
      status: health.working ? 'healthy' : 'unhealthy',
      gemini: {
        configured: health.configured,
        working: health.working,
        error: health.error
      },
      features: {
        pdfExtraction: true,
        aiSummary: health.configured,
        fiiValidation: true,
        metricsExtraction: true
      },
      prompts: Object.keys(FII_PROMPTS),
      usage: {
        endpoint: 'POST /api/fii/summary',
        parameters: {
          url: 'URL do PDF (obrigatório)',
          ticker: 'Código do FII (opcional)',
          promptType: `Um de: ${Object.keys(FII_PROMPTS).join(', ')}`
        }
      }
    }, { status: 200 });

  } catch (error) {
    return NextResponse.json({
      service: 'FII AI Summary Service', 
      status: 'error',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}