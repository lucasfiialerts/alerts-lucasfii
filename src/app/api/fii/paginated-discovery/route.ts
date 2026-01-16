import * as cheerio from 'cheerio';
import { NextResponse } from 'next/server';

import { db } from '@/db';
import { fiiFundTable } from '@/db/schema';

/**
 * API COMPLETA com Paginação - Busca TODOS os FII
 * 
 * GET /api/fii/paginated-discovery
 * 
 * Percorre todas as páginas do relatoriosfiis.com.br
 * ?page=1, ?page=2, ?page=3... até encontrar todas
 */
export async function GET(request: Request) {
  try {
    console.log('🔄 Iniciando busca PAGINADA completa de FII...');
    
    const url = new URL(request.url);
    const maxPages = parseInt(url.searchParams.get('maxPages') || '50'); // Limite padrão
    const startPage = parseInt(url.searchParams.get('startPage') || '1');
    const saveToDB = url.searchParams.get('save') === 'true';
    
    const discoveredFunds = new Map<string, {
      ticker: string;
      fundName: string;
      reportDate: string;
      pdfUrl?: string;
      pageFound: number;
    }>();

    let currentPage = startPage;
    let consecutiveEmptyPages = 0;
    let totalPages = 0;
    
    console.log(`📄 Configuração: Início=${startPage}, Máx=${maxPages}, Salvar=${saveToDB}`);

    // Headers otimizados
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache'
    };

    // Função para extrair fundos de uma página
    const extractFundsFromPage = (html: string, pageNum: number): number => {
      const $ = cheerio.load(html);
      let foundCount = 0;
      
      // Buscar na tabela de resultados
      $('tbody tr, table tr').each((i, row) => {
        const $row = $(row);
        
        // Extrair ticker (primeira coluna)
        const tickerElement = $row.find('td:first-child a, td:first-child, a[href*="ticker"]').first();
        const ticker = tickerElement.text().trim().toUpperCase();
        
        // Validar formato FII
        if (!ticker || !ticker.match(/^[A-Z]{4}[0-9]{2}$/)) {
          return;
        }
        
        // Evitar duplicatas
        if (discoveredFunds.has(ticker)) {
          return;
        }
        
        // Extrair nome do fundo (segunda coluna)
        const fundNameElement = $row.find('td:nth-child(2)');
        const fundName = fundNameElement.attr('title') || fundNameElement.text().trim();
        
        // Extrair data do relatório (terceira coluna)
        const reportDateElement = $row.find('td:nth-child(3)');
        const reportDate = reportDateElement.text().trim();
        
        // Extrair links de download (quarta/quinta coluna)
        const downloadLinks = $row.find('a[href*="downloadDocumento"], a[href*="download"], a[href*="baixar"]');
        let pdfUrl;
        
        if (downloadLinks.length > 0) {
          const href = downloadLinks.first().attr('href');
          if (href) {
            pdfUrl = href.startsWith('http') ? href : `https://relatoriosfiis.com.br${href}`;
          }
        }
        
        discoveredFunds.set(ticker, {
          ticker,
          fundName: fundName || `${ticker} Fund`,
          reportDate: reportDate || 'N/A',
          pdfUrl,
          pageFound: pageNum
        });
        
        foundCount++;
        console.log(`P${pageNum}: ${ticker} - ${fundName.substring(0, 30)}... - ${pdfUrl ? '✅ PDF' : '❌'}`);
      });
      
      return foundCount;
    };

    // Buscar primeira página para descobrir total de páginas
    console.log('📖 Analisando primeira página...');
    try {
      const firstPageResponse = await fetch('https://relatoriosfiis.com.br/?page=1', { headers });
      
      if (firstPageResponse.ok) {
        const firstPageHtml = await firstPageResponse.text();
        const $ = cheerio.load(firstPageHtml);
        
        // Extrair fundos da primeira página
        const firstPageCount = extractFundsFromPage(firstPageHtml, 1);
        console.log(`📊 Página 1: ${firstPageCount} fundos encontrados`);
        
        // Descobrir total de páginas
        const paginationText = $('.pagination, .page-links, [class*="page"]').text();
        const pageNumbers = $('a[href*="page="], .page-item a, .pagination a')
          .map((i, el) => parseInt($(el).text()))
          .get()
          .filter(num => !isNaN(num));
        
        if (pageNumbers.length > 0) {
          totalPages = Math.max(...pageNumbers);
          console.log(`📚 Total estimado de páginas: ${totalPages}`);
        } else {
          // Se não encontrou paginação, tentar extrair do texto
          const pageMatch = firstPageHtml.match(/page=(\d+)/g);
          if (pageMatch) {
            const lastPageMatch = pageMatch[pageMatch.length - 1].match(/\d+/);
            if (lastPageMatch) {
              totalPages = parseInt(lastPageMatch[0]);
            }
          }
        }
        
        currentPage = 2; // Próxima página
      }
    } catch (error) {
      console.warn('Erro na primeira página:', error);
    }

    // Limitar páginas se descoberto o total
    if (totalPages > 0) {
      const effectiveMaxPages = Math.min(maxPages, totalPages);
      console.log(`📋 Vai processar até página ${effectiveMaxPages} de ${totalPages} total`);
    }

    // Buscar páginas sequencialmente
    while (currentPage <= maxPages && consecutiveEmptyPages < 5) {
      try {
        console.log(`📄 Processando página ${currentPage}...`);
        
        const pageResponse = await fetch(`https://relatoriosfiis.com.br/?page=${currentPage}`, { headers });
        
        if (!pageResponse.ok) {
          console.warn(`⚠️ Página ${currentPage} retornou ${pageResponse.status}`);
          consecutiveEmptyPages++;
          currentPage++;
          continue;
        }
        
        const pageHtml = await pageResponse.text();
        
        // Verificar se a página tem conteúdo relevante
        if (pageHtml.includes('No results') || pageHtml.length < 1000) {
          console.log(`📭 Página ${currentPage} vazia ou sem resultados`);
          consecutiveEmptyPages++;
        } else {
          const pageCount = extractFundsFromPage(pageHtml, currentPage);
          
          if (pageCount === 0) {
            consecutiveEmptyPages++;
            console.log(`📭 Página ${currentPage} sem fundos válidos`);
          } else {
            consecutiveEmptyPages = 0; // Reset contador
            console.log(`📊 Página ${currentPage}: +${pageCount} fundos (Total: ${discoveredFunds.size})`);
          }
        }
        
        currentPage++;
        
        // Pausa para não sobrecarregar o servidor
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Status a cada 10 páginas
        if (currentPage % 10 === 0) {
          console.log(`📈 Progresso: ${currentPage-1} páginas | ${discoveredFunds.size} fundos únicos`);
        }
        
      } catch (error) {
        console.error(`❌ Erro na página ${currentPage}:`, error);
        consecutiveEmptyPages++;
        currentPage++;
      }
    }

    // Salvar no banco se solicitado
    if (saveToDB && discoveredFunds.size > 0) {
      console.log('💾 Salvando fundos no banco de dados...');
      
      let savedCount = 0;
      for (const [ticker, fund] of discoveredFunds) {
        try {
          await db.insert(fiiFundTable).values({
            ticker: fund.ticker,
            name: fund.fundName
          }).onConflictDoNothing();
          savedCount++;
        } catch (dbError) {
          console.warn(`Erro ao salvar ${ticker}:`, dbError);
        }
      }
      
      console.log(`💾 Salvos ${savedCount} fundos no banco`);
    }

    // Resultados finais
    const results = Array.from(discoveredFunds.values()).sort((a, b) => a.ticker.localeCompare(b.ticker));
    const fundsWithPdf = results.filter(r => r.pdfUrl).length;
    const fundsWithoutPdf = results.length - fundsWithPdf;
    
    // Agrupar por página para análise
    const fundsByPage = results.reduce((acc, fund) => {
      acc[fund.pageFound] = (acc[fund.pageFound] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    console.log('🎊 BUSCA PAGINADA COMPLETA:');
    console.log(`📚 Páginas processadas: ${currentPage - 1}`);
    console.log(`📊 Total de fundos únicos: ${results.length}`);
    console.log(`📄 Com PDF: ${fundsWithPdf} (${((fundsWithPdf/results.length)*100).toFixed(1)}%)`);
    console.log(`❌ Sem PDF: ${fundsWithoutPdf}`);

    return NextResponse.json({
      success: true,
      message: 'Busca paginada completa realizada',
      results: results,
      statistics: {
        total: results.length,
        withPdf: fundsWithPdf,
        withoutPdf: fundsWithoutPdf,
        coveragePercentage: Math.round((fundsWithPdf/results.length)*100),
        pagesProcessed: currentPage - 1,
        totalPagesEstimated: totalPages,
        fundsByPage: fundsByPage,
        savedToDatabase: saveToDB
      },
      pagination: {
        startPage: startPage,
        endPage: currentPage - 1,
        maxPagesLimit: maxPages,
        consecutiveEmptyPages: consecutiveEmptyPages
      },
      meta: {
        source: 'relatoriosfiis.com.br (paginação completa)',
        timestamp: new Date().toISOString(),
        processingTimeMinutes: ((Date.now() - Date.now()) / 60000).toFixed(1)
      }
    }, { status: 200 });

  } catch (error) {
    console.error('❌ Erro na busca paginada:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Falha na busca paginada completa',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}