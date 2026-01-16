import { NextRequest, NextResponse } from 'next/server';

import { generateFIIReportSummary } from '@/lib/ai';
import { extractPDFText } from '@/lib/pdf-processor';

/**
 * API Inteligente: Descoberta + IA
 * 
 * GET /api/fii/smart-discovery
 * 
 * Combina:
 * 1. Descoberta paginada de fundos
 * 2. Análise automática por IA dos relatórios
 * 3. Resumos inteligentes
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const maxTickers = parseInt(url.searchParams.get('maxTickers') || '5');
    const startPage = parseInt(url.searchParams.get('startPage') || '1');
    const maxPages = parseInt(url.searchParams.get('maxPages') || '5');
    const aiAnalysis = url.searchParams.get('ai') === 'true';
    
    console.log(`🧠 DESCOBERTA INTELIGENTE: páginas=${startPage}-${maxPages}, IA=${aiAnalysis}`);

    // 1. Descobrir fundos via paginação
    console.log('🔍 Fase 1: Descobrindo fundos...');
    
    const discoveryResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/fii/paginated-discovery?startPage=${startPage}&maxPages=${maxPages}`);
    
    if (!discoveryResponse.ok) {
      throw new Error('Falha na descoberta de fundos');
    }
    
    const discoveryData = await discoveryResponse.json();
    
    if (!discoveryData.success) {
      throw new Error(discoveryData.error || 'Descoberta retornou erro');
    }
    
    const fundsWithPdf = discoveryData.results
      .filter((fund: any) => fund.pdfUrl)
      .slice(0, maxTickers); // Limitar para não sobrecarregar
    
    console.log(`📊 Descobertos ${discoveryData.results.length} fundos, ${fundsWithPdf.length} com PDF para análise`);

    const aiResults = [];
    
    // 2. Análise por IA (se solicitada)
    if (aiAnalysis && fundsWithPdf.length > 0) {
      console.log('🤖 Fase 2: Análise por IA...');
      
      for (const fund of fundsWithPdf) {
        try {
          console.log(`🧠 Analisando ${fund.ticker}...`);
          
          // Extrair texto do PDF
          const pdfResult = await extractPDFText(fund.pdfUrl, {
            maxPages: 20,
            cleanText: true
          });
          
          if (pdfResult.success && pdfResult.text) {
            // Gerar resumo com IA
            const summaryResult = await generateFIIReportSummary(
              pdfResult.text,
              fund.ticker,
              'RESUMO_EXECUTIVO'
            );
            
            aiResults.push({
              ticker: fund.ticker,
              fundName: fund.fundName,
              reportDate: fund.reportDate,
              pdfUrl: fund.pdfUrl,
              pageFound: fund.pageFound,
              aiAnalysis: {
                success: summaryResult.success,
                summary: summaryResult.summary,
                error: summaryResult.error,
                pdfPages: pdfResult.metadata?.pages,
                processingTime: pdfResult.processingTime
              }
            });
            
            console.log(`✅ ${fund.ticker}: ${summaryResult.success ? 'Resumo gerado' : 'Falha - ' + summaryResult.error}`);
            
          } else {
            aiResults.push({
              ticker: fund.ticker,
              fundName: fund.fundName,
              reportDate: fund.reportDate,
              pdfUrl: fund.pdfUrl,
              pageFound: fund.pageFound,
              aiAnalysis: {
                success: false,
                error: pdfResult.error || 'Falha na extração de PDF'
              }
            });
            
            console.log(`❌ ${fund.ticker}: Falha na extração de PDF`);
          }
          
          // Pausa entre análises
          await new Promise(resolve => setTimeout(resolve, 3000));
          
        } catch (error) {
          console.error(`❌ Erro analisando ${fund.ticker}:`, error);
          
          aiResults.push({
            ticker: fund.ticker,
            fundName: fund.fundName,
            reportDate: fund.reportDate,
            pdfUrl: fund.pdfUrl,
            pageFound: fund.pageFound,
            aiAnalysis: {
              success: false,
              error: error instanceof Error ? error.message : 'Erro desconhecido'
            }
          });
        }
      }
    }
    
    // 3. Estatísticas finais
    const aiSuccessCount = aiResults.filter(r => r.aiAnalysis.success).length;
    const aiFailureCount = aiResults.length - aiSuccessCount;
    
    console.log(`🎊 DESCOBERTA INTELIGENTE COMPLETA:`);
    console.log(`📊 Total descoberto: ${discoveryData.results.length} fundos`);
    console.log(`🤖 IA analisou: ${aiResults.length} fundos`);
    console.log(`✅ Resumos gerados: ${aiSuccessCount}`);
    console.log(`❌ Falhas na IA: ${aiFailureCount}`);

    return NextResponse.json({
      success: true,
      message: 'Descoberta inteligente concluída',
      discovery: {
        totalFundsFound: discoveryData.results.length,
        fundsWithPdf: fundsWithPdf.length,
        pagesProcessed: discoveryData.statistics.pagesProcessed,
        totalPagesAvailable: discoveryData.statistics.totalPagesEstimated
      },
      aiAnalysis: {
        enabled: aiAnalysis,
        processed: aiResults.length,
        successful: aiSuccessCount,
        failed: aiFailureCount,
        results: aiResults
      },
      configuration: {
        startPage,
        maxPages,
        maxTickers,
        aiEnabled: aiAnalysis
      },
      recommendations: {
        nextSteps: [
          'Aumentar maxPages para descobrir mais fundos',
          'Ativar ai=true para análise inteligente',
          'Usar save=true para salvar no banco',
          'Processar em lotes menores para melhor performance'
        ],
        estimatedTotal: `~${(discoveryData.statistics.totalPagesEstimated * 15).toLocaleString()} fundos disponíveis`
      }
    }, { status: 200 });

  } catch (error) {
    console.error('❌ Erro na descoberta inteligente:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Falha na descoberta inteligente',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}