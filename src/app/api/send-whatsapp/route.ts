import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber, message } = await request.json();
    
    console.log("📱 Enviando WhatsApp para:", phoneNumber);
    console.log("📝 Mensagem:", message);

    // Se as variáveis de UltraMsg estiverem configuradas
    if (process.env.ULTRAMSG_TOKEN && process.env.ULTRAMSG_INSTANCE) {
      console.log("🌐 Usando UltraMsg...");
      
      const response = await fetch(`https://api.ultramsg.com/${process.env.ULTRAMSG_INSTANCE}/messages/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          token: process.env.ULTRAMSG_TOKEN,
          to: `+${phoneNumber}`,
          body: message,
        }),
      });

      const responseText = await response.text();
      console.log("📡 Resposta UltraMsg:", response.status, responseText);

      if (!response.ok) {
        console.error("❌ Erro na UltraMsg:", responseText);
        throw new Error(`Falha na UltraMsg: ${response.status} - ${responseText}`);
      }

      const result = JSON.parse(responseText);
      console.log("✅ Mensagem enviada via UltraMsg:", result);

      return NextResponse.json({ 
        success: true, 
        message: "Mensagem enviada com sucesso",
        ultramsgResponse: result
      });
    } else {
      // Fallback para simulação se não houver configuração
      console.log("⚠️ UltraMsg não configurado, simulando envio...");
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return NextResponse.json({ 
        success: true, 
        message: "Mensagem enviada com sucesso (simulado - configure UltraMsg)" 
      });
    }

  } catch (error) {
    console.error("❌ Erro ao enviar WhatsApp:", error);
    return NextResponse.json(
      { error: "Erro ao enviar mensagem", details: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    );
  }
}