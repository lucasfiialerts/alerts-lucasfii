import { NextRequest, NextResponse } from 'next/server';

/**
 * API de Teste do Sistema Completo de Notificações
 * 
 * POST /api/fii/test-notification
 * 
 * Simula todo o fluxo de notificação:
 * 1. Busca um FII real
 * 2. Extrai PDF 
 * 3. Gera resumo com IA
 * 4. Formata mensagem WhatsApp
 * 5. Mostra resultado sem enviar
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ticker = 'HGLG11', userPhone = '+5511999999999' } = body;

    console.log(`🧪 TESTE COMPLETO: ${ticker}`);

    // 1. Buscar dados reais do FII
    console.log('📊 Buscando dados do FII...');
    
    const discoveryResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/fii/paginated-discovery?maxPages=3`);
    
    if (!discoveryResponse.ok) {
      throw new Error('Falha na busca de dados');
    }

    const discoveryData = await discoveryResponse.json();
    
    // Buscar o ticker específico
    const fundData = discoveryData.results?.find((r: any) => r.ticker === ticker);
    
    if (!fundData || !fundData.pdfUrl) {
      return NextResponse.json({
        success: false,
        error: `${ticker} não encontrado ou sem PDF disponível`,
        availableTickers: discoveryData.results?.slice(0, 10).map((r: any) => r.ticker) || []
      }, { status: 404 });
    }

    console.log(`✅ ${ticker} encontrado: ${fundData.fundName}`);
    console.log(`📄 PDF: ${fundData.pdfUrl}`);

    // 2. Testar notificação (modo teste)
    console.log('🤖 Testando geração de resumo e notificação...');
    
    const notificationResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/fii/notify-followers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ticker: fundData.ticker,
        pdfUrl: fundData.pdfUrl,
        reportDate: fundData.reportDate,
        userPhone: userPhone,
        testMode: true
      })
    });

    if (!notificationResponse.ok) {
      const errorData = await notificationResponse.text();
      throw new Error(`Falha na notificação: ${errorData}`);
    }

    const notificationData = await notificationResponse.json();

    console.log('🎊 TESTE CONCLUÍDO COM SUCESSO!');

    return NextResponse.json({
      success: true,
      message: 'Teste completo de notificação realizado',
      testData: {
        fund: {
          ticker: fundData.ticker,
          name: fundData.fundName,
          reportDate: fundData.reportDate,
          pdfUrl: fundData.pdfUrl
        },
        notification: {
          message: notificationData.data?.message,
          messageLength: notificationData.data?.whatsapp?.messageLength,
          aiSuccess: notificationData.data?.aiAnalysis?.success,
          processingTime: notificationData.data?.aiAnalysis?.processingTime
        },
        simulation: {
          userPhone: userPhone,
          wouldSendWhatsApp: true,
          testMode: true
        }
      },
      previewMessage: notificationData.data?.message
    }, { status: 200 });

  } catch (error) {
    console.error('❌ Erro no teste:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Falha no teste de notificação',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}

/**
 * GET /api/fii/test-notification - Informações sobre os testes
 */
export async function GET() {
  try {
    return NextResponse.json({
      service: 'FII Notification Test Service',
      description: 'Testa todo o fluxo de notificação sem enviar WhatsApp real',
      usage: {
        endpoint: 'POST /api/fii/test-notification',
        parameters: {
          ticker: 'Código do FII para testar (padrão: HGLG11)',
          userPhone: 'Telefone para simulação (padrão: +5511999999999)'
        },
        example: {
          ticker: 'HGLG11',
          userPhone: '+5511987654321'
        }
      },
      testFlow: [
        '1. Busca dados reais do FII no relatoriosfiis.com.br',
        '2. Extrai texto do PDF do relatório',
        '3. Gera resumo usando IA (Gemini)',
        '4. Formata mensagem WhatsApp no padrão solicitado',
        '5. Simula envio (testMode: true)',
        '6. Retorna preview da mensagem'
      ],
      requirements: {
        geminiApiKey: 'GEMINI_API_KEY deve estar configurado',
        fundExists: 'Ticker deve existir no relatoriosfiis.com.br',
        pdfAvailable: 'Relatório PDF deve estar disponível'
      }
    }, { status: 200 });

  } catch (error) {
    return NextResponse.json({
      service: 'FII Notification Test Service',
      status: 'error',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}