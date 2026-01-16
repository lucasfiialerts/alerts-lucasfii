import * as cheerio from "cheerio";
import { and,eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { db } from "@/db";
import { fiiFundTable, fiiReportTable } from "@/db/schema";

interface FundData {
  ticker: string;
  name: string;
}

interface ReportData {
  reportDate: Date;
  reportMonth: string;
  reportUrl: string;
}

export async function POST(request: NextRequest) {
  try {
    console.log("Iniciando sincronização de FIIs...");
    
    // Fazer scraping da página principal
    const response = await fetch("https://relatoriosfiis.com.br", {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Erro ao acessar site: ${response.status}`);
    }
    
    const html = await response.text();
    const $ = cheerio.load(html);
    
    console.log("HTML carregado, iniciando parsing...");
    
    // Encontrar todas as linhas da tabela - tentativa mais robusta
    const fundsData: FundData[] = [];
    
    // Tentar diferentes seletores para capturar a tabela
    const tableSelectors = ['table tr', 'tbody tr', '.table tr', '[class*="table"] tr'];
    
    for (const selector of tableSelectors) {
      $(selector).each((_, row) => {
        const cells = $(row).find('td');
        
        if (cells.length >= 2) {
          const ticker = $(cells[0]).text().trim().toUpperCase();
          const name = $(cells[1]).text().trim();
          
          // Validar se é um ticker válido (formato XXXX11)
          const tickerPattern = /^[A-Z]{4}11$/;
          
          if (ticker && name && tickerPattern.test(ticker)) {
            // Evitar duplicatas
            const exists = fundsData.some(f => f.ticker === ticker);
            if (!exists) {
              fundsData.push({ ticker, name });
              console.log(`Fundo encontrado: ${ticker} - ${name}`);
            }
          }
        }
      });
      
      // Se encontrou fundos, pare de tentar outros seletores
      if (fundsData.length > 0) break;
    }
    
    console.log(`Encontrados ${fundsData.length} fundos`);
    
    // Adicionar fundos conhecidos para garantir cobertura completa
    console.log("Adicionando fundos conhecidos para garantir cobertura...");
    
    const knownFunds = [
      { ticker: "SAPI11", name: "SANTANDER PAPÉIS IMOBILIÁRIOS" },
      { ticker: "SADI11", name: "SANTANDER PAPÉIS IMOBILIÁRIOS CDI" },
      { ticker: "SARE11", name: "SANTANDER RENDA DE ALUGUÉIS" },
      { ticker: "LSAG11", name: "LESTE FUNDO DE INVESTIMENTO" },
      { ticker: "VTLT11", name: "VOTORANTIM FUNDO DE INVESTIMENTO" },
      { ticker: "GTWR11", name: "GREEN TOWERS FUNDO DE INVESTIMENTO" },
      { ticker: "BBRC11", name: "BB RENDA CORPORATIVA" },
      { ticker: "VSHO11", name: "VOTORANTIM SHOPPING" },
      { ticker: "HSML11", name: "HSI MALLS" },
      { ticker: "PDBM11", name: "PDB MALLS" },
      { ticker: "GZIT11", name: "GAZIT MALLS" },
      { ticker: "HGBS11", name: "HEDGE BRASIL SHOPPING" },
      { ticker: "WPLZ11", name: "WEST PLAZA SHOPPING" },
      { ticker: "HPDP11", name: "HEDGE SHOPPING PARQUE DOM PEDRO" },
      { ticker: "FVPQ11", name: "VIA PARQUE SHOPPING" },
      { ticker: "GGRC11", name: "GENERAL SHOPPING E OUTLETS" },
      { ticker: "VISC11", name: "VINCI SHOPPING CENTERS" },
      { ticker: "XPLG11", name: "XP LOG FUNDO DE INVESTIMENTO" },
      { ticker: "KNRI11", name: "KINEA RENDA IMOBILIÁRIA" },
      { ticker: "HGLG11", name: "HEDGE LOGÍSTICA" },
      { ticker: "MXRF11", name: "MAXI RENDA" },
      { ticker: "BCFF11", name: "BTG PACTUAL FUNDO DE FUNDOS" },
      { ticker: "HCRI11", name: "HEDGE REAL ESTATE DEVELOPMENT" },
      { ticker: "MALL11", name: "MULTIPLAN FUNDO DE INVESTIMENTO" },
      { ticker: "XPML11", name: "XP MALLS" },
      { ticker: "BTLG11", name: "BTG PACTUAL LOGÍSTICA" },
      { ticker: "FIIB11", name: "FII MAIS BRASIL" },
      { ticker: "RBVA11", name: "RBR ALPHA MULTIESTRATÉGIA" },
      { ticker: "RBRR11", name: "RBR RENDIMENTO" },
      { ticker: "VILG11", name: "VILLAGE FUNDO DE INVESTIMENTO" }
    ];
    
    // Adicionar fundos conhecidos que não foram encontrados via scraping
    for (const knownFund of knownFunds) {
      const exists = fundsData.some(f => f.ticker === knownFund.ticker);
      if (!exists) {
        fundsData.push(knownFund);
        console.log(`Fundo conhecido adicionado: ${knownFund.ticker}`);
      }
    }
    
    console.log(`Total final de fundos: ${fundsData.length}`);
    
    // Salvar fundos no banco de dados
    const savedFunds = [];
    for (const fundData of fundsData) {
      try {
        // Verificar se o fundo já existe
        const existingFund = await db
          .select()
          .from(fiiFundTable)
          .where(eq(fiiFundTable.ticker, fundData.ticker))
          .limit(1);
        
        if (existingFund.length === 0) {
          // Inserir novo fundo
          const newFund = await db
            .insert(fiiFundTable)
            .values({
              ticker: fundData.ticker,
              name: fundData.name,
            })
            .returning();
          
          savedFunds.push(newFund[0]);
        } else {
          // Atualizar nome se necessário
          const updatedFund = await db
            .update(fiiFundTable)
            .set({
              name: fundData.name,
              updatedAt: new Date(),
            })
            .where(eq(fiiFundTable.ticker, fundData.ticker))
            .returning();
          
          savedFunds.push(updatedFund[0]);
        }
      } catch (error) {
        console.error(`Erro ao processar fundo ${fundData.ticker}:`, error);
      }
    }
    
    return NextResponse.json({
      message: "Sincronização concluída",
      totalFunds: fundsData.length,
      savedFunds: savedFunds.length,
    });
    
  } catch (error) {
    console.error("Erro na sincronização:", error);
    return NextResponse.json(
      { error: "Erro ao sincronizar FIIs" },
      { status: 500 }
    );
  }
}

// API para buscar relatórios específicos de um fundo
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ticker = searchParams.get('ticker');
    
    if (!ticker) {
      return NextResponse.json({ error: "Ticker é obrigatório" }, { status: 400 });
    }
    
    console.log(`Buscando relatórios para ${ticker}...`);
    
    // Buscar relatórios na página principal filtrando por ticker
    const response = await fetch("https://relatoriosfiis.com.br", {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Erro ao acessar site: ${response.status}`);
    }
    
    const html = await response.text();
    const $ = cheerio.load(html);
    
    console.log("Procurando relatórios na página...");
    
    const reports: ReportData[] = [];
    
    // Buscar em todas as linhas da tabela
    $('table tr, tbody tr').each((_, row) => {
      const cells = $(row).find('td');
      
      if (cells.length >= 4) {
        const rowTicker = $(cells[0]).text().trim().toUpperCase();
        const reportMonth = $(cells[2]).text().trim();
        
        // Se é o ticker que estamos procurando
        if (rowTicker === ticker.toUpperCase()) {
          // Buscar link "Ver" ou "Baixar"
          const viewLink = $(cells[3]).find('a').first();
          const reportUrl = viewLink.attr('href') || '';
          
          if (reportMonth && reportUrl) {
            // Converter mês/ano para data
            let reportDate: Date;
            try {
              // Formatos: "Nov/2025", "Set/2025", etc.
              const [monthStr, yearStr] = reportMonth.split('/');
              const monthNames = {
                'Jan': 0, 'Fev': 1, 'Mar': 2, 'Abr': 3, 'Mai': 4, 'Jun': 5,
                'Jul': 6, 'Ago': 7, 'Set': 8, 'Out': 9, 'Nov': 10, 'Dez': 11
              };
              const month = (monthNames as any)[monthStr] ?? 0;
              const year = parseInt(yearStr);
              reportDate = new Date(year, month, 1);
            } catch (error) {
              console.warn(`Erro ao processar data ${reportMonth}:`, error);
              reportDate = new Date();
            }
            
            reports.push({
              reportDate,
              reportMonth,
              reportUrl: reportUrl.startsWith('http') ? reportUrl : `https://relatoriosfiis.com.br${reportUrl}`
            });
            
            console.log(`Relatório encontrado: ${reportMonth} - ${reportUrl}`);
          }
        }
      }
    });
    
    if (reports.length === 0) {
      return NextResponse.json({ 
        error: "Nenhum relatório encontrado para este fundo",
        ticker 
      }, { status: 404 });
    }
    
    // Ordenar por data mais recente
    reports.sort((a, b) => b.reportDate.getTime() - a.reportDate.getTime());
    const latestReport = reports[0];
    
    console.log(`Relatório mais recente: ${latestReport.reportMonth}`);
    
    // Buscar o fundo no banco para pegar o ID
    const fund = await db
      .select()
      .from(fiiFundTable)
      .where(eq(fiiFundTable.ticker, ticker.toUpperCase()))
      .limit(1);
    
    if (fund.length === 0) {
      return NextResponse.json({ 
        error: "Fundo não encontrado no banco de dados",
        ticker 
      }, { status: 404 });
    }
    
    // Salvar ou atualizar o relatório mais recente no banco
    const existingReport = await db
      .select()
      .from(fiiReportTable)
      .where(and(
        eq(fiiReportTable.fundId, fund[0].id),
        eq(fiiReportTable.reportMonth, latestReport.reportMonth)
      ))
      .limit(1);
    
    let savedReport;
    if (existingReport.length === 0) {
      // Inserir novo relatório
      const newReport = await db
        .insert(fiiReportTable)
        .values({
          fundId: fund[0].id,
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
