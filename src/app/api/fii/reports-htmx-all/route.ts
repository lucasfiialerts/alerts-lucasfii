import * as cheerio from 'cheerio';
import { NextResponse } from 'next/server';

import { db } from '@/db';
import { fiiFundTable } from '@/db/schema';

/**
 * API melhorada para buscar TODOS os fundos do relatoriosfiis.com.br
 * 
 * GET /api/fii/reports-htmx-all
 * 
 * Busca dinamicamente todos os FII disponíveis no site,
 * não apenas uma lista limitada pré-definida.
 */
export async function GET() {
  try {
    console.log('🚀 Iniciando busca COMPLETA de FII do relatoriosfiis.com.br...');
    
    const results: Array<{
      ticker: string;
      fundName: string;
      reportDate?: string;
      pdfUrl?: string;
      error?: string;
    }> = [];

    // 1. Buscar TODOS os fundos disponíveis no site
    console.log('🔍 Fazendo busca completa (sem filtros)...');
    
    const htmxResponse = await fetch('https://relatoriosfiis.com.br/?search=', {
      headers: {
        'HX-Request': 'true',
        'HX-Target': 'table-container',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    if (!htmxResponse.ok) {
      throw new Error(`HTMX API falhou: ${htmxResponse.status} ${htmxResponse.statusText}`);
    }

    const htmxHtml = await htmxResponse.text();
    const $ = cheerio.load(htmxHtml);
    
    console.log('📊 Parseando resposta HTMX...');
    
    // 2. Extrair TODOS os fundos da resposta
    const discoveredFunds = new Map<string, {
      ticker: string;
      fundName: string;
      reportDate: string;
      pdfUrl?: string;
    }>();

    $('tbody tr').each((i, row) => {
      const $row = $(row);
      
      // Extrair ticker da primeira coluna
      const tickerLink = $row.find('td:first-child a');
      const ticker = tickerLink.text().trim().toUpperCase();
      
      if (!ticker || !ticker.match(/^[A-Z]{4}\d{2}$/)) {
        return; // Skip se não for formato válido de ticker FII
      }
      
      // Extrair nome do fundo
      const fundNameCell = $row.find('td:nth-child(2)');
      const fundName = fundNameCell.attr('title') || fundNameCell.text().trim();
      
      // Extrair data do relatório  
      const reportDate = $row.find('td:nth-child(3)').text().trim();
      
      // Extrair link do PDF
      const pdfLink = $row.find('td:nth-child(4) a[href*="downloadDocumento"]').attr('href');
      const pdfUrl = pdfLink ? `https://relatoriosfiis.com.br${pdfLink}` : undefined;
      
      console.log(`📄 Descoberto: ${ticker} - ${fundName} - ${reportDate} - ${pdfUrl ? '✅ PDF' : '❌ Sem PDF'}`);
      
      discoveredFunds.set(ticker, {
        ticker,
        fundName: fundName || `Fundo ${ticker}`,
        reportDate,
        pdfUrl
      });
    });

    console.log(`🎯 Total descoberto: ${discoveredFunds.size} fundos FII`);

    // 3. Se não encontrou nada, fazer buscas por páginas ou letras
    if (discoveredFunds.size === 0) {
      console.log('⚠️ Nenhum fundo encontrado na busca principal, tentando estratégias alternativas...');
      
      // Tentar buscar por letras do alfabeto
      const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
      
      for (const letter of letters.slice(0, 5)) { // Teste apenas primeiras 5 letras
        try {
          console.log(`🔤 Buscando fundos com letra: ${letter}`);
          
          const letterResponse = await fetch(`https://relatoriosfiis.com.br/?search=${letter}`, {
            headers: {
              'HX-Request': 'true',
              'HX-Target': 'table-container',
              'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
            }
          });

          if (letterResponse.ok) {
            const letterHtml = await letterResponse.text();
            const $letter = cheerio.load(letterHtml);
            
            $letter('tbody tr').each((i, row) => {
              const $row = $letter(row);
              const tickerLink = $row.find('td:first-child a');
              const ticker = tickerLink.text().trim().toUpperCase();
              
              if (ticker && ticker.match(/^[A-Z]{4}\d{2}$/) && !discoveredFunds.has(ticker)) {
                const fundNameCell = $row.find('td:nth-child(2)');
                const fundName = fundNameCell.attr('title') || fundNameCell.text().trim();
                const reportDate = $row.find('td:nth-child(3)').text().trim();
                const pdfLink = $row.find('td:nth-child(4) a[href*="downloadDocumento"]').attr('href');
                
                discoveredFunds.set(ticker, {
                  ticker,
                  fundName: fundName || `Fundo ${ticker}`,
                  reportDate,
                  pdfUrl: pdfLink ? `https://relatoriosfiis.com.br${pdfLink}` : undefined
                });
              }
            });
          }
          
          // Pausa para não sobrecarregar o servidor
          await new Promise(resolve => setTimeout(resolve, 500));
          
        } catch (error) {
          console.warn(`Erro na busca por letra ${letter}:`, error);
        }
      }
    }

    // 4. Processar todos os fundos descobertos
    for (const [ticker, fundData] of discoveredFunds) {
      results.push({
        ticker: fundData.ticker,
        fundName: fundData.fundName,
        reportDate: fundData.reportDate,
        pdfUrl: fundData.pdfUrl
      });
    }

    // 5. Salvar no banco de dados (se ainda não existir)
    try {
      console.log('💾 Salvando novos fundos no banco...');
      
      for (const fund of results) {
        if (fund.ticker && fund.fundName) {
          try {
            await db.insert(fiiFundTable).values({
              ticker: fund.ticker,
              name: fund.fundName
            }).onConflictDoNothing();
          } catch (dbError) {
            console.warn(`Erro ao salvar ${fund.ticker}:`, dbError);
          }
        }
      }
    } catch (error) {
      console.warn('Erro ao salvar no banco:', error);
    }

    // 6. Estatísticas finais
    const totalFunds = results.length;
    const fundsWithPdf = results.filter(r => r.pdfUrl).length;
    const fundsWithoutPdf = totalFunds - fundsWithPdf;

    console.log(`✅ Busca completa finalizada:`);
    console.log(`📊 Total de fundos: ${totalFunds}`);
    console.log(`📄 Com PDF: ${fundsWithPdf}`);
    console.log(`❌ Sem PDF: ${fundsWithoutPdf}`);
    console.log(`🎯 Taxa de cobertura PDF: ${((fundsWithPdf/totalFunds)*100).toFixed(1)}%`);

    return NextResponse.json({
      success: true,
      message: 'Busca completa de FII realizada com sucesso',
      results: results,
      statistics: {
        total: totalFunds,
        withPdf: fundsWithPdf,
        withoutPdf: fundsWithoutPdf,
        coveragePercentage: Math.round((fundsWithPdf/totalFunds)*100),
        searchStrategy: discoveredFunds.size > 0 ? 'Direct search' : 'Letter-by-letter search'
      },
      meta: {
        source: 'relatoriosfiis.com.br',
        timestamp: new Date().toISOString(),
        searchMethod: 'Dynamic discovery (no hardcoded list)',
        lastUpdate: new Date().toLocaleDateString('pt-BR')
      }
    }, { status: 200 });

  } catch (error) {
    console.error('❌ Erro na busca completa de FII:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Falha na busca completa de FII',
      details: error instanceof Error ? error.message : 'Erro desconhecido',
      suggestion: 'Verifique conectividade com relatoriosfiis.com.br'
    }, { status: 500 });
  }
}