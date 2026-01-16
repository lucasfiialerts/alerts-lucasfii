// Hook para enviar mensagem de verificação via WhatsApp
// Este é um exemplo usando fetch - você pode integrar com Z-API, Ultramsg ou Twilio

export async function sendWhatsAppVerification(phoneNumber: string, verificationCode: string) {
  try {
    console.log(`📱 Tentando enviar WhatsApp para +${phoneNumber}`);
    console.log(`🔐 Código: ${verificationCode}`);

    console.log("🔍 Verificando configurações:");

    console.log("ULTRAMSG_TOKEN definido:", !!process.env.ULTRAMSG_TOKEN);
    console.log("ULTRAMSG_INSTANCE definido:", !!process.env.ULTRAMSG_INSTANCE);

    const message = `🔐 *Código de Verificação*\n\nSeu código de verificação é: *${verificationCode}*\n\nResponda com "OK" para confirmar a verificação.\n\n_Este código expira em 10 minutos._`;



    if (process.env.ULTRAMSG_TOKEN && process.env.ULTRAMSG_INSTANCE) {
      console.log("🌐 Usando UltraMsg...");

      const response = await fetch(`https://api.ultramsg.com/${process.env.ULTRAMSG_INSTANCE}/messages/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: process.env.ULTRAMSG_TOKEN,
          to: phoneNumber,
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
      return result;
    }

    // Se nenhuma API estiver configurada, simular (modo de desenvolvimento)
    else {
      console.log("⚠️ MODO SIMULAÇÃO");
      console.log("🔧 Para usar WhatsApp real, configure no .env.local:");
      console.log("   ZAPI_TOKEN=seu_token");
      console.log("   ZAPI_INSTANCE=sua_instancia");

      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log(`✅ Simulação concluída para +${phoneNumber}`);
      return {
        success: true,
        message: "MODO SIMULAÇÃO - Configure ZAPI_TOKEN no .env.local para usar WhatsApp real",
        simulatedCode: verificationCode
      };
    }

  } catch (error) {
    console.error('❌ Erro ao enviar WhatsApp:', error);
    throw error;
  }
}

// Exemplo de implementação para Z-API
export async function sendWhatsAppVerificationZAPI(phoneNumber: string, verificationCode: string) {
  const ZAPI_TOKEN = process.env.ZAPI_TOKEN;
  const ZAPI_INSTANCE = process.env.ZAPI_INSTANCE;

  if (!ZAPI_TOKEN || !ZAPI_INSTANCE) {
    throw new Error('Configurações da Z-API não encontradas');
  }

  const message = `🔐 *Código de Verificação*\n\nSeu código de verificação é: *${verificationCode}*\n\nResponda com "OK" para confirmar a verificação.\n\n_Este código expira em 10 minutos._`;

  try {
    const response = await fetch(`https://api.z-api.io/instances/${ZAPI_INSTANCE}/token/${ZAPI_TOKEN}/send-text`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phone: phoneNumber,
        message: message,
      }),
    });

    if (!response.ok) {
      throw new Error('Falha ao enviar mensagem via Z-API');
    }

    return await response.json();
  } catch (error) {
    console.error('Erro na Z-API:', error);
    throw new Error('Erro ao enviar mensagem de verificação');
  }
}

// Função para enviar relatórios de FIIs via WhatsApp
export async function sendFiiReportToWhatsApp(phoneNumber: string, fundTicker: string, fundName: string, reportMonth: string, reportUrl: string) {
  try {
    console.log(`📱 Enviando relatório FII para +${phoneNumber}`);

    const message = `📊 *Novo Relatório Gerencial*\n\n🏢 *${fundTicker}*\n${fundName}\n\n📅 *Período:* ${reportMonth}\n\n📄 Acesse o relatório em:\n${reportUrl}\n\n_Você está recebendo este relatório porque segue este fundo imobiliário._`;

    // Se as variáveis de ambiente da Z-API estiverem configuradas, usar a API real
    if (process.env.ZAPI_TOKEN && process.env.ZAPI_INSTANCE) {
      console.log("🌐 Enviando relatório via Z-API...");

      const apiUrl = `https://api.z-api.io/instances/${process.env.ZAPI_INSTANCE}/token/${process.env.ZAPI_TOKEN}/send-text`;

      const payload = {
        phone: phoneNumber,
        message: message,
      };

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const responseText = await response.text();
      console.log("📡 Status da resposta:", response.status);

      if (!response.ok) {
        console.error("❌ Erro na Z-API:", responseText);
        throw new Error(`Falha na Z-API: ${response.status} - ${responseText}`);
      }

      const result = JSON.parse(responseText);
      console.log("✅ Relatório enviado via Z-API:", result);
      return result;
    }

    // Se as variáveis de UltraMsg estiverem configuradas
    else if (process.env.ULTRAMSG_TOKEN && process.env.ULTRAMSG_INSTANCE) {
      console.log("🌐 Enviando relatório via UltraMsg...");

      const response = await fetch(`https://api.ultramsg.com/${process.env.ULTRAMSG_INSTANCE}/messages/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: process.env.ULTRAMSG_TOKEN,
          to: phoneNumber,
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
      console.log("✅ Relatório enviado via UltraMsg:", result);
      return result;
    }

    // Se nenhuma API estiver configurada, simular (modo de desenvolvimento)
    else {
      console.log("⚠️ MODO SIMULAÇÃO - Relatório FII");
      console.log("🏢 Fundo:", fundTicker);
      console.log("📅 Período:", reportMonth);
      console.log("📱 Telefone:", phoneNumber);

      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log(`✅ Simulação concluída para relatório de ${fundTicker}`);
      return {
        success: true,
        message: "MODO SIMULAÇÃO - Configure as APIs para usar WhatsApp real",
        simulatedReport: { fundTicker, reportMonth, phoneNumber }
      };
    }

  } catch (error) {
    console.error('❌ Erro ao enviar relatório via WhatsApp:', error);
    throw error;
  }
}
// Função genérica para enviar qualquer mensagem via WhatsApp
export async function sendWhatsAppMessage(phoneNumber: string, message: string) {
  try {
    console.log(`📱 Enviando mensagem para +${phoneNumber}`);

    // Se as variáveis de ambiente da Z-API estiverem configuradas, usar a API real
    if (process.env.ZAPI_TOKEN && process.env.ZAPI_INSTANCE) {
      console.log("🌐 Enviando via Z-API...");

      const apiUrl = `https://api.z-api.io/instances/${process.env.ZAPI_INSTANCE}/token/${process.env.ZAPI_TOKEN}/send-text`;

      const payload = {
        phone: phoneNumber,
        message: message,
      };

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const responseText = await response.text();
      console.log("📡 Status da resposta:", response.status);

      if (!response.ok) {
        console.error("❌ Erro na Z-API:", responseText);
        throw new Error(`Falha na Z-API: ${response.status} - ${responseText}`);
      }

      const result = JSON.parse(responseText);
      console.log("✅ Mensagem enviada via Z-API");
      return result;
    }

    // Se as variáveis de UltraMsg estiverem configuradas
    else if (process.env.ULTRAMSG_TOKEN && process.env.ULTRAMSG_INSTANCE) {
      console.log("🌐 Enviando via UltraMsg...");

      // UltraMsg usa o token na URL, não no body
      const response = await fetch(`https://api.ultramsg.com/${process.env.ULTRAMSG_INSTANCE}/messages/chat?token=${process.env.ULTRAMSG_TOKEN}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: phoneNumber,
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
      console.log("✅ Mensagem enviada via UltraMsg");
      return result;
    }

    // Se nenhuma API estiver configurada, simular (modo de desenvolvimento)
    else {
      console.log("⚠️ MODO SIMULAÇÃO");
      console.log("📱 Telefone:", phoneNumber);
      console.log("💬 Mensagem:", message.substring(0, 100) + "...");

      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log(`✅ Simulação concluída`);
      return {
        success: true,
        message: "MODO SIMULAÇÃO - Configure as APIs para usar WhatsApp real"
      };
    }

  } catch (error) {
    console.error('❌ Erro ao enviar mensagem via WhatsApp:', error);
    throw error;
  }
}
