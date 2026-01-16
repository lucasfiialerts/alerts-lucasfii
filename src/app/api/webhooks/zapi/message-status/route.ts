import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    console.log("📋 Webhook Z-API - Status da mensagem:", JSON.stringify(data, null, 2));
    
    // Aqui você pode processar status de mensagens
    // Por exemplo: enviada, entregue, lida, etc.
    
    if (data.status === "READ") {
      console.log("✅ Mensagem foi lida pelo usuário");
    } else if (data.status === "DELIVERED") {
      console.log("📦 Mensagem foi entregue");
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("❌ Erro no webhook message-status:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}