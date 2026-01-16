import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    console.log("🔗 Webhook Z-API - Conectar:", JSON.stringify(data, null, 2));
    
    // Aqui você pode processar quando a instância conecta/desconecta
    if (data.connected) {
      console.log("✅ Instância Z-API conectada");
    } else {
      console.log("❌ Instância Z-API desconectada");
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("❌ Erro no webhook connect:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}