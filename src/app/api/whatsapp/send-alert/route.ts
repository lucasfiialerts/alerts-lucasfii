import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber, message, userId, ticker } = await request.json();

    console.log(`📱 Enviando alerta de FII para +${phoneNumber}`);
    console.log(`📊 Ticker: ${ticker}`);
    
    // 1. TENTAR ULTRAMSG PRIMEIRO (mais simples e confiável)
    if (process.env.ULTRAMSG_TOKEN && process.env.ULTRAMSG_INSTANCE) {
      console.log("🚀 Usando UltraMsg para alerta de FII...");
      
      try {
        const response = await fetch(`https://api.ultramsg.com/${process.env.ULTRAMSG_INSTANCE}/messages/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            token: process.env.ULTRAMSG_TOKEN,
            to: `${phoneNumber}@c.us`,
            body: message,
            priority: '1'
          }),
        });

        const result = await response.json();
        console.log("📤 Resposta UltraMsg para alerta:", result);
        
        if (response.ok && result.sent) {
          console.log(`✅ Alerta de ${ticker} enviado via UltraMsg para usuário ${userId}`);
          return NextResponse.json({ 
            success: true, 
            message: "Alerta enviado via WhatsApp",
            provider: "UltraMsg",
            ticker,
            result 
          });
        } else {
          console.log("⚠️ UltraMsg falhou para alerta, tentando Z-API...");
        }
      } catch (error) {
        console.error("❌ Erro UltraMsg para alerta:", error);
        console.log("⚠️ UltraMsg com erro, tentando Z-API...");
      }
    }

    // Se as variáveis de ambiente da Z-API estiverem configuradas
    if (process.env.ZAPI_TOKEN && process.env.ZAPI_INSTANCE) {
      console.log("🌐 Usando Z-API para alerta de FII...");
      
      const response = await fetch(`https://api.z-api.io/instances/${process.env.ZAPI_INSTANCE}/token/${process.env.ZAPI_TOKEN}/send-text`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: phoneNumber,
          message: message,
        }),
      });

      const result = await response.json();
      
      if (response.ok) {
        console.log(`✅ Alerta de ${ticker} enviado via Z-API para usuário ${userId}`);
        return NextResponse.json({ 
          success: true, 
          message: "Alerta enviado via WhatsApp",
          provider: "Z-API",
          ticker,
          result 
        });
      } else {
        console.error("❌ Erro na Z-API para alerta:", result);
        throw new Error(`Erro na Z-API: ${result.message || 'Erro desconhecido'}`);
      }
    }

    // Fallback para simulação
    console.log(`⚠️ MODO SIMULAÇÃO - Alerta de ${ticker} para usuário ${userId}`);
    console.log("📝 Para usar WhatsApp real, configure:");
    console.log("ULTRAMSG_TOKEN=seu_token");
    console.log("ULTRAMSG_INSTANCE=sua_instancia");
    
    return NextResponse.json({ 
      success: true, 
      message: "Alerta enviado (simulação)",
      provider: "SIMULAÇÃO",
      ticker
    });

  } catch (error) {
    console.error("❌ Erro ao enviar alerta de FII:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      },
      { status: 500 }
    );
  }
}