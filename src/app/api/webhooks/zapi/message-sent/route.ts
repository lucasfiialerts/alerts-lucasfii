import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    console.log("📨 Webhook Z-API - Mensagem enviada:", JSON.stringify(data, null, 2));
    
    // Aqui você pode processar quando uma mensagem é enviada
    // Por exemplo, atualizar status no banco de dados
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("❌ Erro no webhook message-sent:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}