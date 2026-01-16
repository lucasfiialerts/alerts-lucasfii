import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    console.log("👤 Webhook Z-API - Presença:", JSON.stringify(data, null, 2));
    
    // Aqui você pode processar mudanças de presença
    // Por exemplo, saber quando um usuário fica online/offline
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("❌ Erro no webhook presence:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}