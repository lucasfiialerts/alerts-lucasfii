export interface BrapiFiiData {
  symbol: string;
  shortName: string;
  longName: string;
  currency: string;
  regularMarketPrice: number;
  regularMarketDayHigh: number;
  regularMarketDayLow: number;
  regularMarketDayRange: string;
  regularMarketChange: number;
  regularMarketChangePercent: number;
  regularMarketTime: string;
  marketCap: number;
  regularMarketVolume: number;
  regularMarketPreviousClose: number;
  fiftyTwoWeekLow: number;
  fiftyTwoWeekHigh: number;
  priceEarnings: number;
  earningsPerShare: number;
  logourl: string;
  dividendsData?: {
    cashDividends: DividendData[];
    stockDividends: DividendData[];
    subscriptions: any[];
  };
}

export interface DividendData {
  assetIssued: string;
  paymentDate: string;
  rate: number;
  relatedTo: string;
  approvedOn: string | null;
  isinCode: string;
  label: string;
  lastDatePrior: string;
  remarks: string;
}

export interface BrapiResponse {
  results: BrapiFiiData[];
  requestedAt: string;
  took: string;
}

export class BrapiService {
  private baseURL = 'https://brapi.dev/api';
  private token: string;

  constructor() {
    this.token = process.env.BRAPI_TOKEN || process.env.NEXT_PUBLIC_BRAPI_TOKEN || '';
    
    if (!this.token) {
      throw new Error('BRAPI_TOKEN não configurado nas variáveis de ambiente');
    }
  }

  /**
   * Busca dados de um ou vários FIIs
   * @param tickers - Array de tickers dos FIIs (ex: ['VTLT11', 'SAPI11'])
   * @returns Dados dos FIIs
   */
  async getFiiData(tickers: string[], retryCount = 0): Promise<BrapiFiiData[]> {
    const tickersString = tickers.join(',');
    const maxRetries = 3;
    const timeoutMs = 15000; // 15 segundos
    
    const url = `${this.baseURL}/quote/${tickersString}?token=${this.token}`;
    
    console.log(`🔍 Buscando dados da BRAPI para: ${tickersString} (tentativa ${retryCount + 1}/${maxRetries + 1})`);
    
    try {
      // Criar controller para timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        // Se for erro 500 da BRAPI e ainda temos tentativas, fazer retry
        if (response.status === 500 && retryCount < maxRetries) {
          console.log(`⚠️ BRAPI retornou erro 500, tentando novamente em ${(retryCount + 1) * 2} segundos...`);
          await new Promise(resolve => setTimeout(resolve, (retryCount + 1) * 2000));
          return this.getFiiData(tickers, retryCount + 1);
        }
        
        throw new Error(`Erro na BRAPI: ${response.status} - ${response.statusText}`);
      }

      const data: BrapiResponse = await response.json();
      
      console.log(`✅ Dados recebidos para ${data.results.length} FIIs`);
      
      return data.results;
      
    } catch (error) {
      // Se for timeout ou erro de rede e ainda temos tentativas, fazer retry
      if ((error instanceof Error && (error.name === 'AbortError' || error.message.includes('fetch'))) && retryCount < maxRetries) {
        console.log(`⚠️ Timeout/erro de rede na BRAPI, tentando novamente em ${(retryCount + 1) * 2} segundos...`);
        await new Promise(resolve => setTimeout(resolve, (retryCount + 1) * 2000));
        return this.getFiiData(tickers, retryCount + 1);
      }
      
      console.error('❌ Erro ao buscar dados da BRAPI:', error);
      throw error;
    }
  }

  /**
   * Busca dados de um único FII
   * @param ticker - Ticker do FII (ex: 'VTLT11')
   * @returns Dados do FII
   */
  async getSingleFiiData(ticker: string): Promise<BrapiFiiData | null> {
    const results = await this.getFiiData([ticker]);
    return results.length > 0 ? results[0] : null;
  }

  /**
   * Formata o preço para exibição
   * @param price - Preço em número
   * @returns Preço formatado (ex: "R$ 87,17")
   */
  static formatPrice(price: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  }

  /**
   * Formata a variação percentual
   * @param variation - Variação em percentual
   * @returns Variação formatada (ex: "+2.01%" ou "-1.50%")
   */
  static formatVariation(variation: number): string {
    const sign = variation >= 0 ? '+' : '';
    return `${sign}${variation.toFixed(2)}%`;
  }

  /**
   * Retorna emoji baseado na variação
   * @param variation - Variação em percentual
   * @returns Emoji apropriado
   */
  static getVariationEmoji(variation: number): string {
    if (variation > 2) return '🚀'; // Alta forte
    if (variation > 0) return '📈'; // Alta
    if (variation > -2) return '📉'; // Queda leve
    return '🔻'; // Queda forte
  }

  /**
   * Busca dados de dividendos de um ou vários FIIs
   * @param tickers - Array de tickers dos FIIs (ex: ['VTLT11', 'SAPI11'])
   * @returns Dados dos FIIs com informações de dividendos
   */
  async getFiiDividends(tickers: string[], retryCount = 0): Promise<BrapiFiiData[]> {
    const tickersString = tickers.join(',');
    const maxRetries = 3;
    const timeoutMs = 15000; // 15 segundos
    
    console.log(`🔍 [BrAPI] Buscando dividendos para: ${tickersString}`);
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
      
      const response = await fetch(
        `${this.baseURL}/quote/${tickersString}?dividends=true&token=${this.token}`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'LucasFIIAlerts/1.0',
          },
          signal: controller.signal,
        }
      );
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        if (response.status === 429 && retryCount < maxRetries) {
          const waitTime = Math.pow(2, retryCount) * 1000;
          console.log(`⏳ [BrAPI] Rate limit, aguardando ${waitTime}ms...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          return this.getFiiDividends(tickers, retryCount + 1);
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data: BrapiResponse = await response.json();
      
      if (!data.results || !Array.isArray(data.results)) {
        throw new Error('Resposta da BrAPI em formato inválido');
      }
      
      console.log(`✅ [BrAPI] ${data.results.length} ativos com dados de dividendos recebidos`);
      return data.results;
      
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.error(`⏰ [BrAPI] Timeout após ${timeoutMs}ms para ${tickersString}`);
        throw new Error('Timeout na requisição para BrAPI');
      }
      
      if (retryCount < maxRetries) {
        const waitTime = Math.pow(2, retryCount) * 1000;
        console.log(`🔄 [BrAPI] Erro, tentativa ${retryCount + 1}/${maxRetries} em ${waitTime}ms...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        return this.getFiiDividends(tickers, retryCount + 1);
      }
      
      console.error('❌ [BrAPI] Erro após todas as tentativas:', error);
      throw error;
    }
  }

  /**
   * Verifica se uma variação é significativa para gerar alerta
   * @param variation - Variação em percentual
   * @param threshold - Threshold mínimo (padrão: 1%)
   * @returns Se deve gerar alerta
   */
  static shouldAlert(variation: number, threshold: number = 1): boolean {
    return Math.abs(variation) >= threshold;
  }
}

export const brapiService = new BrapiService();
