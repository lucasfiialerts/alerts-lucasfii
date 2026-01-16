import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { userTable } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * API endpoint para cron job de alertas de Bitcoin
 * Executa verificações automáticas de variação de preço
 */
export async function GET(request: NextRequest) {
  return processBitcoinAlerts(request);
}

/**
 * Webhook para EasyCron ou outros serviços (padrão dos outros alertas)
 */
export async function POST(request: NextRequest) {
  // Verificar autenticação do webhook (igual aos outros)
  const secret = request.headers.get('x-webhook-secret');
  if (secret && secret !== 'fii-alerts-webhook-2025-secure-key') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return processBitcoinAlerts(request);
}

async function processBitcoinAlerts(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const testMode = searchParams.get("test") === "true";
  const forceAlert = searchParams.get("force") === "true";

  console.log(`🚀 [${new Date().toISOString()}] Bitcoin Alerts Cron Job iniciado`);
  console.log(`🧪 Modo teste: ${testMode}`);
  console.log(`🔥 Força alerta: ${forceAlert}`);

  try {
    // 1. Buscar usuários com alertas Bitcoin ativados
    const users = await db
      .select({
        id: userTable.id,
        email: userTable.email,
        whatsappNumber: userTable.whatsappNumber,
        whatsappVerified: userTable.whatsappVerified,
        alertPreferencesBitcoin: userTable.alertPreferencesBitcoin,
      })
      .from(userTable)
      .where(eq(userTable.alertPreferencesBitcoin, true));

    // Filtrar usuários elegíveis
    const eligibleUsers = users.filter(user => 
      user.whatsappVerified && 
      user.whatsappNumber && 
      user.whatsappNumber.trim() !== ''
    );

    console.log(`👥 Usuários encontrados: ${users.length}`);
    console.log(`✅ Usuários elegíveis: ${eligibleUsers.length}`);

    if (eligibleUsers.length === 0) {
      return NextResponse.json({
        success: true,
        message: "Nenhum usuário elegível encontrado",
        usersFound: users.length,
        usersEligible: 0,
        alertsSent: 0
      });
    }

    // 2. Buscar dados atuais do Bitcoin
    const controller = new AbortController();
    setTimeout(() => controller.abort(), 10000);

    const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd,brl&include_24hr_change=true', {
      headers: {
        'Accept': 'application/json',
      },
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    const bitcoin = data.bitcoin;
    const variation = bitcoin.usd_24h_change || 0;

    console.log(`💰 Bitcoin: $${bitcoin.usd.toLocaleString()} (${variation.toFixed(2)}%)`);

    // 3. Verificar se deve enviar alerta
    const variationThreshold = 0; // Disparar em qualquer variação
    const shouldAlert = Math.abs(variation) >= variationThreshold || forceAlert;

    if (!shouldAlert) {
      console.log(`📊 Variação insuficiente: ${variation.toFixed(2)}% (limite: ±${variationThreshold}%)`);
      return NextResponse.json({
        success: true,
        message: "Variação insuficiente para alerta",
        variation: variation.toFixed(2),
        threshold: variationThreshold,
        price: bitcoin.usd,
        usersEligible: eligibleUsers.length,
        alertsSent: 0
      });
    }

    console.log(`🚨 Variação significativa detectada: ${variation.toFixed(2)}%`);

    // 4. Formatar mensagem
    const isPositive = variation > 0;
    const emoji = isPositive ? '📈' : '📉';
    const trend = isPositive ? 'SUBIU' : 'DESCEU';
    const alertType = forceAlert ? 'Teste do Sistema' : 'Variação Significativa';

    const message = `₿ *Bitcoin Alert - ${alertType}*

${emoji} *O Bitcoin ${trend} ${Math.abs(variation).toFixed(2)}%*

💰 *Preço Atual:*
🇺🇸 USD: $${bitcoin.usd.toLocaleString()}
🇧🇷 BRL: R$${bitcoin.brl.toLocaleString()}

📊 *Variação 24h:* ${variation.toFixed(2)}%

⏰ *${new Date().toLocaleString('pt-BR', { 
  timeZone: 'America/Sao_Paulo',
  year: 'numeric',
  month: '2-digit', 
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit'
})}*

${forceAlert ? '_Alerta de teste - Sistema funcionando_' : '_Alerta automático - Variação significativa detectada_'} ₿

🌐 Acompanhe em: https://lucasfiialerts.com.br

Para gerenciar alertas: Configurações > Bitcoin`;

    // 5. Enviar alertas via API WhatsApp
    let successCount = 0;
    let errorCount = 0;
    const results = [];

    if (!testMode) {
      // Verificar credenciais ULTRAMSG
      if (!process.env.ULTRAMSG_TOKEN || !process.env.ULTRAMSG_INSTANCE) {
        throw new Error('Credenciais ULTRAMSG não configuradas');
      }

      for (const user of eligibleUsers) {
        try {
          console.log(`📱 Enviando para ${user.email}...`);

          const sendResponse = await fetch(`https://api.ultramsg.com/${process.env.ULTRAMSG_INSTANCE}/messages/chat?token=${process.env.ULTRAMSG_TOKEN}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              to: user.whatsappNumber,
              body: message
            })
          });

          if (sendResponse.ok) {
            const result = await sendResponse.json();
            
            if (result.sent === 'true' || result.sent === true) {
              console.log(`✅ ${user.email} - Enviado (ID: ${result.id})`);
              successCount++;
              results.push({
                email: user.email,
                status: 'success',
                messageId: result.id
              });
            } else {
              console.log(`⚠️ ${user.email} - Resposta inesperada:`, result);
              errorCount++;
              results.push({
                email: user.email,
                status: 'error',
                error: 'Resposta inesperada da API'
              });
            }
          } else {
            const errorText = await sendResponse.text();
            console.log(`❌ ${user.email} - Erro HTTP: ${errorText}`);
            errorCount++;
            results.push({
              email: user.email,
              status: 'error',
              error: `HTTP ${sendResponse.status}: ${errorText}`
            });
          }

          // Delay entre envios
          await new Promise(resolve => setTimeout(resolve, 1000));

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.log(`❌ ${user.email} - Exceção: ${errorMessage}`);
          errorCount++;
          results.push({
            email: user.email,
            status: 'error',
            error: errorMessage
          });
        }
      }
    } else {
      // Modo teste - simular sucesso
      console.log('🧪 Modo teste ativo - simulando envios...');
      successCount = eligibleUsers.length;
      results.push(...eligibleUsers.map(user => ({
        email: user.email,
        status: 'simulated',
        messageId: 'TEST'
      })));
    }

    // 6. Resposta final
    console.log(`📊 Resumo: ${successCount} sucessos, ${errorCount} erros`);

    return NextResponse.json({
      success: true,
      message: "Bitcoin alerts processados",
      bitcoin: {
        price: bitcoin.usd,
        variation: variation.toFixed(2),
        threshold: variationThreshold,
        shouldAlert
      },
      users: {
        found: users.length,
        eligible: eligibleUsers.length,
        processed: eligibleUsers.length
      },
      alerts: {
        sent: successCount,
        errors: errorCount,
        testMode
      },
      results
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('❌ Erro no cron job Bitcoin:', errorMessage);

    return NextResponse.json({
      success: false,
      error: errorMessage,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
