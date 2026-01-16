import * as cheerio from 'cheerio';
import { NextResponse } from 'next/server';

/**
 * API Super Completa para descobrir TODOS os FII
 * 
 * GET /api/fii/discover-all
 * 
 * Estratégias múltiplas para garantir descoberta completa:
 * 1. Busca geral (sem filtros)
 * 2. Busca por letras do alfabeto  
 * 3. Busca por números (11, 12, 13...)
 * 4. Busca por fundos conhecidos populares
 * 5. Análise de paginação
 */
export async function GET() {
  try {
    console.log('🕵️ Iniciando descoberta SUPER COMPLETA de FII...');
    
    const discoveredFunds = new Map<string, {
      ticker: string;
      fundName: string;
      reportDate: string;
      pdfUrl?: string;
      discoveryMethod: string;
    }>();

    // Headers padronizados
    const headers = {
      'HX-Request': 'true',
      'HX-Target': 'table-container',
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
    };

    // Função para extrair fundos de HTML
    const extractFunds = (html: string, method: string) => {
      const $ = cheerio.load(html);
      let foundCount = 0;
      
      $('tbody tr').each((i, row) => {
        const $row = $(row);
        
        const tickerElement = $row.find('td:first-child a, td:first-child');
        const ticker = tickerElement.text().trim().toUpperCase();
        
        // Validar formato de ticker FII (XXXX11, XXXX12, etc.)
        if (!ticker || !ticker.match(/^[A-Z]{4}\d{2}$/)) {
          return;
        }
        
        // Evitar duplicatas
        if (discoveredFunds.has(ticker)) {
          return;
        }
        
        const fundNameCell = $row.find('td:nth-child(2)');
        const fundName = fundNameCell.attr('title') || fundNameCell.text().trim();
        
        const reportDate = $row.find('td:nth-child(3)').text().trim();
        
        const pdfLink = $row.find('td:nth-child(4) a[href*="downloadDocumento"], td:nth-child(4) a[href*="download"], .download-link').attr('href');
        const pdfUrl = pdfLink ? (pdfLink.startsWith('http') ? pdfLink : `https://relatoriosfiis.com.br${pdfLink}`) : undefined;
        
        discoveredFunds.set(ticker, {
          ticker,
          fundName: fundName || `${ticker} Fund`,
          reportDate,
          pdfUrl,
          discoveryMethod: method
        });
        
        foundCount++;
        console.log(`${method}: ${ticker} - ${fundName} - ${pdfUrl ? '✅' : '❌'}`);
      });
      
      return foundCount;
    };

    // ESTRATÉGIA 1: Busca geral (sem filtros)
    console.log('🔍 ESTRATÉGIA 1: Busca geral...');
    try {
      const generalResponse = await fetch('https://relatoriosfiis.com.br/?search=', { headers });
      if (generalResponse.ok) {
        const generalHtml = await generalResponse.text();
        const count = extractFunds(generalHtml, 'Busca Geral');
        console.log(`📊 Busca geral encontrou: ${count} fundos`);
      }
    } catch (error) {
      console.warn('Falha na busca geral:', error);
    }

    await new Promise(resolve => setTimeout(resolve, 1000));

    // ESTRATÉGIA 2: Busca por letras do alfabeto
    console.log('🔍 ESTRATÉGIA 2: Busca alfabética...');
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    
    for (const letter of letters) {
      try {
        const letterResponse = await fetch(`https://relatoriosfiis.com.br/?search=${letter}`, { headers });
        if (letterResponse.ok) {
          const letterHtml = await letterResponse.text();
          const count = extractFunds(letterHtml, `Letra ${letter}`);
          if (count > 0) {
            console.log(`📊 Letra ${letter}: +${count} fundos`);
          }
        }
        
        // Pausa para não sobrecarregar
        await new Promise(resolve => setTimeout(resolve, 300));
        
      } catch (error) {
        console.warn(`Falha na busca por letra ${letter}:`, error);
      }
    }

    // ESTRATÉGIA 3: Busca por sufixos numéricos
    console.log('🔍 ESTRATÉGIA 3: Busca por sufixos...');
    const suffixes = ['11', '12', '13', '01', '02', '03'];
    
    for (const suffix of suffixes) {
      try {
        const suffixResponse = await fetch(`https://relatoriosfiis.com.br/?search=${suffix}`, { headers });
        if (suffixResponse.ok) {
          const suffixHtml = await suffixResponse.text();
          const count = extractFunds(suffixHtml, `Sufixo ${suffix}`);
          if (count > 0) {
            console.log(`📊 Sufixo ${suffix}: +${count} fundos`);
          }
        }
        
        await new Promise(resolve => setTimeout(resolve, 300));
        
      } catch (error) {
        console.warn(`Falha na busca por sufixo ${suffix}:`, error);
      }
    }

    // ESTRATÉGIA 4: Busca por nomes de fundos conhecidos
    console.log('🔍 ESTRATÉGIA 4: Busca por termos populares...');
    const popularTerms = ['SHOPPING', 'LOGISTICA', 'CORPORATIVO', 'HEDGE', 'KINEA', 'XP', 'BTG'];
    
    for (const term of popularTerms) {
      try {
        const termResponse = await fetch(`https://relatoriosfiis.com.br/?search=${term}`, { headers });
        if (termResponse.ok) {
          const termHtml = await termResponse.text();
          const count = extractFunds(termHtml, `Termo ${term}`);
          if (count > 0) {
            console.log(`📊 Termo ${term}: +${count} fundos`);
          }
        }
        
        await new Promise(resolve => setTimeout(resolve, 300));
        
      } catch (error) {
        console.warn(`Falha na busca por termo ${term}:`, error);
      }
    }

    // ESTRATÉGIA 5: Verificar se há paginação
    console.log('🔍 ESTRATÉGIA 5: Verificando paginação...');
    try {
      const firstPageResponse = await fetch('https://relatoriosfiis.com.br/', { headers });
      if (firstPageResponse.ok) {
        const firstPageHtml = await firstPageResponse.text();
        const $firstPage = cheerio.load(firstPageHtml);
        
        // Buscar links de paginação
        const paginationLinks = $firstPage('a[href*="page="], .pagination a, .page-link').toArray();
        
        if (paginationLinks.length > 0) {
          console.log(`📄 Encontrada paginação com ${paginationLinks.length} links`);
          
          // Buscar nas primeiras 3 páginas
          for (let page = 2; page <= 4; page++) {
            try {
              const pageResponse = await fetch(`https://relatoriosfiis.com.br/?page=${page}`, { headers });
              if (pageResponse.ok) {
                const pageHtml = await pageResponse.text();
                const count = extractFunds(pageHtml, `Página ${page}`);
                if (count > 0) {
                  console.log(`📊 Página ${page}: +${count} fundos`);
                }
              }
              await new Promise(resolve => setTimeout(resolve, 500));
            } catch (error) {
              console.warn(`Falha na página ${page}:`, error);
            }
          }
        }
      }
    } catch (error) {
      console.warn('Falha na verificação de paginação:', error);
    }

    // Consolidar resultados
    const results = Array.from(discoveredFunds.values());
    
    // Agrupar por método de descoberta
    const byMethod = results.reduce((acc, fund) => {
      acc[fund.discoveryMethod] = (acc[fund.discoveryMethod] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Estatísticas finais
    const totalFunds = results.length;
    const fundsWithPdf = results.filter(r => r.pdfUrl).length;
    const fundsWithoutPdf = totalFunds - fundsWithPdf;

    console.log('🎊 DESCOBERTA SUPER COMPLETA FINALIZADA:');
    console.log(`📊 Total descoberto: ${totalFunds} fundos FII únicos`);
    console.log(`📄 Com PDF: ${fundsWithPdf}`);
    console.log(`❌ Sem PDF: ${fundsWithoutPdf}`);
    console.log(`🎯 Taxa de cobertura: ${((fundsWithPdf/totalFunds)*100).toFixed(1)}%`);
    console.log('📈 Por método:', byMethod);

    return NextResponse.json({
      success: true,
      message: 'Descoberta super completa de FII realizada',
      results: results.sort((a, b) => a.ticker.localeCompare(b.ticker)),
      statistics: {
        total: totalFunds,
        withPdf: fundsWithPdf,
        withoutPdf: fundsWithoutPdf,
        coveragePercentage: Math.round((fundsWithPdf/totalFunds)*100),
        discoveryMethods: byMethod
      },
      meta: {
        source: 'relatoriosfiis.com.br',
        timestamp: new Date().toISOString(),
        searchMethods: [
          'Busca geral sem filtros',
          'Busca alfabética (A-Z)',
          'Busca por sufixos numéricos',
          'Busca por termos populares',
          'Verificação de paginação'
        ],
        totalRequests: Object.values(byMethod).reduce((a, b) => a + b, 0)
      }
    }, { status: 200 });

  } catch (error) {
    console.error('❌ Erro na descoberta super completa:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Falha na descoberta super completa de FII',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}
