/**
 * Status Invest Web Scraping Service
 * 
 * Busca comunicados de FIIs via Status Invest
 * Os dados são extraídos do atributo data-page que contém JSON
 */

export interface ComunicadoStatusInvest {
  id: number;
  assetMainId: number;
  ticker: string;
  description: string;
  dataEntrega: string;
  dataReferencia: string;
  status: number;
  statusName: string;
  link: string;
  fnetDocId: string;
  categoria: string;
  tipo: string;
}

// Decodificar entidades HTML
function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#xF3;/g, 'ó')
    .replace(/&#xE7;/g, 'ç')
    .replace(/&#xE3;/g, 'ã')
    .replace(/&#xF5;/g, 'õ')
    .replace(/&#xE9;/g, 'é')
    .replace(/&#xE1;/g, 'á')
    .replace(/&#xED;/g, 'í')
    .replace(/&#xFA;/g, 'ú')
    .replace(/&#xE0;/g, 'à')
    .replace(/&#xEA;/g, 'ê')
    .replace(/&#xF4;/g, 'ô');
}

// Extrair ID do documento FNET do link
function extractFnetDocId(link: string): string {
  const match = link.match(/id=(\d+)/);
  return match ? match[1] : '';
}

// Extrair categoria e tipo do description
function parseDescription(description: string): { categoria: string; tipo: string } {
  const parts = description.split(', ');
  return {
    categoria: parts[0] || '',
    tipo: parts.slice(1).join(', ') || ''
  };
}

/**
 * Busca comunicados de um FII via Status Invest
 */
export async function getComunicadosStatusInvest(ticker: string): Promise<ComunicadoStatusInvest[]> {
  const tickerUpper = ticker.toUpperCase();
  const url = `https://statusinvest.com.br/fundos-imobiliarios/${ticker.toLowerCase()}`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
      }
    });
    
    if (!response.ok) {
      console.error(`[StatusInvest] Erro ao buscar ${tickerUpper}: HTTP ${response.status}`);
      return [];
    }
    
    const html = await response.text();
    
    // Extrair data-page que contém JSON dos comunicados
    const dataPageMatch = html.match(/data-page="\[([^\]]+)\]"/);
    
    if (!dataPageMatch) {
      console.log(`[StatusInvest] Dados de comunicados não encontrados para ${tickerUpper}`);
      return [];
    }
    
    // Decodificar e parsear JSON
    const jsonStr = '[' + decodeHtmlEntities(dataPageMatch[1]) + ']';
    
    let rawComunicados: any[] = [];
    try {
      rawComunicados = JSON.parse(jsonStr);
    } catch (e) {
      console.error(`[StatusInvest] Erro ao parsear JSON para ${tickerUpper}:`, e);
      return [];
    }
    
    // Mapear para nosso formato
    const comunicados: ComunicadoStatusInvest[] = rawComunicados.map(raw => {
      const { categoria, tipo } = parseDescription(raw.description || '');
      return {
        id: raw.id,
        assetMainId: raw.assetMainId,
        ticker: tickerUpper,
        description: raw.description,
        dataEntrega: raw.dataEntrega,
        dataReferencia: raw.dataReferencia,
        status: raw.status,
        statusName: raw.statusName,
        link: raw.link?.replace(/&amp;/g, '&') || '',
        fnetDocId: extractFnetDocId(raw.link || ''),
        categoria,
        tipo
      };
    });
    
    console.log(`[StatusInvest] Encontrados ${comunicados.length} comunicados para ${tickerUpper}`);
    return comunicados;
    
  } catch (error) {
    console.error(`[StatusInvest] Erro ao buscar ${tickerUpper}:`, error);
    return [];
  }
}

/**
 * Busca comunicados recentes de um FII (últimos N dias)
 */
export async function getComunicadosRecentes(
  ticker: string,
  diasAtras: number = 7
): Promise<ComunicadoStatusInvest[]> {
  const comunicados = await getComunicadosStatusInvest(ticker);
  
  const dataLimite = new Date();
  dataLimite.setDate(dataLimite.getDate() - diasAtras);
  
  return comunicados.filter(com => {
    // Parsear data no formato DD/MM/YYYY
    const partes = com.dataEntrega.split('/');
    if (partes.length !== 3) return false;
    
    const dataEntrega = new Date(
      parseInt(partes[2]), // ano
      parseInt(partes[1]) - 1, // mês (0-indexed)
      parseInt(partes[0]) // dia
    );
    
    return dataEntrega >= dataLimite;
  });
}

/**
 * Busca comunicados de múltiplos FIIs
 */
export async function getComunicadosMultiplosFIIs(
  tickers: string[],
  diasAtras: number = 7
): Promise<ComunicadoStatusInvest[]> {
  const todosComumicados: ComunicadoStatusInvest[] = [];
  
  for (const ticker of tickers) {
    const comunicados = await getComunicadosRecentes(ticker, diasAtras);
    todosComumicados.push(...comunicados);
  }
  
  // Ordenar por data de entrega (mais recente primeiro)
  return todosComumicados.sort((a, b) => {
    const parseDate = (dateStr: string) => {
      const partes = dateStr.split('/');
      return new Date(
        parseInt(partes[2]),
        parseInt(partes[1]) - 1,
        parseInt(partes[0])
      );
    };
    return parseDate(b.dataEntrega).getTime() - parseDate(a.dataEntrega).getTime();
  });
}

/**
 * Formatar comunicado para WhatsApp
 */
export function formatComunicadoForWhatsApp(comunicado: ComunicadoStatusInvest): string {
  const emoji = getEmojiForCategoria(comunicado.categoria);
  
  return `${emoji} *${comunicado.ticker}*\n` +
         `📄 ${comunicado.description}\n` +
         `📅 Entrega: ${comunicado.dataEntrega}\n` +
         `📆 Referência: ${comunicado.dataReferencia}\n` +
         `🔗 ${comunicado.link}`;
}

/**
 * Formatar lista de comunicados para WhatsApp
 */
export function formatComunicadosForWhatsApp(comunicados: ComunicadoStatusInvest[]): string {
  if (comunicados.length === 0) {
    return '📭 Nenhum comunicado recente encontrado.';
  }
  
  const header = `📢 *COMUNICADOS DE FIIs*\n\n`;
  
  const items = comunicados.map((com, i) => {
    const emoji = getEmojiForCategoria(com.categoria);
    return `${i + 1}. ${emoji} *${com.ticker}*\n` +
           `   ${com.tipo || com.description}\n` +
           `   📅 ${com.dataEntrega}\n` +
           `   🔗 ${com.link}`;
  }).join('\n\n');
  
  const footer = `\n\n━━━━━━━━━━━━━━━━━━━━━━━━\n` +
                 `🌐 Acompanhe em: https://lucasfiialerts.com.br\n\n` +
                 `Este é um alerta automático baseado nas suas configurações.`;
  
  return header + items + footer;
}

function getEmojiForCategoria(categoria: string): string {
  const lower = categoria.toLowerCase();
  if (lower.includes('relatório')) return '📊';
  if (lower.includes('informe')) return '📋';
  if (lower.includes('aviso')) return '📣';
  if (lower.includes('fato relevante')) return '⚠️';
  if (lower.includes('assembleia')) return '🏛️';
  if (lower.includes('comunicado')) return '📢';
  if (lower.includes('regulamento')) return '📜';
  return '📄';
}

/**
 * Filtrar apenas relatórios (sem informes periódicos e avisos de rendimentos)
 */
export function filtrarApenasRelatorios(comunicados: ComunicadoStatusInvest[]): ComunicadoStatusInvest[] {
  return comunicados.filter(com => {
    const cat = com.categoria.toLowerCase();
    const tipo = com.tipo.toLowerCase();
    
    // Incluir apenas relatórios gerenciais e similares
    return cat.includes('relatório') && 
           (tipo.includes('gerencial') || 
            tipo.includes('rating') ||
            tipo.includes('anual'));
  });
}
