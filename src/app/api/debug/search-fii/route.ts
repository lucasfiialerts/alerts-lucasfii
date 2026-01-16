import * as cheerio from 'cheerio';
import { NextResponse } from 'next/server';

interface FIIReport {
  ticker: string;
  fundName: string;
  reportMonth: string;
  reportUrl: string;
  page: number;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const ticker = searchParams.get('ticker');
    const maxPages = parseInt(searchParams.get('maxPages') || '10');
    
    if (!ticker) {
      return NextResponse.json({ error: "Ticker é obrigatório" }, { status: 400 });
    }
    
    console.log(`🔍 Buscando ${ticker} em até ${maxPages} páginas...`);
    
    const reports: FIIReport[] = [];
    let pageFound = false;
    
    for (let page = 1; page <= maxPages && !pageFound; page++) {
      console.log(`📄 Verificando página ${page}...`);
      
      try {
        const url = page === 1 ? 
          "https://relatoriosfiis.com.br" : 
          `https://relatoriosfiis.com.br/?page=${page}`;
          
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
          }
        });
        
        if (!response.ok) {
          console.log(`❌ Página ${page} falhou: ${response.status}`);
          continue;
        }
        
        const html = await response.text();
        const $ = cheerio.load(html);
        
        // Procurar o ticker na página atual
        let foundInThisPage = false;
        
        $('table tr, tbody tr').each((_, row) => {
          const cells = $(row).find('td');
          
          if (cells.length >= 3) {
            const cell0 = $(cells[0]).text().trim().toUpperCase();
            const cell1 = $(cells[1]).text().trim();
            const cell2 = $(cells[2]).text().trim();
            
            if (cell0 === ticker.toUpperCase()) {
              foundInThisPage = true;
              pageFound = true;
              console.log(`🎯 ${ticker} encontrado na página ${page}!`);
              console.log(`    Fundo: ${cell1}`);
              console.log(`    Mês: ${cell2}`);
              
              // Buscar links na linha
              let reportUrl = '';
              $(row).find('a').each((_, link) => {
                const href = $(link).attr('href') || '';
                const linkText = $(link).text().trim().toLowerCase();
                
                if (href && (
                  href.includes('downloadDocumento') || 
                  href.includes('exibirDocumento') ||
                  linkText.includes('ver') ||
                  linkText.includes('baixar')
                )) {
                  if (!href.startsWith('http')) {
                    reportUrl = href.startsWith('/') ? 
                      `https://fnet.bmfbovespa.com.br${href}` : 
                      `https://fnet.bmfbovespa.com.br/${href}`;
                  } else {
                    reportUrl = href;
                  }
                  
                  console.log(`    📄 PDF Link: ${reportUrl}`);
                  return false; // Para o loop
                }
              });
              
              if (reportUrl) {
                reports.push({
                  ticker: cell0,
                  fundName: cell1,
                  reportMonth: cell2,
                  reportUrl,
                  page
                });
              }
              
              return false; // Para o loop da tabela
            }
          }
        });
        
        if (foundInThisPage) {
          break;
        }
        
        // Verificar se há próxima página
        const hasNext = html.includes('Próxima') || html.includes('próxima');
        if (!hasNext) {
          console.log(`📚 Última página: ${page}`);
          break;
        }
        
      } catch (error) {
        console.log(`❌ Erro na página ${page}: ${error}`);
        continue;
      }
    }
    
    if (reports.length === 0) {
      return NextResponse.json({
        error: `${ticker} não encontrado`,
        searchedPages: pageFound ? 'Encontrado mas sem PDF' : 'Não encontrado',
        ticker: ticker.toUpperCase()
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      ticker: ticker.toUpperCase(),
      reports,
      totalReports: reports.length,
      foundOnPage: reports[0]?.page
    });
    
  } catch (error) {
    console.error("Erro na busca:", error);
    return NextResponse.json(
      { error: "Erro na busca", details: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    );
  }
}