import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    const whatsappConfig = {
      instanceId: process.env.WHATSAPP_INSTANCE_ID || 'not-set',
      token: process.env.WHATSAPP_TOKEN ? 'SET (length: ' + process.env.WHATSAPP_TOKEN.length + ')' : 'not-set',
      baseUrl: 'https://api.ultramsg.com',
    };

    const response = await fetch(`https://api.ultramsg.com/${whatsappConfig.instanceId}/instance/status?token=${process.env.WHATSAPP_TOKEN}`);
    const instanceStatus = await response.json();

    return NextResponse.json({
      config: whatsappConfig,
      instanceStatus,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erro ao verificar configuração WhatsApp:', error);
    return NextResponse.json({
      error: 'Erro ao verificar configuração',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}
