import * as cheerio from "cheerio";
import { and, desc,eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { db } from "@/db";
import { fiiFundTable, fiiReportTable } from "@/db/schema";

interface ReportData {
  reportDate: Date;
  reportMonth: string;
  reportUrl: string;
}

// API para buscar o relatório mais recente de um fundo específico
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fundId = searchParams.get('fundId');
    
    if (!fundId) {
      return NextResponse.json({ error: "ID do fundo é obrigatório" }, { status: 400 });
    }
    
    console.log(`Buscando relatórios para fundo ID: ${fundId}...`);
    
    // Primeiro, buscar o fundo no banco
    const fund = await db
      .select()
      .from(fiiFundTable)
      .where(eq(fiiFundTable.id, fundId))
      .limit(1);
    
    if (fund.length === 0) {
      return NextResponse.json({ 
        error: "Fundo não encontrado",
        fundId 
      }, { status: 404 });
    }
    
    const ticker = fund[0].ticker;
    console.log(`Buscando relatórios para ${ticker}...`);
    
    // Estratégia 1: Usar a busca direta do site
    console.log(`Buscando ${ticker} usando a busca do site...`);
    
    let response = await fetch(`https://relatoriosfiis.com.br/?q=${ticker}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
        'Referer': 'https://relatoriosfiis.com.br/',
      }
    });
    
    // Se a busca direta falhar, tentar buscar em múltiplas páginas
    if (!response.ok) {
      console.log(`Busca direta falhou (${response.status}), buscando em páginas...`);
      
      // Buscar em múltiplas páginas até encontrar o ticker
      let pageFound = false;
      let currentPage = 1;
      const maxPages = 50; // Limite para não sobrecarregar
      
      while (!pageFound && currentPage <= maxPages) {
        console.log(`🔍 Buscando página ${currentPage} para ${ticker}...`);
        
        try {
          const pageUrl = currentPage === 1 ? 
            "https://relatoriosfiis.com.br" : 
            `https://relatoriosfiis.com.br/?page=${currentPage}`;
            
          response = await fetch(pageUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
              'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
            }
          });
          
          if (!response.ok) {
            console.log(`Página ${currentPage} falhou, continuando...`);
            currentPage++;
            continue;
          }
          
          const pageHtml = await response.text();
          
          // Verificar se o ticker está nesta página
          if (pageHtml.includes(ticker.toUpperCase())) {
            console.log(`✅ ${ticker} encontrado na página ${currentPage}!`);
            pageFound = true;
            break;
          }
          
          // Verificar se chegamos no final das páginas
          if (!pageHtml.includes('Próxima') && !pageHtml.includes('próxima')) {
            console.log(`📄 Última página alcançada: ${currentPage}`);
            break;
          }
          
          currentPage++;
          
        } catch (error) {
          console.log(`Erro na página ${currentPage}: ${error}`);
          currentPage++;
        }
      }
      
      if (!pageFound) {
        throw new Error(`Ticker ${ticker} não encontrado em ${currentPage - 1} páginas`);
      }
    }
    
    const html = await response.text();
    console.log(`HTML recebido. Tamanho: ${html.length} caracteres`);
    
    const $ = cheerio.load(html);
    console.log(`Cheerio carregado. Procurando por tabelas...`);
    
    // Debug: contar quantas tabelas e linhas existem
    const tableCount = $('table').length;
    const rowCount = $('table tr, tbody tr').length;
    console.log(`Encontradas ${tableCount} tabelas e ${rowCount} linhas`);
    
    console.log(`Procurando por relatórios reais do ticker: ${ticker}...`);
    
    const reports: ReportData[] = [];
    let rowsProcessed = 0;
    let tickerFound = false;
    
    // Buscar em todas as linhas da tabela com melhor detecção
    $('table tr, tbody tr').each((_, row) => {
      rowsProcessed++;
      const cells = $(row).find('td');
      
      if (cells.length >= 3) {
        const cell0 = $(cells[0]).text().trim();
        const cell1 = cells.length > 1 ? $(cells[1]).text().trim() : '';
        const cell2 = cells.length > 2 ? $(cells[2]).text().trim() : '';
        
        // Debug apenas das primeiras linhas para performance
        if (rowsProcessed <= 10) {
          console.log(`Linha ${rowsProcessed}: [${cell0}] [${cell1}] [${cell2}]`);
        }
        
        const rowTicker = cell0.toUpperCase();
        const fundName = cell1;
        const reportMonth = cell2;
        
        // Busca mais flexível - pode ser exato ou conter o ticker
        if (rowTicker === ticker.toUpperCase() || cell0.includes(ticker.toUpperCase())) {
          tickerFound = true;
          console.log(`🎯 ENCONTRADO ${ticker}: ${fundName} - ${reportMonth}`);
          
          // Buscar todos os links na linha (última célula ou qualquer célula)
          let reportUrl = '';
          
          // Verificar todas as células em busca de links
          cells.each((_, cell) => {
            const cellLinks = $(cell).find('a');
            cellLinks.each((_, link) => {
              const linkText = $(link).text().trim().toLowerCase();
              const href = $(link).attr('href') || '';
              
              console.log(`    🔗 Link encontrado: "${linkText}" -> ${href}`);
              
              // Priorizar links que parecem ser PDFs ou relatórios
              if (
                linkText.includes('ver') || 
                linkText.includes('download') ||
                linkText.includes('pdf') ||
                href.includes('.pdf') || 
                href.includes('documento') || 
                href.includes('relatorio') ||
                href.includes('fnet.bmfbovespa') ||
                href.includes('downloadDocumento')
              ) {
                reportUrl = href;
                console.log(`    ✅ PDF Link selecionado: ${reportUrl}`);
                return false; // break do loop de links
              }
            });
            
            // Se encontrou URL, sair do loop de células
            if (reportUrl) return false;
          });
          
          // Se não encontrou link específico de PDF, tentar o primeiro link disponível
          if (!reportUrl) {
            const allLinks = $(row).find('a');
            if (allLinks.length > 0) {
              reportUrl = $(allLinks[0]).attr('href') || '';
              console.log(`    📄 Usando primeiro link disponível: ${reportUrl}`);
            }
          }
          
          if (reportMonth && reportUrl) {
            // Converter mês/ano para data
            let reportDate: Date;
            try {
              // Formatos: "Nov/2025", "Set/2025", etc.
              const [monthStr, yearStr] = reportMonth.split('/');
              const monthNames: Record<string, number> = {
                'Jan': 0, 'Fev': 1, 'Mar': 2, 'Abr': 3, 'Mai': 4, 'Jun': 5,
                'Jul': 6, 'Ago': 7, 'Set': 8, 'Out': 9, 'Nov': 10, 'Dez': 11
              };
              const month = monthNames[monthStr] ?? 0;
              const year = parseInt(yearStr);
              reportDate = new Date(year, month, 1);
            } catch (error) {
              console.warn(`Erro ao processar data ${reportMonth}:`, error);
              reportDate = new Date();
            }
            
            // Garantir que a URL seja absoluta
            let fullUrl = reportUrl;
            if (!reportUrl.startsWith('http')) {
              if (reportUrl.startsWith('/')) {
                fullUrl = `https://relatoriosfiis.com.br${reportUrl}`;
              } else {
                fullUrl = `https://relatoriosfiis.com.br/${reportUrl}`;
              }
            }
            
            reports.push({
              reportDate,
              reportMonth,
              reportUrl: fullUrl
            });
            
            console.log(`✅ Relatório adicionado: ${reportMonth} - ${fullUrl}`);
          } else {
            console.log(`⚠️ Dados incompletos: month="${reportMonth}", url="${reportUrl}"`);
          }
        }
      }
    });
    
    console.log(`Total de linhas processadas: ${rowsProcessed}`);
    console.log(`Relatórios encontrados para ${ticker}: ${reports.length}`);
    console.log(`Ticker encontrado na página: ${tickerFound}`);
    
    if (reports.length === 0) {
      console.log(`⚠️ Nenhum relatório encontrado via scraping para ${ticker}`);
      
      // Tentar estratégias alternativas de scraping mais agressivas
      console.log(`🔍 Tentando busca mais ampla para ${ticker}...`);
      
      // Estratégia 2: Buscar em toda a página por qualquer menção ao ticker
      const allText = $.text();
      if (allText.includes(ticker)) {
        console.log(`✅ Ticker ${ticker} encontrado no texto da página`);
        
        // Buscar links que possam ser do fundo mesmo em outras seções
        $('a').each((_, link) => {
          const linkText = $(link).text().trim();
          const href = $(link).attr('href') || '';
          const parent = $(link).parent().text();
          
          // Se o link ou elemento pai menciona o ticker
          if (linkText.includes(ticker) || parent.includes(ticker) || href.includes(ticker)) {
            console.log(`🎯 Link relacionado ao ${ticker}: ${linkText} -> ${href}`);
            
            if (href.includes('downloadDocumento') || href.includes('.pdf') || linkText.toLowerCase().includes('ver')) {
              const currentDate = new Date();
              const currentMonth = currentDate.getMonth();
              const currentYear = currentDate.getFullYear();
              const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
              const reportMonth = `${monthNames[currentMonth]}/${currentYear}`;
              
              let fullUrl = href;
              if (!href.startsWith('http')) {
                if (href.startsWith('/')) {
                  fullUrl = `https://relatoriosfiis.com.br${href}`;
                } else {
                  fullUrl = `https://relatoriosfiis.com.br/${href}`;
                }
              }
              
              reports.push({
                reportDate: new Date(currentYear, currentMonth, 1),
                reportMonth,
                reportUrl: fullUrl
              });
              
              console.log(`✅ Relatório encontrado via busca ampla: ${fullUrl}`);
              return false; // Para o loop
            }
          }
        });
      }
      
      // Se ainda não encontrou, tentar buscar na página principal de forma diferente
      if (reports.length === 0) {
        console.log(`🔍 Tentando busca na página principal...`);
        
        try {
          const mainPageResponse = await fetch("https://relatoriosfiis.com.br", {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            }
          });
          
          if (mainPageResponse.ok) {
            const mainHtml = await mainPageResponse.text();
            const $main = cheerio.load(mainHtml);
            
            // Buscar o ticker na página principal
            $main('table tr, tbody tr').each((_, row) => {
              const cells = $(row).find('td');
              if (cells.length >= 3) {
                const cell0 = $main(cells[0]).text().trim().toUpperCase();
                
                if (cell0 === ticker.toUpperCase() || cell0.includes(ticker.toUpperCase())) {
                  console.log(`🎯 ${ticker} encontrado na página principal`);
                  
                  // Buscar links na linha
                  $main(row).find('a').each((_, link) => {
                    const href = $main(link).attr('href') || '';
                    if (href.includes('downloadDocumento') || href.includes('.pdf')) {
                      const currentDate = new Date();
                      const currentMonth = currentDate.getMonth();
                      const currentYear = currentDate.getFullYear();
                      const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
                      const reportMonth = `${monthNames[currentMonth]}/${currentYear}`;
                      
                      let fullUrl = href;
                      if (!href.startsWith('http')) {
                        if (href.startsWith('/')) {
                          fullUrl = `https://relatoriosfiis.com.br${href}`;
                        } else {
                          fullUrl = `https://relatoriosfiis.com.br/${href}`;
                        }
                      }
                      
                      reports.push({
                        reportDate: new Date(currentYear, currentMonth, 1),
                        reportMonth,
                        reportUrl: fullUrl
                      });
                      
                      console.log(`✅ Relatório encontrado na página principal: ${fullUrl}`);
                      return false;
                    }
                  });
                  
                  return false; // Para o loop se encontrou
                }
              }
            });
          }
        } catch (error) {
          console.log(`Erro ao buscar página principal: ${error}`);
        }
      }
    }
    
    if (reports.length === 0) {
      return NextResponse.json({ 
        error: "Nenhum relatório encontrado para este fundo",
        ticker,
        fundId,
        debug: {
          rowsProcessed,
          searchedTicker: ticker.toUpperCase()
        }
      }, { status: 404 });
    }
    
    // Ordenar por data mais recente
    reports.sort((a, b) => b.reportDate.getTime() - a.reportDate.getTime());
    const latestReport = reports[0];
    
    console.log(`Relatório mais recente: ${latestReport.reportMonth}`);
    
    // Salvar ou atualizar o relatório mais recente no banco
    const existingReport = await db
      .select()
      .from(fiiReportTable)
      .where(and(
        eq(fiiReportTable.fundId, fundId),
        eq(fiiReportTable.reportMonth, latestReport.reportMonth)
      ))
      .limit(1);
    
    let savedReport;
    if (existingReport.length === 0) {
      // Inserir novo relatório
      const newReport = await db
        .insert(fiiReportTable)
        .values({
          fundId: fundId,
          reportDate: latestReport.reportDate,
          reportMonth: latestReport.reportMonth,
          reportUrl: latestReport.reportUrl,
        })
        .returning();
      
      savedReport = newReport[0];
    } else {
      savedReport = existingReport[0];
    }
    
    return NextResponse.json({
      ticker: ticker.toUpperCase(),
      fund: fund[0],
      latestReport: savedReport,
      totalReports: reports.length,
      allReports: reports.slice(0, 5) // Primeiros 5 para referência
    });
    
  } catch (error) {
    console.error("Erro ao buscar relatórios:", error);
    return NextResponse.json(
      { error: "Erro ao buscar relatórios", details: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    );
  }
}