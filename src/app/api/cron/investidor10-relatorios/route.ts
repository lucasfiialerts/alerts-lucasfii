import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

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
    // Validar secret para segurança
    const searchParams = request.nextUrl.searchParams;
    const secret = searchParams.get('secret');
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
    
    // Construir comando
    let comando = 'cd /Users/alanrocha/Downloads/lucasfiialerts && node scripts/investidor10-processar-todos.js';
    
    if (limite) {
      comando += ` --limite=${limite}`;
    }
    
    if (!teste) {
      comando += ' --enviar';
    }
    
    console.log(`📊 Executando: ${comando}`);
    
    // Executar script (com timeout de 30 minutos para processar muitos FIIs)
    const startTime = Date.now();
    const { stdout, stderr } = await execAsync(comando, {
      timeout: 30 * 60 * 1000, // 30 minutos
      maxBuffer: 10 * 1024 * 1024 // 10MB buffer
    });
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    // Extrair estatísticas do output
    const enviados = (stdout.match(/Total de mensagens enviadas: (\d+)/) || [])[1] || '0';
    const processados = (stdout.match(/FIIs a processar: (\d+)/) || [])[1] || '0';
    
    console.log(`✅ Processamento concluído em ${duration}s`);
    console.log(`📊 FIIs processados: ${processados}`);
    console.log(`📤 Mensagens enviadas: ${enviados}`);
    
    if (stderr) {
      console.warn('⚠️ Stderr:', stderr.substring(0, 500));
    }
    
    return NextResponse.json({
      success: true,
      message: 'Relatórios processados com sucesso',
      stats: {
        fiis_processados: parseInt(processados),
        mensagens_enviadas: parseInt(enviados),
        duracao_segundos: parseFloat(duration),
        modo: teste ? 'teste' : 'producao',
        timestamp: new Date().toISOString()
      },
      output: stdout.substring(stdout.length - 1000) // Últimas 1000 chars
    });
    
  } catch (error: any) {
    console.error('❌ Erro ao processar relatórios:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        stderr: error.stderr?.substring(0, 500),
        stdout: error.stdout?.substring(0, 500)
      },
      { status: 500 }
    );
  }
}

/**
 * Health check
 */
export async function HEAD() {
  return new NextResponse(null, { status: 200 });
}
