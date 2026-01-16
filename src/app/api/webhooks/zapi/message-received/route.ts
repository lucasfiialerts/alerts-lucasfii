import { NextRequest, NextResponse } from "next/server";

import { verifyWhatsAppCode } from "@/actions/verify-whatsapp-code";

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    console.log("📱 Webhook Z-API - Mensagem recebida:", JSON.stringify(data, null, 2));
    
    // Verificar se é uma resposta "OK" para verificação
    if (data.text && data.text.body) {
      const messageText = data.text.body.toLowerCase().trim();
      
      if (messageText === "ok") {
        console.log("✅ Resposta 'OK' detectada para verificação automática");
        
        // Aqui você poderia implementar lógica para verificar automaticamente
        // baseado no número do remetente
        const phoneNumber = data.phone;
        console.log("📞 Número que respondeu OK:", phoneNumber);
        
        // TODO: Implementar verificação automática
        // 1. Buscar usuário pelo número
        // 2. Se houver código pendente, verificar automaticamente
      }
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("❌ Erro no webhook message-received:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}