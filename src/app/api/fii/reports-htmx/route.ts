import * as cheerio from 'cheerio';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { db } from '@/db';
import { fiiFundTable } from '@/db/schema';

export async function GET() {
  try {
    console.log('Starting PDF report extraction using HTMX API...');
    
    // Get all FII funds from our database
    const funds = await db.select().from(fiiFundTable);
    console.log(`Found ${funds.length} funds in database`);
    
    const results: Array<{
      ticker: string;
      fundName: string;
      reportDate?: string;
      pdfUrl?: string;
      error?: string;
    }> = [];

    // Fallback list of known FII tickers
    const fallbackTickers = [
      'HGLG11', 'BTLG11', 'XPML11', 'VISC11', 'BCFF11',
      'MXRF11', 'KNRI11', 'HFOF11', 'JSRE11', 'ALZR11',
      'VGIR11', 'RECT11', 'KNHY11', 'RBRR11', 'GGRC11',
      'MALL11', 'XPIN11', 'RBRY11', 'PVBI11', 'XPCI11',
      'TRXF11', 'LVBI11', 'KNCR11', 'GCRA11', 'CVBI11',
      'BRCR11', 'XPLG11', 'CXRI11', 'CPTS11', 'RBRF11'
    ];

    // Create a comprehensive list of tickers to check
    const fundTickers = funds.map(f => f.ticker);
    const allTickers = [...new Set([...fundTickers, ...fallbackTickers])];
    
    console.log(`Checking ${allTickers.length} tickers using HTMX API...`);

    // First, get all available funds using the HTMX API (empty search returns all)
    console.log('Fetching all funds via HTMX API...');
    const htmxResponse = await fetch('https://relatoriosfiis.com.br/?search=', {
      headers: {
        'HX-Request': 'true',
        'HX-Target': 'table-container',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (!htmxResponse.ok) {
      throw new Error(`HTMX API request failed: ${htmxResponse.status}`);
    }

    const htmxHtml = await htmxResponse.text();
    const $ = cheerio.load(htmxHtml);
    
    console.log('Parsing HTMX response...');
    
    // Extract all fund data from the HTMX response
    const availableFunds = new Map<string, {
      ticker: string;
      fundName: string;
      reportDate: string;
      pdfUrl?: string;
    }>();

    $('tbody tr').each((i, row) => {
      const $row = $(row);
      
      // Extract ticker from the first column link
      const tickerLink = $row.find('td:first-child a');
      const ticker = tickerLink.text().trim();
      
      if (!ticker) return;
      
      // Extract fund name from title attribute or text
      const fundNameCell = $row.find('td:nth-child(2)');
      const fundName = fundNameCell.attr('title') || fundNameCell.text().trim();
      
      // Extract report date
      const reportDate = $row.find('td:nth-child(3)').text().trim();
      
      // Extract PDF download link
      const pdfLink = $row.find('td:nth-child(4) a[href*="downloadDocumento"]').attr('href');
      
      console.log(`Found via HTMX: ${ticker} - ${fundName} - ${reportDate} - ${pdfLink ? 'PDF available' : 'No PDF'}`);
      
      availableFunds.set(ticker, {
        ticker,
        fundName: fundName || `Fund ${ticker}`,
        reportDate,
        pdfUrl: pdfLink
      });
    });

    console.log(`HTMX API returned ${availableFunds.size} funds`);

    // Process each ticker we're interested in
    for (const ticker of allTickers) {
      console.log(`Processing ${ticker}...`);
      
      try {
        // First check if we have it from the HTMX response
        if (availableFunds.has(ticker)) {
          const fundData = availableFunds.get(ticker)!;
          results.push(fundData);
          console.log(`✅ Found ${ticker} in HTMX data`);
          continue;
        }

        // If not found in general list, try searching specifically for this ticker
        console.log(`${ticker} not in general list, searching specifically...`);
        
        const searchResponse = await fetch(`https://relatoriosfiis.com.br/?search=${ticker}`, {
          headers: {
            'HX-Request': 'true',
            'HX-Target': 'table-container',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        });

        if (!searchResponse.ok) {
          console.log(`Search failed for ${ticker}: ${searchResponse.status}`);
          results.push({
            ticker,
            fundName: `Fund ${ticker}`,
            error: `Search failed: ${searchResponse.status}`
          });
          continue;
        }

        const searchHtml = await searchResponse.text();
        const search$ = cheerio.load(searchHtml);
        
        // Look for exact ticker match in search results
        let found = false;
        search$('tbody tr').each((i, row) => {
          const $row = search$(row);
          const rowTicker = $row.find('td:first-child a').text().trim();
          
          if (rowTicker === ticker) {
            found = true;
            
            const fundNameCell = $row.find('td:nth-child(2)');
            const fundName = fundNameCell.attr('title') || fundNameCell.text().trim();
            const reportDate = $row.find('td:nth-child(3)').text().trim();
            const pdfLink = $row.find('td:nth-child(4) a[href*="downloadDocumento"]').attr('href');
            
            console.log(`✅ Found ${ticker} via search: ${fundName} - ${reportDate} - ${pdfLink ? 'PDF available' : 'No PDF'}`);
            
            results.push({
              ticker,
              fundName: fundName || `Fund ${ticker}`,
              reportDate: reportDate || undefined,
              pdfUrl: pdfLink || undefined
            });
          }
        });
        
        if (!found) {
          console.log(`❌ ${ticker} not found even in specific search`);
          results.push({
            ticker,
            fundName: `Fund ${ticker}`,
            error: 'Not found in search results'
          });
        }
        
      } catch (error) {
        console.error(`Error processing ${ticker}:`, error);
        results.push({
          ticker,
          fundName: `Fund ${ticker}`,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
      
      // Small delay between requests to be respectful
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    console.log(`PDF report extraction completed using HTMX API. Found ${results.filter(r => r.pdfUrl).length} PDF links out of ${results.length} funds.`);

    return NextResponse.json({
      message: 'PDF report extraction completed using HTMX API',
      total: results.length,
      withPdf: results.filter(r => r.pdfUrl).length,
      availableFundsTotal: availableFunds.size,
      reports: results
    });

  } catch (error) {
    console.error('Error in PDF report extraction:', error);
    return NextResponse.json(
      { 
        error: 'Failed to extract PDF reports using HTMX API',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}