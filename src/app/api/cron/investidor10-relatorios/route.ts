import { NextRequest, NextResponse } from 'next/server';
import { processarRelatoriosInvestidor10 } from '@/lib/investidor10-processor';

/**
 * 🤖 API Cron: Investidor10 Relatórios Gerenciais
 * 
 * Processa relatórios gerenciais de FIIs do Investidor10 com IA
 * e envia alertas via WhatsApp para usuários com alertPreferencesFnet ativo
 * 
 * Uso:
 * GET /api/cron/investidor10-relatorios?limite=10&secret=seu_secret
 * 
 * Parâmetros:
 * - limite: número de FIIs a processar (opcional, padrão: todos)
 * - secret: webhook secret para segurança
 * - teste: modo de teste sem enviar (opcional)
 */
export async function GET(request: NextRequest) {
  console.log('🤖 Cron: Processando relatórios Investidor10...');
  
  try {
    // Validar secret para segurança (aceita via query param ou header)
    const searchParams = request.nextUrl.searchParams;
    const secretFromQuery = searchParams.get('secret');
    const secretFromHeader = request.headers.get('x-webhook-secret') || request.headers.get('X-Webhook-Secret');
    const secret = secretFromQuery || secretFromHeader;
    const expectedSecret = process.env.WEBHOOK_SECRET || 'fii-alerts-webhook-2025-secure-key';
    
    if (secret !== expectedSecret) {
      console.error('❌ Secret inválido');
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Invalid secret' },
        { status: 401 }
      );
    }
    
    // Parâmetros
    const limite = searchParams.get('limite');
    const teste = searchParams.get('teste') === 'true';
    
    console.log(`📊 Parâmetros: limite=${limite || 'todos'}, teste=${teste}`);
    
    // Executar lógica do processamento
    const startTime = Date.now();
    const resultado = await processarRelatoriosInvestidor10({
      limite: limite ? parseInt(limite) : undefined,
      enviar: !teste
    });
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    console.log(`✅ Processamento concluído em ${duration}s`);
    console.log(`📊 FIIs processados: ${resultado.fiis_processados}`);
    console.log(`📤 Mensagens enviadas: ${resultado.mensagens_enviadas}`);
    
    return NextResponse.json({
      success: true,
      message: 'Relatórios processados com sucesso',
      stats: {
        ...resultado,
        duracao_segundos: parseFloat(duration),
        modo: teste ? 'teste' : 'producao',
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error: any) {
    console.error('❌ Erro ao processar relatórios:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        stack: error.stack?.substring(0, 500)
      },
      { status: 500 }
    );
  }
}

/**
 * POST handler - same logic as GET
 * Some cron services default to POST requests
 */
export async function POST(request: NextRequest) {
  return GET(request);
}

/**
 * Health check
 */
export async function HEAD() {
  return new NextResponse(null, { status: 200 });
}
