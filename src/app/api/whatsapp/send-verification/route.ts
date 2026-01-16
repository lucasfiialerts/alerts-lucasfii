import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber, verificationCode } = await request.json();

    console.log(`📱 Tentando enviar WhatsApp para +${phoneNumber}`);
    console.log(`🔐 Código: ${verificationCode}`);
    
    // Verificar se as variáveis estão definidas no servidor
    console.log("🔍 Verificando configurações:");
    console.log("ULTRAMSG_TOKEN valor:", process.env.ULTRAMSG_TOKEN);
    console.log("ULTRAMSG_INSTANCE valor:", process.env.ULTRAMSG_INSTANCE);
    console.log("ZAPI_TOKEN valor:", process.env.ZAPI_TOKEN);
    console.log("ZAPI_INSTANCE valor:", process.env.ZAPI_INSTANCE);
    console.log("ULTRAMSG_TOKEN definido:", !!process.env.ULTRAMSG_TOKEN);
    console.log("ULTRAMSG_INSTANCE definido:", !!process.env.ULTRAMSG_INSTANCE);
    console.log("ZAPI_TOKEN definido:", !!process.env.ZAPI_TOKEN);
    console.log("ZAPI_INSTANCE definido:", !!process.env.ZAPI_INSTANCE);
    
    const message = `🔐 *Código de Verificação*\n\nSeu código de verificação é: *${verificationCode}*\n\nResponda com "OK" para confirmar a verificação.\n\n_Este código expira em 10 minutos._`;

    // 1. TENTAR ULTRAMSG PRIMEIRO (mais simples e confiável)
    if (process.env.ULTRAMSG_TOKEN && process.env.ULTRAMSG_INSTANCE) {
      console.log("🚀 Usando UltraMsg API...");
      
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
        console.log("📤 Resposta UltraMsg:", result);
        console.log("📊 Status da resposta:", response.status);
        
        if (response.ok && result.sent) {
          console.log("✅ Mensagem enviada via UltraMsg:", result);
          return NextResponse.json({ 
            success: true, 
            message: "Código enviado via WhatsApp",
            provider: "UltraMsg",
            result 
          });
        } else {
          console.log("⚠️ UltraMsg falhou:", result);
          console.log("⚠️ Tentando Z-API como fallback...");
        }
      } catch (error) {
        console.error("❌ Erro UltraMsg:", error);
        console.log("⚠️ UltraMsg com erro, tentando Z-API...");
      }
    }

    // Se as variáveis de ambiente da Z-API estiverem configuradas, usar a API real
    if (process.env.ZAPI_TOKEN && process.env.ZAPI_INSTANCE) {
      console.log("🌐 Usando Z-API...");
      
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
        console.log("✅ Mensagem enviada via Z-API:", result);
        return NextResponse.json({ 
          success: true, 
          message: "Código enviado via WhatsApp",
          provider: "Z-API",
          result 
        });
      } else {
        console.error("❌ Erro na Z-API:", result);
        throw new Error(`Erro na Z-API: ${result.message || 'Erro desconhecido'}`);
      }
    }

    // Fallback para simulação
    console.log("⚠️ MODO SIMULAÇÃO");
    console.log("📝 Para usar WhatsApp real, configure no .env.local:");
    console.log("ZAPI_TOKEN=seu_token");
    console.log("ZAPI_INSTANCE=sua_instancia");
    console.log("✅ Simulação concluída para +" + phoneNumber);
    
    return NextResponse.json({ 
      success: true, 
      message: "Código enviado (simulação)",
      provider: "SIMULAÇÃO" 
    });

  } catch (error) {
    console.error("❌ Erro ao enviar WhatsApp:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      },
      { status: 500 }
    );
  }
}