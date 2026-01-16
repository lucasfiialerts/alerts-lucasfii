import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { 
  fiiFundTable,
  fiiAlertLogTable,
  fiiPriceHistoryTable, 
  userFiiFollowTable,
  userTable
} from "@/db/schema";
import { BrapiFiiData, brapiService, BrapiService } from "@/lib/brapi";

export interface FiiAlert {
  userId: string;
  fundId: string;
  ticker: string;
  name: string;
  price: number;
  variation: number;
  message: string;
  alertType: 'price_variation' | 'patrimonio_liquido' | 'reavaliacao';
  // Dados adicionais opcionais
  additionalData?: {
    volume?: number;
    patrimonioLiquido?: number;
    valorPatrimonial?: number;
    competencia?: string;
    reavaliacao?: {
      variacao: number;
      data: string;
    };
  };
}

export interface FiiExtendedData extends BrapiFiiData {
  // Dados extras que podem vir de outras fontes
  patrimonioLiquido?: number;
  valorPatrimonial?: number;
  competenciaReavaliacao?: string;
  variacaoReavaliacao?: number;
}

export class FiiAlertService {
  
  /**
   * Busca dados estendidos de FII (incluindo dados adicionais)
   */
  async getExtendedFiiData(ticker: string): Promise<FiiExtendedData | null> {
    try {
      // Buscar dados básicos da BRAPI
      const basicData = await brapiService.getSingleFiiData(ticker);
      
      if (!basicData) {
        return null;
      }

      // Aqui podemos adicionar outras fontes de dados no futuro
      const extendedData: FiiExtendedData = {
        ...basicData,
        // Dados mockados por enquanto - no futuro integrar com APIs específicas
        patrimonioLiquido: this.getMockPatrimonioLiquido(ticker),
        valorPatrimonial: this.getMockValorPatrimonial(ticker),
        competenciaReavaliacao: this.getMockCompetencia(),
        variacaoReavaliacao: this.getMockVariacaoReavaliacao(ticker)
      };

      return extendedData;
      
    } catch (error) {
      console.error(`❌ Erro ao buscar dados estendidos para ${ticker}:`, error);
      return null;
    }
  }

  /**
   * Dados mockados - no futuro substituir por APIs reais
   */
  private getMockPatrimonioLiquido(ticker: string): number | undefined {
    // Mock baseado em dados típicos de FIIs
    const mockData: Record<string, number> = {
      'GGRC11': 2.41,   // 2.41 bi
      'BTLG11': 5.2,    // 5.2 bi
      'HGBS11': 1.8,    // 1.8 bi
      'VTLT11': 3.5,    // 3.5 bi
      'SAPI11': 2.9,    // 2.9 bi
      'HGLG11': 4.1,    // 4.1 bi (HEDGE LOGÍSTICA)
      'KNIP11': 1.2,    // 1.2 bi
      'XPLG11': 2.8,    // 2.8 bi
      'MXRF11': 6.5,    // 6.5 bi
      'VISC11': 1.9,    // 1.9 bi
    };
    
    return mockData[ticker];
  }

  private getMockValorPatrimonial(ticker: string): number | undefined {
    // Mock baseado em VP típicos
    const mockData: Record<string, number> = {
      'GGRC11': 11.237676,
      'BTLG11': 105.23,
      'HGBS11': 21.45,
      'VTLT11': 89.12,
      'SAPI11': 9.34,
      'HGLG11': 162.45,    // HEDGE LOGÍSTICA
      'KNIP11': 88.76,
      'XPLG11': 95.89,
      'MXRF11': 10.12,
      'VISC11': 97.65,
    };
    
    return mockData[ticker];
  }

  private getMockCompetencia(): string {
    // Retorna o mês anterior como competência
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  }

  private getMockVariacaoReavaliacao(ticker: string): number | undefined {
    // Mock de variação da reavaliação patrimonial
    const mockData: Record<string, number> = {
      'GGRC11': 0.7214,
      'BTLG11': 1.2,
      'HGBS11': -0.5,
      'VTLT11': 0.3,
      'SAPI11': 2.1,
      'HGLG11': 1.85,     // HEDGE LOGÍSTICA
      'KNIP11': 0.65,
      'XPLG11': -0.8,
      'MXRF11': 2.45,
      'VISC11': 0.92,
    };
    
    return mockData[ticker];
  }
  
  /**
   * Busca os FIIs seguidos por um usuário
   */
  async getUserFollowedFiis(userId: string) {
    return await db
      .select({
        id: userFiiFollowTable.id,
        fundId: userFiiFollowTable.fundId,
        ticker: fiiFundTable.ticker,
        name: fiiFundTable.name,
        notificationsEnabled: userFiiFollowTable.notificationsEnabled,
        priceAlertEnabled: userFiiFollowTable.priceAlertEnabled,
        minVariationPercent: userFiiFollowTable.minVariationPercent,
        alertFrequency: userFiiFollowTable.alertFrequency,
      })
      .from(userFiiFollowTable)
      .innerJoin(fiiFundTable, eq(userFiiFollowTable.fundId, fiiFundTable.id))
      .where(
        and(
          eq(userFiiFollowTable.userId, userId),
          eq(userFiiFollowTable.notificationsEnabled, true),
          eq(userFiiFollowTable.priceAlertEnabled, true)
        )
      );
  }

  /**
   * Busca todos os usuários que seguem FIIs com alertas habilitados
   */
  async getAllUsersWithAlerts() {
    return await db
      .select({
        userId: userFiiFollowTable.userId,
        fundId: userFiiFollowTable.fundId,
        ticker: fiiFundTable.ticker,
        name: fiiFundTable.name,
        minVariationPercent: userFiiFollowTable.minVariationPercent,
        alertFrequency: userFiiFollowTable.alertFrequency,
        // Preferências de alertas do usuário
        alertPreferencesReports: userTable.alertPreferencesReports,
        alertPreferencesVariation: userTable.alertPreferencesVariation,
      })
      .from(userFiiFollowTable)
      .innerJoin(fiiFundTable, eq(userFiiFollowTable.fundId, fiiFundTable.id))
      .innerJoin(userTable, eq(userFiiFollowTable.userId, userTable.id))
      .where(
        and(
          eq(userFiiFollowTable.notificationsEnabled, true),
          eq(userFiiFollowTable.priceAlertEnabled, true),
          eq(userTable.alertPreferencesVariation, true) // Só buscar usuários que têm "Variação de Preço" ativado
        )
      );
  }

  /**
   * Salva o histórico de preços de um FII
   */
  async savePriceHistory(fundId: string, fiiData: BrapiFiiData) {
    await db.insert(fiiPriceHistoryTable).values({
      fundId,
      price: fiiData.regularMarketPrice.toString(),
      variation: fiiData.regularMarketChangePercent?.toString(),
      volume: fiiData.regularMarketVolume?.toString(),
      marketCap: fiiData.marketCap?.toString(),
      recordDate: new Date(),
    });
  }

  /**
   * Busca o último preço registrado de um FII
   */
  async getLastPrice(fundId: string) {
    const lastRecord = await db
      .select()
      .from(fiiPriceHistoryTable)
      .where(eq(fiiPriceHistoryTable.fundId, fundId))
      .orderBy(desc(fiiPriceHistoryTable.recordDate))
      .limit(1);

    return lastRecord[0] || null;
  }

  /**
   * Verifica se deve gerar alerta baseado na variação
   */
  shouldGenerateAlert(
    variation: number, 
    minVariationPercent: string,
    lastAlertTime?: Date
  ): boolean {
    const threshold = parseFloat(minVariationPercent);
    const hasSignificantVariation = Math.abs(variation) >= threshold;
    
    // Evitar spam de alertas - só alertar se passou mais de 1 hora do último alerta
    if (lastAlertTime) {
      const hoursSinceLastAlert = (Date.now() - lastAlertTime.getTime()) / (1000 * 60 * 60);
      if (hoursSinceLastAlert < 1) {
        return false;
      }
    }
    
    return hasSignificantVariation;
  }

  /**
   * Cria mensagem de alerta formatada (versão completa com dados estendidos)
   */
  createAlertMessage(ticker: string, name: string, fiiData: BrapiFiiData, extendedData?: FiiExtendedData): string {
    const emoji = BrapiService.getVariationEmoji(fiiData.regularMarketChangePercent);
    const formattedPrice = BrapiService.formatPrice(fiiData.regularMarketPrice);
    const formattedVariation = BrapiService.formatVariation(fiiData.regularMarketChangePercent);
    
    // Título dinâmico baseado na variação
    const alertTitle = fiiData.regularMarketChangePercent >= 0 ? 
      '*📈 Alerta de Alta!*' : 
      '*📉 Alerta de Baixa!*';

    // Informações adicionais disponíveis
    const dayRange = fiiData.regularMarketDayRange || 'N/A';
    const volume = fiiData.regularMarketVolume ? 
      new Intl.NumberFormat('pt-BR').format(fiiData.regularMarketVolume) : 
      'N/A';
    
    // Faixa de 52 semanas
    const fiftyTwoWeekInfo = (fiiData.fiftyTwoWeekLow && fiiData.fiftyTwoWeekHigh) ?
      `${BrapiService.formatPrice(fiiData.fiftyTwoWeekLow)} - ${BrapiService.formatPrice(fiiData.fiftyTwoWeekHigh)}` :
      'N/A';

    // Seção de dados estendidos
    let extendedInfo = '';
    if (extendedData) {
      extendedInfo = '\n💼 *Informações Patrimoniais:*';
      
      if (extendedData.valorPatrimonial) {
        extendedInfo += `\n• VP atual: R$ ${extendedData.valorPatrimonial.toFixed(6)}`;
      }
      
      if (extendedData.patrimonioLiquido) {
        extendedInfo += `\n• Pat. Líquido: R$ ${extendedData.patrimonioLiquido.toFixed(2)} bi`;
      }
      
      if (extendedData.competenciaReavaliacao) {
        extendedInfo += `\n• Competência: ${extendedData.competenciaReavaliacao}`;
      }
      
      if (extendedData.variacaoReavaliacao !== undefined) {
        const reavaliacaoEmoji = extendedData.variacaoReavaliacao >= 0 ? '📈' : '📉';
        extendedInfo += `\n• ${reavaliacaoEmoji} Reavaliação: ${extendedData.variacaoReavaliacao > 0 ? '+' : ''}${extendedData.variacaoReavaliacao.toFixed(4)}%`;
      }
    }

    return `${emoji} ${alertTitle}

📊 *${ticker}*
💰 *Cotação atual:* ${formattedPrice}
📈 *Variação hoje:* ${formattedVariation}
📊 *Volume negociado:* ${volume}

📋 *Informações de Mercado:*
• Faixa do dia: R$ ${dayRange}
• Faixa 52 semanas: ${fiftyTwoWeekInfo}
• Fechamento anterior: ${BrapiService.formatPrice(fiiData.regularMarketPreviousClose)}${extendedInfo}

${fiiData.regularMarketChangePercent > 0 ? '🚀 Subiu!' : '🔻 Caiu!'} 

🔗 Acompanhe em: https://lucasfiialerts.com.br

⏰ ${new Date().toLocaleString('pt-BR')}
_Alerta automático baseado nas suas configurações._`;
  }

  /**
   * Cria mensagem de alerta simples (sem informações patrimoniais detalhadas)
   */
  createSimpleAlertMessage(ticker: string, name: string, fiiData: BrapiFiiData): string {
    const emoji = BrapiService.getVariationEmoji(fiiData.regularMarketChangePercent);
    const formattedPrice = BrapiService.formatPrice(fiiData.regularMarketPrice);
    const formattedVariation = BrapiService.formatVariation(fiiData.regularMarketChangePercent);
    
    // Título dinâmico baseado na variação
    const alertTitle = fiiData.regularMarketChangePercent >= 0 ? 
      '*📈 Alerta de Alta!*' : 
      '*📉 Alerta de Baixa!*';

    return `${emoji} ${alertTitle}

📊 *${ticker}*
💰 *Cotação atual:* ${formattedPrice}
📈 *Variação:* ${formattedVariation}

${fiiData.regularMarketChangePercent > 0 ? '🚀 Subiu!' : '🔻 Caiu!'} 

Acompanhe em: https://lucasfiialerts.com.br

_Este é um alerta automático baseado nas suas configurações._`;
  }

  /**
   * Registra que um alerta foi enviado
   */
  async logAlert(alert: FiiAlert) {
    // Se fundId estiver vazio, não registra no log mas não falha
    if (!alert.fundId) {
      console.log(`⚠️ Log de alerta pulado - fundId vazio para ${alert.ticker}`);
      return;
    }
    
    await db.insert(fiiAlertLogTable).values({
      userId: alert.userId,
      fundId: alert.fundId,
      alertType: alert.alertType,
      message: alert.message,
      price: alert.price.toString(),
      variation: alert.variation.toString(),
      status: 'sent',
    });
  }

  /**
   * Busca último alerta enviado para um usuário/FII
   */
  async getLastAlert(userId: string, fundId: string) {
    const lastAlert = await db
      .select()
      .from(fiiAlertLogTable)
      .where(
        and(
          eq(fiiAlertLogTable.userId, userId),
          eq(fiiAlertLogTable.fundId, fundId)
        )
      )
      .orderBy(desc(fiiAlertLogTable.sentAt))
      .limit(1);

    return lastAlert[0] || null;
  }

  /**
   * Processa alertas para todos os usuários
   */
  async processAllAlerts(): Promise<FiiAlert[]> {
    try {
      console.log('🔄 Iniciando processamento de alertas de FIIs...');
      
      // Buscar todos os usuários com alertas habilitados
      const usersWithAlerts = await this.getAllUsersWithAlerts();
      
      if (usersWithAlerts.length === 0) {
        console.log('ℹ️ Nenhum usuário com alertas habilitados encontrado');
        return [];
      }

      // Agrupar tickers únicos
      const uniqueTickers = [...new Set(usersWithAlerts.map(user => user.ticker))];
      console.log(`📊 Buscando cotações para ${uniqueTickers.length} FIIs: ${uniqueTickers.join(', ')}`);

      // Buscar dados da BRAPI
      const fiiDataList = await brapiService.getFiiData(uniqueTickers);
      
      const alerts: FiiAlert[] = [];

      // Processar cada usuário
      for (const userAlert of usersWithAlerts) {
        const fiiData = fiiDataList.find(data => data.symbol === userAlert.ticker);
        
        if (!fiiData) {
          console.log(`⚠️ Dados não encontrados para ${userAlert.ticker}`);
          continue;
        }

        // Buscar dados estendidos para este FII
        const extendedData = await this.getExtendedFiiData(userAlert.ticker);

        // Verificar último alerta
        const lastAlert = await this.getLastAlert(userAlert.userId, userAlert.fundId);
        const lastAlertTime = lastAlert?.sentAt || null;

        // Verificar se deve gerar alerta
        const shouldAlert = this.shouldGenerateAlert(
          fiiData.regularMarketChangePercent,
          userAlert.minVariationPercent || "1.0",
          lastAlertTime
        );

        if (shouldAlert) {
          // Verificar se o usuário tem "Relatórios e Eventos" ativo para mensagem completa
          const useExtendedMessage = userAlert.alertPreferencesReports;
          
          let message: string;
          if (useExtendedMessage) {
            // Mensagem COMPLETA com informações patrimoniais
            message = this.createAlertMessage(userAlert.ticker, userAlert.name, fiiData, extendedData || undefined);
          } else {
            // Mensagem SIMPLES sem informações extras
            message = this.createSimpleAlertMessage(userAlert.ticker, userAlert.name, fiiData);
          }
          
          const alert: FiiAlert = {
            userId: userAlert.userId,
            fundId: userAlert.fundId,
            ticker: userAlert.ticker,
            name: userAlert.name,
            price: fiiData.regularMarketPrice,
            variation: fiiData.regularMarketChangePercent,
            message,
            alertType: 'price_variation',
            additionalData: useExtendedMessage && extendedData ? {
              volume: fiiData.regularMarketVolume,
              patrimonioLiquido: extendedData.patrimonioLiquido,
              valorPatrimonial: extendedData.valorPatrimonial,
              competencia: extendedData.competenciaReavaliacao,
              reavaliacao: extendedData.variacaoReavaliacao !== undefined ? {
                variacao: extendedData.variacaoReavaliacao,
                data: extendedData.competenciaReavaliacao || ''
              } : undefined
            } : undefined
          };

          alerts.push(alert);
          
          const messageType = useExtendedMessage ? 'COMPLETA' : 'SIMPLES';
          console.log(`🚨 Alerta ${messageType} gerado para usuário ${userAlert.userId}: ${userAlert.ticker} ${BrapiService.formatVariation(fiiData.regularMarketChangePercent)}`);
        }

        // Salvar histórico de preços
        await this.savePriceHistory(userAlert.fundId, fiiData);
      }

      console.log(`✅ Processamento concluído. ${alerts.length} alertas gerados.`);
      return alerts;

    } catch (error) {
      console.error('❌ Erro ao processar alertas:', error);
      throw error;
    }
  }
}

export const fiiAlertService = new FiiAlertService();
