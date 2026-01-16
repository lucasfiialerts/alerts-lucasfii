import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { userTable, fiiDividendTable, dividendAlertLogTable, userFiiFollowTable, fiiFundTable } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { brapiService } from "@/lib/brapi";

/**
 * API endpoint para cron job de alertas de dividendos
 * Verifica novos dividendos anunciados e envia alertas para usuários interessados
 */

export async function GET(request: NextRequest) {
  return processDividendAlerts(request);
}

export async function POST(request: NextRequest) {
  // Verificar autenticação do webhook
  const webhookSecret = request.headers.get('X-Webhook-Secret');
  const expectedSecret = process.env.EASYCRON_WEBHOOK_SECRET;
  
  if (expectedSecret && webhookSecret !== expectedSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return processDividendAlerts(request);
}

async function processDividendAlerts(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const testMode = searchParams.get("test") === "true";
  const forceTicker = searchParams.get("ticker"); // Para testar ticker específico

  console.log(`🎯 [${new Date().toISOString()}] Dividend Alerts Cron Job iniciado`);
  console.log(`🧪 Modo teste: ${testMode}`);
  console.log(`🎯 Ticker específico: ${forceTicker || 'todos'}`);

  try {
    // 1. Buscar usuários com alertas de dividendos ativados
    const users = await db
      .select({
        id: userTable.id,
        email: userTable.email,
        whatsappNumber: userTable.whatsappNumber,
        whatsappVerified: userTable.whatsappVerified,
        alertPreferencesYield: userTable.alertPreferencesYield,
      })
      .from(userTable)
      .where(eq(userTable.alertPreferencesYield, true));

    console.log(`👥 Usuários encontrados com alertas de dividendos: ${users.length}`);

    if (users.length === 0) {
      console.log('⚠️ Nenhum usuário com alertas de dividendos ativados');
      return NextResponse.json({
        success: true,
        message: 'Nenhum usuário com alertas de dividendos ativados',
        timestamp: new Date().toISOString()
      });
    }

    // 2. Para cada usuário, buscar os FIIs que ele acompanha
    let totalAlerts = 0;
    const results = [];

    for (const user of users) {
      console.log(`\n🔍 Processando usuário: ${user.email}`);
      
      try {
        // Buscar FIIs que o usuário acompanha
        const userFiis = await db
          .select({
            ticker: fiiFundTable.ticker,
            name: fiiFundTable.name,
          })
          .from(userFiiFollowTable)
          .innerJoin(fiiFundTable, eq(userFiiFollowTable.fundId, fiiFundTable.id))
          .where(eq(userFiiFollowTable.userId, user.id));

        if (userFiis.length === 0) {
          console.log(`⚠️ Usuário ${user.email} não acompanha nenhum FII`);
          continue;
        }

        console.log(`📊 FIIs acompanhados por ${user.email}: ${userFiis.map((f: any) => f.ticker).join(', ')}`);

        // Se forceTicker especificado, filtrar apenas esse ticker
        const tickers = forceTicker 
          ? userFiis.filter((f: any) => f.ticker === forceTicker)
          : userFiis;

        if (tickers.length === 0 && forceTicker) {
          console.log(`⚠️ Usuário não acompanha o ticker ${forceTicker}`);
          continue;
        }

        // 3. Buscar dividendos dos FIIs via BrAPI
        const tickerCodes = tickers.map((f: any) => f.ticker);
        const fiiData = await brapiService.getFiiDividends(tickerCodes);

        // 4. Processar dividendos encontrados
        for (const fii of fiiData) {
          if (!fii.dividendsData?.cashDividends?.length) {
            continue;
          }

          console.log(`💰 Processando dividendos de ${fii.symbol}...`);

          for (const dividend of fii.dividendsData.cashDividends) {
            // Verificar se o dividendo é recente (últimos 30 dias)
            const paymentDate = new Date(dividend.paymentDate);
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            if (paymentDate < thirtyDaysAgo && !testMode) {
              console.log(`⏭️ Dividendo de ${fii.symbol} muito antigo: ${paymentDate.toLocaleDateString()}`);
              continue;
            }

            // Verificar se o dividendo já existe no banco
            const existingDividend = await db
              .select()
              .from(fiiDividendTable)
              .where(and(
                eq(fiiDividendTable.ticker, fii.symbol),
                eq(fiiDividendTable.paymentDate, paymentDate),
                eq(fiiDividendTable.rate, dividend.rate.toString()),
                eq(fiiDividendTable.relatedTo, dividend.relatedTo)
              ));

            let dividendId;

            if (existingDividend.length === 0) {
              // Novo dividendo - inserir no banco
              console.log(`✨ Novo dividendo encontrado: ${fii.symbol} - R$ ${dividend.rate} (${dividend.relatedTo})`);
              
              const newDividend = await db
                .insert(fiiDividendTable)
                .values({
                  ticker: fii.symbol,
                  assetIssued: dividend.assetIssued,
                  paymentDate: paymentDate,
                  rate: dividend.rate.toString(),
                  relatedTo: dividend.relatedTo,
                  label: dividend.label,
                  lastDatePrior: dividend.lastDatePrior ? new Date(dividend.lastDatePrior) : null,
                  remarks: dividend.remarks || '',
                })
                .returning({ id: fiiDividendTable.id });

              dividendId = newDividend[0].id;
            } else {
              dividendId = existingDividend[0].id;
              console.log(`📋 Dividendo já existe: ${fii.symbol} - R$ ${dividend.rate}`);
            }

            // Verificar se já foi enviado alerta para este usuário
            const existingAlert = await db
              .select()
              .from(dividendAlertLogTable)
              .where(and(
                eq(dividendAlertLogTable.userId, user.id),
                eq(dividendAlertLogTable.dividendId, dividendId)
              ));

            if (existingAlert.length > 0 && !testMode) {
              console.log(`⏭️ Alerta já enviado para ${user.email} sobre ${fii.symbol}`);
              continue;
            }

            // 5. Enviar alerta via WhatsApp
            if (user.whatsappVerified && user.whatsappNumber) {
              const message = formatDividendMessage(fii.symbol, dividend, fii.shortName);
              
              console.log(`📱 Enviando alerta de dividendo para ${user.email}...`);
              
              if (testMode) {
                console.log(`🧪 [TESTE] Mensagem que seria enviada:`);
                console.log(message);
                totalAlerts++;
                
                results.push({
                  user: user.email,
                  ticker: fii.symbol,
                  dividend: `R$ ${dividend.rate}`,
                  status: 'test_mode'
                });
              } else {
                try {
                  const whatsappResponse = await sendWhatsAppMessage(user.whatsappNumber, message);
                  
                  // Registrar alerta enviado
                  await db.insert(dividendAlertLogTable).values({
                    userId: user.id,
                    ticker: fii.symbol,
                    dividendId: dividendId,
                    message: message,
                    whatsappMessageId: whatsappResponse.id?.toString(),
                    status: 'sent'
                  });

                  console.log(`✅ ${user.email} - Alerta enviado (ID: ${whatsappResponse.id})`);
                  totalAlerts++;
                  
                  results.push({
                    user: user.email,
                    ticker: fii.symbol,
                    dividend: `R$ ${dividend.rate}`,
                    messageId: whatsappResponse.id,
                    status: 'sent'
                  });

                } catch (error) {
                  console.error(`❌ Erro ao enviar para ${user.email}:`, error);
                  
                  // Registrar erro
                  await db.insert(dividendAlertLogTable).values({
                    userId: user.id,
                    ticker: fii.symbol,
                    dividendId: dividendId,
                    message: message,
                    status: 'failed'
                  });

                  results.push({
                    user: user.email,
                    ticker: fii.symbol,
                    dividend: `R$ ${dividend.rate}`,
                    error: error instanceof Error ? error.message : String(error),
                    status: 'failed'
                  });
                }
              }
            } else {
              console.log(`⚠️ WhatsApp não verificado para ${user.email}`);
            }
          }
        }

      } catch (error) {
        console.error(`❌ Erro ao processar usuário ${user.email}:`, error);
        results.push({
          user: user.email,
          error: error instanceof Error ? error.message : String(error),
          status: 'error'
        });
      }
    }

    console.log(`\n📊 Resumo: ${totalAlerts} alertas de dividendos enviados`);

    return NextResponse.json({
      success: true,
      alertsSent: totalAlerts,
      testMode,
      timestamp: new Date().toISOString(),
      results
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('❌ Erro no cron job de dividendos:', errorMessage);

    return NextResponse.json({
      success: false,
      error: errorMessage,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

function formatDividendMessage(ticker: string, dividend: any, fundName: string): string {
  const paymentDate = new Date(dividend.paymentDate).toLocaleDateString('pt-BR');
  const value = parseFloat(dividend.rate).toFixed(2);
  
  return `💰 *DIVIDENDO ANUNCIADO*

🏢 *${ticker}* - ${fundName}
💵 Valor: *R$ ${value}*
📅 Pagamento: ${paymentDate}
📋 Período: ${dividend.relatedTo}
🏷️ Tipo: ${dividend.label}

${dividend.lastDatePrior ? `📌 Data limite: ${new Date(dividend.lastDatePrior).toLocaleDateString('pt-BR')}` : ''}

🌐 Acompanhe em: https://lucasfiialerts.com.br

_Enviado por Lucas FII Alerts_`;
}

async function sendWhatsAppMessage(phoneNumber: string, message: string) {
  const response = await fetch(`${process.env.ULTRAMSG_INSTANCE_URL}/messages/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      token: process.env.ULTRAMSG_TOKEN || '',
      to: phoneNumber,
      body: message,
    }),
  });

  if (!response.ok) {
    throw new Error(`WhatsApp API error: ${response.status}`);
  }

  return response.json();
}