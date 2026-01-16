import { NextRequest, NextResponse } from 'next/server';

/**
 * API para enviar mensagens via WhatsApp
 * Utiliza a biblioteca whatsapp-api que já está configurada no projeto
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, message } = body;

    if (!phone || !message) {
      return NextResponse.json({
        success: false,
        error: 'Phone e message são obrigatórios'
      }, { status: 400 });
    }

    // Importar a função de envio do WhatsApp
    const { sendWhatsAppMessage } = require('@/lib/whatsapp-api');

    console.log(`📱 Enviando mensagem para ${phone}...`);

    // Enviar mensagem usando a função genérica
    await sendWhatsAppMessage(phone, message);

    console.log(`✅ Mensagem enviada com sucesso para ${phone}`);

    return NextResponse.json({
      success: true,
      message: 'Mensagem enviada com sucesso',
      phone: phone
    });

  } catch (error) {
    console.error('❌ Erro ao enviar mensagem:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    service: 'WhatsApp Send API',
    description: 'Envia mensagens via WhatsApp',
    usage: {
      method: 'POST',
      body: {
        phone: 'string (ex: 5511987654321)',
        message: 'string (texto da mensagem)'
      }
    }
  });
}
