import * as cheerio from "cheerio";
import { desc,ilike } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { db } from "@/db";
import { fiiFundTable } from "@/db/schema";

interface FundData {
  id: string;
  ticker: string;
  name: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const limit = parseInt(searchParams.get('limit') || '50');
    
    let funds: FundData[] = [];
    
    if (search) {
      // Primeiro, buscar no banco de dados local
      const localFunds = await db
        .select()
        .from(fiiFundTable)
        .where(ilike(fiiFundTable.ticker, `%${search}%`))
        .orderBy(desc(fiiFundTable.ticker))
        .limit(limit);
      
      funds = localFunds;
      
      // Se não encontrou muitos resultados no banco local, buscar no site
      if (localFunds.length < 5 && search.length >= 2) {
        console.log(`🔍 Buscando "${search}" no site relatoriosfiis.com.br...`);
        
        try {
          const searchUrl = `https://relatoriosfiis.com.br/?q=${encodeURIComponent(search)}`;
          const response = await fetch(searchUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
              'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
            }
          });
          
          if (response.ok) {
            const html = await response.text();
            const $ = cheerio.load(html);
            
            const siteFunds: FundData[] = [];
            const processedTickers = new Set(localFunds.map(f => f.ticker.toUpperCase()));
            
            // Buscar na tabela do site
            $('table tr, tbody tr').each((_, row) => {
              const cells = $(row).find('td');
              
              if (cells.length >= 2) {
                const ticker = $(cells[0]).text().trim().toUpperCase();
                const name = $(cells[1]).text().trim();
                
                // Verificar se o ticker contém o termo de busca e não está duplicado
                if (ticker && name && 
                    ticker.includes(search.toUpperCase()) && 
                    !processedTickers.has(ticker) &&
                    siteFunds.length < 10) {
                  
                  siteFunds.push({
                    id: `site-${ticker.toLowerCase()}`, // ID temporário para o site
                    ticker,
                    name,
                  });
                  
                  processedTickers.add(ticker);
                  console.log(`✅ Encontrado no site: ${ticker} - ${name}`);
                }
              }
            });
            
            // Combinar resultados locais + site
            funds = [...localFunds, ...siteFunds];
            console.log(`📊 Total encontrado: ${localFunds.length} local + ${siteFunds.length} site = ${funds.length}`);
          }
        } catch (error) {
          console.error('❌ Erro ao buscar no site:', error);
          // Em caso de erro, usar apenas resultados locais
        }
      }
    } else {
      // Se não há busca, retornar do banco local
      funds = await db
        .select()
        .from(fiiFundTable)
        .orderBy(desc(fiiFundTable.ticker))
        .limit(limit);
    }
    
    // Limitar resultado final
    const finalFunds = funds.slice(0, limit);
    
    return NextResponse.json({
      funds: finalFunds,
      total: finalFunds.length,
      sources: {
        local: finalFunds.filter(f => !f.id.startsWith('site-')).length,
        site: finalFunds.filter(f => f.id.startsWith('site-')).length,
      }
    });
    
  } catch (error) {
    console.error("Erro ao buscar fundos:", error);
    return NextResponse.json(
      { error: "Erro ao buscar fundos" },
      { status: 500 }
    );
  }
}