/**
 * Serviço para integração com a API FNet da B3
 * Busca documentos oficiais de FIIs: informes, rendimentos, fatos relevantes
 */

export interface FNetDocument {
  id: number;
  descricaoFundo: string;
  categoriaDocumento: string;
  tipoDocumento: string;
  especieDocumento: string;
  dataReferencia: string;
  dataEntrega: string;
  status: string;
  descricaoStatus: string;
  analisado: string;
  situacaoDocumento: string;
  assuntos?: string;
  altaPrioridade: boolean;
  formatoDataReferencia: string;
  versao: number;
  modalidade: string;
  descricaoModalidade: string;
  nomePregao: string;
  informacoesAdicionais: string;
  arquivoEstruturado: string;
  formatoEstruturaDocumento?: string;
  nomeAdministrador?: string;
  cnpjAdministrador?: string;
  cnpjFundo?: string;
  idFundo?: string;
  idTemplate: number;
  idSelectNotificacaoConvenio?: string;
  idSelectItemConvenio: number;
  indicadorFundoAtivoB3: boolean;
  idEntidadeGerenciadora?: string;
  ofertaPublica?: string;
  numeroEmissao?: string;
  tipoPedido?: string;
  dda?: string;
  codSegNegociacao?: string;
  fundoOuClasse?: string;
  nomePrimeiraVisualizacao?: string;
}

export interface FNetResponse {
  draw: number;
  recordsFiltered: number;
  recordsTotal: number;
  data: FNetDocument[];
}

export interface FNetAlert {
  fundoName: string;
  documentType: string;
  category: string;
  dataEntrega: string;
  dataReferencia?: string;
  documentId: number;
  description: string;
}

/**
 * Cliente para fazer requisições à API FNet
 */
class FNetClient {
  private baseUrl = 'https://fnet.bmfbovespa.com.br/fnet/publico';
  private userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
  private lastRequest = 0;
  private minDelay = 500; // 500ms entre requests

  private async makeRequest(url: string): Promise<Response> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequest;
    
    if (timeSinceLastRequest < this.minDelay) {
      await new Promise(resolve => 
        setTimeout(resolve, this.minDelay - timeSinceLastRequest)
      );
    }

    this.lastRequest = Date.now();
    
    return fetch(url, {
      headers: {
        'User-Agent': this.userAgent
      }
    });
  }

  /**
   * Busca documentos do FNet
   */
  async searchDocuments(offset = 0, limit = 50): Promise<FNetResponse> {
    const params = new URLSearchParams({
      tipoBusca: '0',
      tipoDocumento: '1', // FIIs
      d: '1',
      s: offset.toString(),
      l: limit.toString()
    });

    const url = `${this.baseUrl}/pesquisarGerenciadorDocumentosDados?${params}`;
    
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/json, text/plain, */*',
          'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'Referer': 'https://fnet.bmfbovespa.com.br/',
          'Origin': 'https://fnet.bmfbovespa.com.br'
        }
      });
      
      if (!response.ok) {
        throw new Error(`FNet API error: ${response.status}`);
      }
      
      const data: FNetResponse = await response.json();
      return data;
    } catch (error) {
      console.error('Erro ao buscar documentos FNet:', error);
      throw error;
    }
  }

  /**
   * Busca documentos de rendimentos
   */
  async searchRendimentos(offset = 0, limit = 50): Promise<FNetDocument[]> {
    const response = await this.searchDocuments(offset, limit);
    return response.data.filter(doc => 
      doc.tipoDocumento?.toLowerCase().includes('rendimentos') ||
      doc.tipoDocumento?.toLowerCase().includes('amortizações')
    );
  }

  /**
   * Busca fatos relevantes
   */
  async searchFatosRelevantes(offset = 0, limit = 50): Promise<FNetDocument[]> {
    const response = await this.searchDocuments(offset, limit);
    return response.data.filter(doc => 
      doc.categoriaDocumento === 'Comunicado ao Mercado' ||
      doc.tipoDocumento?.toLowerCase().includes('fato') ||
      doc.tipoDocumento === 'Aviso ao Mercado'
    );
  }

  /**
   * Busca informes mensais e trimestrais
   */
  async searchInformes(offset = 0, limit = 50): Promise<FNetDocument[]> {
    const response = await this.searchDocuments(offset, limit);
    return response.data.filter(doc => 
      doc.tipoDocumento === 'Informe Mensal Estruturado ' ||
      doc.tipoDocumento === 'Informe Trimestral Estruturado' ||
      doc.tipoDocumento === 'Relatório Gerencial'
    );
  }

  /**
   * Busca assembleias
   */
  async searchAssembleias(offset = 0, limit = 50): Promise<FNetDocument[]> {
    const response = await this.searchDocuments(offset, limit);
    return response.data.filter(doc => 
      doc.categoriaDocumento === 'Assembleia' ||
      doc.tipoDocumento === 'AGE'
    );
  }

  /**
   * Busca relatórios gerenciais e outros relatórios (categoria "Relatórios")
   * Usado para alertas de relatórios SEM resumo de IA
   */
  async searchRelatorios(offset = 0, limit = 100): Promise<FNetDocument[]> {
    const response = await this.searchDocuments(offset, limit);
    return response.data.filter(doc => 
      doc.categoriaDocumento === 'Relatórios' ||
      doc.tipoDocumento === 'Relatório Gerencial' ||
      doc.tipoDocumento === 'Outros Relatórios' ||
      doc.tipoDocumento === 'Relatório de Agência de Rating'
    );
  }

  /**
   * Busca documentos por categoria específica
   */
  async searchByCategory(category: string, offset = 0, limit = 100): Promise<FNetDocument[]> {
    const response = await this.searchDocuments(offset, limit);
    return response.data.filter(doc => 
      doc.categoriaDocumento === category
    );
  }

  /**
   * Busca todos os documentos relevantes para alertas (exceto rendimentos que têm endpoint próprio)
   * Inclui: Relatórios, Fatos Relevantes, Avisos, Assembleias
   */
  async searchAllRelevantDocuments(offset = 0, limit = 100): Promise<FNetDocument[]> {
    const response = await this.searchDocuments(offset, limit);
    
    const relevantCategories = [
      'Relatórios',
      'Fato Relevante',
      'Aviso aos Cotistas',
      'Assembleia',
      'Informes Periódicos'
    ];
    
    const relevantTypes = [
      'Relatório Gerencial',
      'Outros Relatórios',
      'Relatório de Agência de Rating',
      'AGE',
      'AGO',
      'Informe Mensal Estruturado ',
      'Informe Trimestral',
      'Informe Trimestral Estruturado'
    ];
    
    return response.data.filter(doc => 
      relevantCategories.includes(doc.categoriaDocumento) ||
      relevantTypes.includes(doc.tipoDocumento)
    );
  }
}

/**
 * Instância singleton do cliente FNet
 */
export const fnetClient = new FNetClient();

/**
 * Processa documentos do FNet e gera alertas formatados
 */
export function processDocumentsForAlerts(documents: FNetDocument[]): FNetAlert[] {
  return documents.map(doc => ({
    fundoName: doc.descricaoFundo,
    documentType: doc.tipoDocumento,
    category: doc.categoriaDocumento,
    dataEntrega: doc.dataEntrega,
    dataReferencia: doc.dataReferencia,
    documentId: doc.id,
    description: generateDocumentDescription(doc)
  }));
}

/**
 * Gera descrição amigável do documento
 */
function generateDocumentDescription(doc: FNetDocument): string {
  const fundoName = doc.descricaoFundo.replace(' - FII', '');
  const dataEntrega = new Date(doc.dataEntrega).toLocaleDateString('pt-BR');
  
  switch (doc.tipoDocumento) {
    case 'Rendimentos e Amortizações':
      return `${fundoName} divulgou informações sobre rendimentos - ${dataEntrega}`;
    
    case 'Informe Mensal Estruturado ':
      const mes = doc.dataReferencia;
      return `${fundoName} publicou informe mensal ${mes ? `(${mes})` : ''} - ${dataEntrega}`;
    
    case 'Informe Trimestral Estruturado':
      return `${fundoName} publicou informe trimestral - ${dataEntrega}`;
    
    case 'Aviso ao Mercado':
      return `${fundoName} publicou aviso ao mercado - ${dataEntrega}`;
    
    case 'AGE':
      return `${fundoName} convoca assembleia geral extraordinária - ${dataEntrega}`;
    
    case 'Relatório Gerencial':
      return `${fundoName} publicou relatório gerencial - ${dataEntrega}`;
    
    default:
      return `${fundoName} publicou ${doc.tipoDocumento.toLowerCase()} - ${dataEntrega}`;
  }
}

/**
 * Busca documentos relevantes recentes (últimas 24h)
 */
export async function getRecentFNetAlerts(): Promise<FNetAlert[]> {
  try {
    console.log('🔍 Buscando documentos FNet recentes...');
    
    // Buscar documentos usando fetch direto (baseado no script que funcionou)
    const url = 'https://fnet.bmfbovespa.com.br/fnet/publico/pesquisarGerenciadorDocumentosDados?tipoBusca=0&tipoDocumento=1&d=1&s=0&l=30';
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Referer': 'https://fnet.bmfbovespa.com.br/',
        'Origin': 'https://fnet.bmfbovespa.com.br'
      }
    });
    
    console.log(`� Status da API FNet: ${response.status}`);
    
    if (!response.ok) {
      console.log(`❌ Erro na API FNet: ${response.status}`);
      return [];
    }
    
    const result = await response.json();
    console.log(`📊 API FNet retornou ${result.data?.length || 0} documentos`);
    
    if (!result.data || result.data.length === 0) {
      console.log('📭 Nenhum documento encontrado na API FNet');
      return [];
    }

    // Filtrar documentos das últimas 24h
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    
    const recentDocuments = result.data.filter((doc: FNetDocument) => {
      const deliveryDate = new Date(doc.dataEntrega);
      return deliveryDate >= oneDayAgo && doc.status === 'AC'; // Ativo
    });

    console.log(`📅 Documentos das últimas 24h: ${recentDocuments.length}`);

    // Processar documentos para nosso formato de alerta
    const alerts = recentDocuments.map((doc: FNetDocument) => ({
      fundoName: doc.descricaoFundo,
      documentType: doc.tipoDocumento,
      category: doc.categoriaDocumento,
      dataEntrega: doc.dataEntrega,
      dataReferencia: doc.dataReferencia,
      documentId: doc.id,
      description: `${doc.descricaoFundo} - ${doc.tipoDocumento}`
    }));

    console.log(`✅ Alertas processados: ${alerts.length}`);
    
    return alerts;
    
  } catch (error) {
    console.error('❌ Erro ao buscar alertas FNet:', error);
    return [];
  }
}

/**
 * Busca documentos para FIIs específicos
 */
export async function getFNetAlertsForFIIs(fundoCodes: string[]): Promise<FNetAlert[]> {
  try {
    const alerts = await getRecentFNetAlerts();
    
    // Filtrar por códigos de fundo (aproximação por nome)
    return alerts.filter(alert => 
      fundoCodes.some(code => 
        alert.fundoName.toLowerCase().includes(code.toLowerCase()) ||
        alert.fundoName.toLowerCase().includes(code.replace('11', '').toLowerCase())
      )
    );
    
  } catch (error) {
    console.error('Erro ao buscar alertas FNet para FIIs específicos:', error);
    return [];
  }
}

/**
 * Formatar alerta FNet para WhatsApp
 */
export function formatFNetAlertForWhatsApp(alert: FNetAlert): string {
  const icon = getDocumentIcon(alert.documentType);
  
  return `${icon} *${alert.fundoName}*
  
📋 *Tipo:* ${alert.documentType}
📅 *Data:* ${new Date(alert.dataEntrega).toLocaleDateString('pt-BR')}
${alert.dataReferencia ? `📊 *Referência:* ${alert.dataReferencia}` : ''}

${alert.description}

Para ver o documento completo, acesse: https://fnet.bmfbovespa.com.br/fnet/publico/exibirDocumento?id=${alert.documentId}`;
}

/**
 * Obter ícone baseado no tipo de documento
 */
function getDocumentIcon(documentType: string): string {
  if (documentType.includes('Rendimentos')) return '💰';
  if (documentType.includes('Informe Mensal')) return '📊';
  if (documentType.includes('Informe Trimestral')) return '📈';
  if (documentType.includes('Aviso')) return '⚠️';
  if (documentType === 'AGE') return '🏛️';
  if (documentType.includes('Relatório')) return '📋';
  return '📄';
}

/**
 * Interface para relatório simples (sem resumo de IA)
 */
export interface FNetRelatorioSimples {
  id: number;
  fundo: string;
  nomePregao: string;
  ticker: string; // Ticker estimado (ex: HGIC11, MXRF11)
  categoria: string;
  tipo: string;
  dataEntrega: string;
  dataReferencia: string;
  linkDocumento: string;
  linkDownload: string;
}

/**
 * Busca relatórios gerenciais e outros relatórios da API FNET
 * Usado para alertas de relatórios SEM resumo de IA
 * Faz webscraping da API oficial da B3 COM PAGINAÇÃO
 * 
 * @param hoursAgo - Horas para buscar (default: 24)
 * @param maxPages - Máximo de páginas para buscar (default: 5)
 * @param pageSize - Itens por página (default: 100)
 */
export async function getRecentRelatorios(
  hoursAgo = 24, 
  maxPages = 5,
  pageSize = 100
): Promise<FNetRelatorioSimples[]> {
  try {
    console.log(`📄 Buscando relatórios FNET (sem resumo IA) - últimas ${hoursAgo}h...`);
    
    const allDocuments: FNetDocument[] = [];
    const limitDate = new Date();
    limitDate.setHours(limitDate.getHours() - hoursAgo);
    
    let page = 0;
    let hasMore = true;
    let foundOldDocument = false;
    
    // Buscar múltiplas páginas até encontrar documentos antigos
    while (hasMore && page < maxPages && !foundOldDocument) {
      const offset = page * pageSize;
      const url = `https://fnet.bmfbovespa.com.br/fnet/publico/pesquisarGerenciadorDocumentosDados?tipoBusca=0&tipoDocumento=1&d=1&s=${offset}&l=${pageSize}`;
      
      console.log(`   📃 Buscando página ${page + 1} (offset: ${offset})...`);
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/json, text/plain, */*',
          'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'Referer': 'https://fnet.bmfbovespa.com.br/fnet/publico/abrirGerenciadorDocumentosCVM',
          'Origin': 'https://fnet.bmfbovespa.com.br'
        }
      });
      
      if (!response.ok) {
        console.log(`❌ Erro na API FNet: ${response.status}`);
        break;
      }
      
      const result = await response.json();
      const docs = result.data || [];
      
      console.log(`   ✅ Página ${page + 1}: ${docs.length} documentos`);
      
      if (docs.length === 0) {
        hasMore = false;
        break;
      }
      
      // Adicionar documentos
      allDocuments.push(...docs);
      
      // Verificar se o último documento é muito antigo (para parar de buscar)
      if (docs.length > 0) {
        const lastDoc = docs[docs.length - 1];
        const lastDate = parseDataEntrega(lastDoc.dataEntrega);
        if (lastDate < limitDate) {
          foundOldDocument = true;
          console.log(`   ⏹️ Encontrado documento antigo, parando busca.`);
        }
      }
      
      // Próxima página
      page++;
      
      // Pequeno delay para não sobrecarregar a API
      if (hasMore && !foundOldDocument) {
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    }
    
    console.log(`📊 Total de documentos buscados: ${allDocuments.length}`);

    // Filtrar apenas relatórios recentes
    const relatorios = allDocuments.filter((doc: FNetDocument) => {
      // Verificar se é relatório
      const isRelatorio = 
        doc.categoriaDocumento === 'Relatórios' ||
        doc.tipoDocumento === 'Relatório Gerencial' ||
        doc.tipoDocumento === 'Outros Relatórios' ||
        doc.tipoDocumento === 'Relatório de Agência de Rating';
      
      if (!isRelatorio) return false;

      // Verificar se está dentro do período
      const deliveryDate = parseDataEntrega(doc.dataEntrega);
      const isRecent = deliveryDate >= limitDate;
      
      // Verificar se está ativo
      const isActive = doc.status === 'AC';
      
      return isRecent && isActive;
    });

    console.log(`📋 Relatórios encontrados nas últimas ${hoursAgo}h: ${relatorios.length}`);

    // Mapear para formato simplificado
    return relatorios.map((doc: FNetDocument) => {
      const nomePregao = doc.nomePregao || '';
      const ticker = extractTickerFromPregao(nomePregao, doc.descricaoFundo);
      
      return {
        id: doc.id,
        fundo: doc.descricaoFundo,
        nomePregao: nomePregao || extractTicker(doc.descricaoFundo),
        ticker: ticker,
        categoria: doc.categoriaDocumento,
        tipo: doc.tipoDocumento || 'Relatório',
        dataEntrega: doc.dataEntrega,
        dataReferencia: doc.dataReferencia,
        linkDocumento: `https://fnet.bmfbovespa.com.br/fnet/publico/visualizarDocumento?id=${doc.id}&cvm=true`,
        linkDownload: `https://fnet.bmfbovespa.com.br/fnet/publico/downloadDocumento?id=${doc.id}`
      };
    });
    
  } catch (error) {
    console.error('❌ Erro ao buscar relatórios FNet:', error);
    return [];
  }
}

/**
 * Busca relatórios para FIIs específicos (sem resumo de IA)
 */
export async function getRelatoriosForFIIs(tickers: string[], hoursAgo = 24): Promise<FNetRelatorioSimples[]> {
  const allRelatorios = await getRecentRelatorios(hoursAgo);
  
  // Filtrar por tickers
  return allRelatorios.filter(rel => {
    const tickerNormalized = tickers.map(t => t.toLowerCase().replace('11', ''));
    return tickerNormalized.some(t => 
      rel.fundo.toLowerCase().includes(t) ||
      rel.nomePregao.toLowerCase().includes(t)
    );
  });
}

/**
 * Formatar relatório simples para WhatsApp (sem resumo de IA)
 */
export function formatRelatorioSimplesForWhatsApp(relatorio: FNetRelatorioSimples): string {
  const dataEntrega = formatDataEntrega(relatorio.dataEntrega);
  const tickerDisplay = relatorio.ticker && relatorio.ticker !== 'N/A' 
    ? ` (${relatorio.ticker})` 
    : '';
  
  return `📋 *Novo Relatório Disponível*

🏢 *${relatorio.nomePregao || relatorio.fundo}*${tickerDisplay}

📄 *Tipo:* ${relatorio.tipo || relatorio.categoria}
📅 *Data:* ${dataEntrega}
${relatorio.dataReferencia ? `📊 *Referência:* ${relatorio.dataReferencia}` : ''}

🔗 *Visualizar:* ${relatorio.linkDocumento}

📥 *Download:* ${relatorio.linkDownload}`;
}

/**
 * Parse data de entrega no formato DD/MM/YYYY HH:MM
 */
function parseDataEntrega(dataStr: string): Date {
  try {
    // Formato: "15/01/2026 09:39"
    const [datePart, timePart] = dataStr.split(' ');
    const [day, month, year] = datePart.split('/');
    const [hour, minute] = (timePart || '00:00').split(':');
    
    return new Date(
      parseInt(year),
      parseInt(month) - 1,
      parseInt(day),
      parseInt(hour),
      parseInt(minute)
    );
  } catch {
    return new Date(0);
  }
}

/**
 * Formatar data de entrega para exibição
 */
function formatDataEntrega(dataStr: string): string {
  try {
    const date = parseDataEntrega(dataStr);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return dataStr;
  }
}

/**
 * Extrair ticker do nome do fundo
 */
function extractTicker(fundoName: string): string {
  // Tentar extrair ticker do nome (ex: "FII XPLG" -> "XPLG")
  const match = fundoName.match(/FII\s+(\w+)/i);
  if (match) return match[1].toUpperCase();
  
  // Retornar primeiras palavras
  return fundoName.split(' ').slice(0, 2).join(' ');
}

/**
 * Extrair ticker a partir do nome de pregão
 * Ex: "FII HGI CRI" -> "HGIC11"
 * Ex: "FIAGRO NEXG" -> "NEXG11"
 * Ex: "FII MXRF" -> "MXRF11"
 */
function extractTickerFromPregao(nomePregao: string, descricaoFundo: string): string {
  if (!nomePregao || nomePregao.trim() === '') {
    return extractTickerFromFundo(descricaoFundo);
  }
  
  // Remover prefixos e limpar
  const cleanName = nomePregao
    .replace(/^FII\s+/i, '')
    .replace(/^FIAGRO\s+/i, '')
    .trim();
  
  // Se já é um ticker curto (4-5 letras), usar diretamente
  if (cleanName.match(/^[A-Z]{4,5}$/i)) {
    const ticker = cleanName.toUpperCase();
    return ticker + '11';
  }
  
  // Dividir em partes
  const parts = cleanName.split(/\s+/);
  
  let ticker = '';
  if (parts.length === 1) {
    // Uma palavra só, usar até 4 letras
    ticker = parts[0].substring(0, 4).toUpperCase();
  } else if (parts.length >= 2) {
    // Várias palavras: primeira palavra + primeira letra da segunda
    // Ex: "HGI CRI" -> "HGIC"
    const first = parts[0].substring(0, 4);
    const secondInitial = parts[1].charAt(0);
    ticker = (first + secondInitial).substring(0, 4).toUpperCase();
  }
  
  if (ticker && !ticker.match(/\d+$/)) {
    ticker = ticker + '11';
  }
  
  return ticker || 'N/A';
}

/**
 * Extrair ticker do nome completo do fundo
 */
function extractTickerFromFundo(descricaoFundo: string): string {
  if (!descricaoFundo) return 'N/A';
  
  // Padrões comuns nos nomes de fundos
  const patterns = [
    /([A-Z]{4})\s+FUNDO/i,  // Ex: "MXRF FUNDO DE..."
    /FII\s+([A-Z]{4,6})/i,   // Ex: "FII HGLG"
    /^([A-Z]{4,6})\s+/i,     // Começa com sigla
  ];
  
  for (const pattern of patterns) {
    const match = descricaoFundo.match(pattern);
    if (match && match[1]) {
      const ticker = match[1].toUpperCase();
      return ticker.match(/\d+$/) ? ticker : ticker + '11';
    }
  }
  
  // Pegar primeiras letras das primeiras palavras
  const words = descricaoFundo.split(/\s+/).filter(w => w.length > 2);
  if (words.length >= 2) {
    const initials = words.slice(0, 4).map(w => w.charAt(0)).join('').toUpperCase();
    if (initials.length >= 4) {
      return initials.substring(0, 4) + '11';
    }
  }
  
  return 'N/A';
}
