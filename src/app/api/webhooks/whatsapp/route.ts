import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { userTable } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { brapiService } from '@/lib/brapi';

/**
 * Webhook para receber mensagens do WhatsApp (UltraMsg)
 * Processa comandos de cotação sob demanda
 * 
 * Exemplos de comandos:
 * - "HGLG11"
 * - "cotacao VISC11"
 * - "preco MXRF11"
 */

// Cache de rate limiting: userPhone -> { ticker -> timestamp }
const rateLimitCache = new Map<string, Map<string, number>>();
const RATE_LIMIT_MS = 2 * 60 * 1000; // 2 minutos

interface UltraMessageData {
  id: string;
  from: string;
  to: string;
  ack?: string;
  type: string;
  body: string;
  fromMe: boolean;
  time: number;
}

interface UltraMessagePayload {
  event_type: string;
  instanceId: string;
  data: UltraMessageData;
}

/**
 * Verifica se usuário pode consultar este ticker (rate limit)
 */
function canConsultTicker(phone: string, ticker: string): boolean {
  const userCache = rateLimitCache.get(phone);
  if (!userCache) return true;
  
  const lastRequest = userCache.get(ticker);
  if (!lastRequest) return true;
  
  return Date.now() - lastRequest >= RATE_LIMIT_MS;
}

/**
 * Registra consulta para rate limiting
 */
function registerConsult(phone: string, ticker: string): void {
  let userCache = rateLimitCache.get(phone);
  if (!userCache) {
    userCache = new Map();
    rateLimitCache.set(phone, userCache);
  }
  userCache.set(ticker, Date.now());
}

/**
 * Extrai ticker da mensagem
 */
function extractTicker(message: string): string | null {
  // Remove acentos e normaliza
  const normalized = message
    .toUpperCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  
  // Padrões aceitos:
  // 1. Só o ticker: "HGLG11"
  // 2. Com prefixo: "cotacao HGLG11", "preco VISC11", "valor MXRF11"
  const patterns = [
    /^([A-Z]{4}\d{2})$/,                           // HGLG11
    /^(?:COTACAO|PRECO|VALOR)\s+([A-Z]{4}\d{2})$/, // cotacao HGLG11
  ];
  
  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    if (match) {
      return match[1] || match[0];
    }
  }
  
  return null;
}

/**
 * Formata mensagem de cotação
 */
function formatQuoteMessage(ticker: string, data: any): string {
  const { regularMarketPrice, regularMarketChange, regularMarketChangePercent, 
          regularMarketDayHigh, regularMarketDayLow, regularMarketVolume } = data;
  
  const isPositive = regularMarketChange >= 0;
  const arrow = isPositive ? '📈' : '📉';
  const sign = isPositive ? '+' : '';
  
  return `*${arrow} ${ticker}*\n\n` +
    `💰 *Cotação:* R$ ${regularMarketPrice.toFixed(2)}\n` +
    `${isPositive ? '🟢' : '🔴'} *Variação:* ${sign}R$ ${regularMarketChange.toFixed(2)} (${sign}${regularMarketChangePercent.toFixed(2)}%)\n\n` +
    `📊 *Hoje:*\n` +
    `   Máxima: R$ ${regularMarketDayHigh.toFixed(2)}\n` +
    `   Mínima: R$ ${regularMarketDayLow.toFixed(2)}\n` +
    `   Volume: ${(regularMarketVolume / 1000000).toFixed(2)}M`;
}

/**
 * Envia mensagem via UltraMsg
 */
async function sendWhatsAppMessage(to: string, message: string): Promise<void> {
  const token = process.env.ULTRAMSG_TOKEN;
  const instance = process.env.ULTRAMSG_INSTANCE;
  
  if (!token || !instance) {
    throw new Error('UltraMsg não configurado');
  }
  
  const response = await fetch(`https://api.ultramsg.com/${instance}/messages/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      token,
      to: to.replace(/\D/g, ''),
      body: message
    })
  });
  
  if (!response.ok) {
    throw new Error(`Erro ao enviar mensagem: ${response.status}`);
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json() as UltraMessagePayload;
    
    console.log('📱 Webhook recebido:', { event_type: payload.event_type, from: payload.data?.from });
    
    // Ignorar se não for mensagem recebida
    if (payload.event_type !== 'message_received' || !payload.data) {
      return NextResponse.json({ success: true, message: 'Event ignored' });
    }
    
    // Ignorar mensagens enviadas por mim
    if (payload.data.fromMe) {
      return NextResponse.json({ success: true, message: 'Own message ignored' });
    }
    
    const { from, body } = payload.data;
    console.log('   📝 Mensagem:', { from, body });
    
    // Extrair ticker
    const ticker = extractTicker(body);
    
    if (!ticker) {
      console.log('   ℹ️ Não é um comando de cotação');
      return NextResponse.json({ success: true, message: 'Not a quote command' });
    }
    
    console.log(`   🎯 Ticker detectado: ${ticker}`);
    
    // Buscar usuário pelo número de WhatsApp (remover @c.us e 55 do início)
    const phoneNumber = from.replace(/@c\.us$/, '').replace(/^55/, '');
    const users = await db
      .select()
      .from(userTable)
      .where(eq(userTable.whatsappNumber, phoneNumber))
      .limit(1);
    
    if (users.length === 0) {
      console.log('   ❌ Usuário não encontrado');
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }
    
    const user = users[0];
    
    // Verificar se tem o recurso ativo
    if (!user.alertPreferencesOnDemandQuote) {
      console.log('   ⚠️ Recurso não ativado para este usuário');
      await sendWhatsAppMessage(
        from,
        '⚠️ *Recurso não ativado*\n\n' +
        'Para usar consultas de cotação, ative o recurso *"Cotação Sob Demanda"* ' +
        'nas configurações do app! 📱'
      );
      return NextResponse.json({ success: true, message: 'Feature disabled' });
    }
    
    // Verificar rate limit
    if (!canConsultTicker(phoneNumber, ticker)) {
      console.log('   ⏱️ Rate limit atingido');
      await sendWhatsAppMessage(
        from,
        `⏱️ *Aguarde um momento!*\n\n` +
        `Você pode consultar *${ticker}* novamente em alguns instantes.\n` +
        `Rate limit: 1 consulta a cada 2 minutos por ticker.`
      );
      return NextResponse.json({ success: true, message: 'Rate limited' });
    }
    
    // Buscar cotação na brapi
    console.log(`   🔍 Buscando cotação de ${ticker}...`);
    const quotes = await brapiService.getFiiData([ticker]);
    
    if (!quotes || quotes.length === 0) {
      console.log('   ❌ Cotação não encontrada');
      await sendWhatsAppMessage(
        from,
        `❌ *Ticker não encontrado*\n\n` +
        `Não consegui encontrar informações sobre *${ticker}*.\n` +
        `Verifique se o ticker está correto.`
      );
      return NextResponse.json({ success: false, error: 'Quote not found' }, { status: 404 });
    }
    
    const quote = quotes[0];
    
    // Formatar e enviar resposta
    const message = formatQuoteMessage(ticker, quote);
    await sendWhatsAppMessage(from, message);
    
    // Registrar consulta (rate limit)
    registerConsult(phoneNumber, ticker);
    
    console.log('   ✅ Cotação enviada com sucesso!');
    
    return NextResponse.json({ 
      success: true, 
      ticker,
      user: user.email,
      quote: quote.regularMarketPrice
    });
    
  } catch (error: any) {
    console.error('❌ Erro no webhook:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * Health check
 */
export async function GET() {
  return NextResponse.json({ 
    status: 'ok',
    service: 'whatsapp-webhook',
    features: ['on-demand-quotes']
  });
}
