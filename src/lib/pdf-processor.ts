/**
 * PDF Processing Service - FII Reports
 * 
 * Serviço para extrair texto de relatórios PDF de FII
 * Integrado com relatoriosfiis.com.br e sistema de AI
 */

// @ts-ignore - pdf-parse tem problemas com ES modules
const pdf = require('pdf-parse');

export interface PDFExtractionResult {
  success: boolean;
  text?: string;
  metadata?: {
    title?: string;
    pages?: number;
    fileSize?: number;
    author?: string;
    creationDate?: Date;
  };
  error?: string;
  processingTime?: number;
}

/**
 * Extrai texto de PDF a partir de URL ou Buffer
 */
export async function extractPDFText(
  source: string | Buffer,
  options: {
    maxPages?: number;
    cleanText?: boolean;
  } = {}
): Promise<PDFExtractionResult> {
  
  const startTime = Date.now();
  
  try {
    let pdfBuffer: Buffer;
    
    // Se source é uma URL, baixar o PDF
    if (typeof source === 'string') {
      console.log(`Baixando PDF: ${source}`);
      
      const response = await fetch(source, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Erro ao baixar PDF: ${response.status} ${response.statusText}`);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      pdfBuffer = Buffer.from(arrayBuffer);
    } else {
      pdfBuffer = source;
    }

    // Configuração do pdf-parse
    const parseOptions: any = {};
    
    if (options.maxPages) {
      parseOptions.max = options.maxPages;
    }

    // Extrair texto do PDF
    console.log('Extraindo texto do PDF...');
    const data = await pdf(pdfBuffer, parseOptions);
    
    let extractedText = data.text;
    
    // Limpeza e formatação do texto
    if (options.cleanText !== false) {
      extractedText = cleanPDFText(extractedText);
    }
    
    const processingTime = Date.now() - startTime;
    
    return {
      success: true,
      text: extractedText,
      metadata: {
        title: data.info?.Title,
        pages: data.numpages,
        fileSize: pdfBuffer.length,
        author: data.info?.Author,
        creationDate: data.info?.CreationDate,
      },
      processingTime
    };

  } catch (error) {
    console.error('Erro na extração de PDF:', error);
    
    const processingTime = Date.now() - startTime;
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido na extração',
      processingTime
    };
  }
}

/**
 * Limpa e formata o texto extraído do PDF
 */
export function cleanPDFText(rawText: string): string {
  if (!rawText) return '';
  
  return rawText
    // Remove quebras de linha excessivas
    .replace(/\n{3,}/g, '\n\n')
    // Remove espaços múltiplos
    .replace(/[ \t]{2,}/g, ' ')
    // Remove caracteres de controle
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // Normaliza quebras de linha
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    // Remove linhas com apenas espaços
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .join('\n')
    // Remove espaços no início e fim
    .trim();
}

/**
 * Identifica se o texto parece ser de um relatório FII
 */
export function validateFIIReport(text: string): {
  isValid: boolean;
  confidence: number;
  indicators: string[];
} {
  
  const indicators: string[] = [];
  let score = 0;
  
  // Termos que indicam relatório FII
  const fiiTerms = [
    'fundo de investimento imobiliário',
    'fundo imobiliário', 
    'fii',
    'relatório gerencial',
    'demonstração financeira',
    'patrimônio líquido',
    'receita de locação',
    'valor patrimonial',
    'dividend yield',
    'taxa de ocupação',
    'imóveis',
    'locação',
    'inquilino',
    'aluguel'
  ];
  
  for (const term of fiiTerms) {
    const regex = new RegExp(term, 'gi');
    const matches = text.match(regex);
    if (matches) {
      score += matches.length;
      indicators.push(`"${term}" encontrado ${matches.length}x`);
    }
  }
  
  // Verificações adicionais
  if (text.includes('CNPJ')) {
    score += 5;
    indicators.push('CNPJ encontrado');
  }
  
  if (text.match(/\d{2}\/\d{2}\/\d{4}/)) {
    score += 3;
    indicators.push('Datas encontradas');
  }
  
  if (text.match(/R\$\s*[\d.,]+/)) {
    score += 5;
    indicators.push('Valores monetários encontrados');
  }
  
  const confidence = Math.min(score / 20, 1); // Normaliza para 0-1
  const isValid = confidence > 0.3;
  
  return {
    isValid,
    confidence,
    indicators
  };
}

/**
 * Extrai informações específicas de FII do texto
 */
export function extractFIIMetrics(text: string): {
  ticker?: string;
  patrimonioLiquido?: number;
  dividendYield?: number;
  taxaOcupacao?: number;
  receita?: number;
  cnpj?: string;
  dataRelatorio?: string;
} {
  
  const metrics: any = {};
  
  // Busca por ticker (padrão XXXX11)
  const tickerMatch = text.match(/\b([A-Z]{4}\d{2})\b/);
  if (tickerMatch) {
    metrics.ticker = tickerMatch[1];
  }
  
  // Busca por CNPJ
  const cnpjMatch = text.match(/(\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2})/);
  if (cnpjMatch) {
    metrics.cnpj = cnpjMatch[1];
  }
  
  // Busca por valores monetários em contexto
  const valorPatrimonio = text.match(/patrimônio.{0,50}R\$\s*([\d.,]+)/i);
  if (valorPatrimonio) {
    metrics.patrimonioLiquido = parseFloat(valorPatrimonio[1].replace(/\./g, '').replace(',', '.'));
  }
  
  // Busca por yield
  const yieldMatch = text.match(/yield.{0,20}([\d,]+)%/i);
  if (yieldMatch) {
    metrics.dividendYield = parseFloat(yieldMatch[1].replace(',', '.'));
  }
  
  // Busca por taxa de ocupação
  const ocupacaoMatch = text.match(/ocupação.{0,20}([\d,]+)%/i);
  if (ocupacaoMatch) {
    metrics.taxaOcupacao = parseFloat(ocupacaoMatch[1].replace(',', '.'));
  }
  
  // Busca por datas
  const dataMatch = text.match(/(\d{2}\/\d{2}\/\d{4})/);
  if (dataMatch) {
    metrics.dataRelatorio = dataMatch[1];
  }
  
  return metrics;
}

/**
 * Processa múltiplos PDFs em lote
 */
export async function processBatchPDFs(
  pdfSources: Array<{ url: string; ticker?: string; }>,
  options: {
    maxConcurrent?: number;
    cleanText?: boolean;
    validateFII?: boolean;
  } = {}
): Promise<Array<{
  source: string;
  ticker?: string;
  result: PDFExtractionResult;
  validation?: ReturnType<typeof validateFIIReport>;
  metrics?: ReturnType<typeof extractFIIMetrics>;
}>> {
  
  const { maxConcurrent = 3, cleanText = true, validateFII = true } = options;
  const results: any[] = [];
  
  // Processa PDFs em lotes para evitar sobrecarga
  for (let i = 0; i < pdfSources.length; i += maxConcurrent) {
    const batch = pdfSources.slice(i, i + maxConcurrent);
    
    const batchResults = await Promise.all(
      batch.map(async (source) => {
        const result = await extractPDFText(source.url, { cleanText });
        
        let validation;
        let metrics;
        
        if (result.success && result.text && validateFII) {
          validation = validateFIIReport(result.text);
          metrics = extractFIIMetrics(result.text);
        }
        
        return {
          source: source.url,
          ticker: source.ticker,
          result,
          validation,
          metrics
        };
      })
    );
    
    results.push(...batchResults);
    
    // Pausa entre lotes para ser respeitoso com o servidor
    if (i + maxConcurrent < pdfSources.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  return results;
}
