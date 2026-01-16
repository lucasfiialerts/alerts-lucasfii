/**
 * API para buscar e processar alertas do FNet B3
 * Webhook para ser chamado periodicamente (EasyCron ou similar)
 */

import { NextRequest, NextResponse } from "next/server";
import { getRecentFNetAlerts, getFNetAlertsForFIIs, formatFNetAlertForWhatsApp } from "@/lib/fnet-service";
import { sendFiiReportToWhatsApp } from "@/lib/whatsapp-api";
import { db } from "@/db";
import { userTable, userFiiFollowTable, fiiFundTable } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    console.log("🚀 Iniciando busca de alertas FNet...");

    // Buscar usuários que têm alertas FNet ativos
    const usersWithFNetAlerts = await db
      .select({
        id: userTable.id,
        name: userTable.name,
        whatsappNumber: userTable.whatsappNumber,
        whatsappVerified: userTable.whatsappVerified,
        alertPreferencesFnet: userTable.alertPreferencesFnet,
      })
      .from(userTable)
      .where(eq(userTable.alertPreferencesFnet, true));

    console.log(`📊 Encontrados ${usersWithFNetAlerts.length} usuários com alertas FNet ativos`);

    if (usersWithFNetAlerts.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: "Nenhum usuário com alertas FNet ativos",
        processedUsers: 0,
        sentAlerts: 0
      });
    }

    let totalSentAlerts = 0;
    let processedUsers = 0;

    // Processar cada usuário
    for (const userWithAlerts of usersWithFNetAlerts) {
      try {
        // Verificar se o WhatsApp está verificado
        if (!userWithAlerts.whatsappVerified || !userWithAlerts.whatsappNumber) {
          console.log(`⚠️ Usuário ${userWithAlerts.name} não tem WhatsApp verificado. Pulando...`);
          continue;
        }

        // Buscar FIIs que o usuário acompanha
        const userFIIs = await db
          .select({ ticker: fiiFundTable.ticker })
          .from(userFiiFollowTable)
          .innerJoin(fiiFundTable, eq(userFiiFollowTable.fundId, fiiFundTable.id))
          .where(eq(userFiiFollowTable.userId, userWithAlerts.id));

        if (userFIIs.length === 0) {
          console.log(`📋 Usuário ${userWithAlerts.name} não acompanha nenhum FII. Pulando...`);
          continue;
        }

        const fiiCodes = userFIIs.map(f => f.ticker);
        console.log(`👀 Usuário ${userWithAlerts.name} acompanha: ${fiiCodes.join(", ")}`);

        // Buscar alertas FNet para os FIIs do usuário
        const fnetAlerts = await getFNetAlertsForFIIs(fiiCodes);

        if (fnetAlerts.length === 0) {
          console.log(`📭 Nenhum documento FNet encontrado para os FIIs de ${userWithAlerts.name}`);
          continue;
        }

        console.log(`📄 Encontrados ${fnetAlerts.length} documentos FNet para ${userWithAlerts.name}`);

        // Enviar alertas por WhatsApp
        for (const alert of fnetAlerts) {
          try {
            const message = formatFNetAlertForWhatsApp(alert);
            
            // Enviar mensagem formatada por WhatsApp
            // Como sendFiiReportToWhatsApp espera parâmetros específicos, vamos usar uma abordagem simples
            if (process.env.ZAPI_TOKEN && process.env.ZAPI_INSTANCE) {
              const apiUrl = `https://api.z-api.io/instances/${process.env.ZAPI_INSTANCE}/token/${process.env.ZAPI_TOKEN}/send-text`;
              
              const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  phone: userWithAlerts.whatsappNumber,
                  message: message
                })
              });

              if (!response.ok) {
                console.error(`Erro ao enviar WhatsApp para ${userWithAlerts.whatsappNumber}:`, await response.text());
              } else {
                console.log(`✅ Alerta FNet enviado para ${userWithAlerts.whatsappNumber}`);
              }
            } else {
              // Simulação para desenvolvimento
              console.log(`📱 [SIMULAÇÃO] Enviaria para ${userWithAlerts.whatsappNumber}:`);
              console.log(message);
            }
            
            console.log(`✅ Alerta FNet enviado para ${userWithAlerts.name}: ${alert.fundoName} - ${alert.documentType}`);
            totalSentAlerts++;
            
            // Delay entre mensagens para evitar spam
            await new Promise(resolve => setTimeout(resolve, 1000));
            
          } catch (error) {
            console.error(`❌ Erro ao enviar alerta FNet para ${userWithAlerts.name}:`, error);
          }
        }

        processedUsers++;

      } catch (error) {
        console.error(`❌ Erro ao processar usuário ${userWithAlerts.name}:`, error);
      }
    }

    const response = {
      success: true,
      message: "Processamento de alertas FNet concluído",
      processedUsers,
      sentAlerts: totalSentAlerts,
      timestamp: new Date().toISOString()
    };

    console.log("🎉 Alertas FNet processados:", response);

    return NextResponse.json(response);

  } catch (error) {
    console.error("❌ Erro geral no processamento de alertas FNet:", error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: "Erro interno do servidor",
        details: error instanceof Error ? error.message : "Erro desconhecido"
      },
      { status: 500 }
    );
  }
}

// Endpoint para buscar documentos FNet sem enviar alertas (para debug)
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const testMode = url.searchParams.get("test") === "true";
    const fiiCodes = url.searchParams.get("fiis")?.split(",") || [];

    console.log("🔍 Testando busca de documentos FNet...");

    let fnetAlerts;
    if (fiiCodes.length > 0) {
      console.log(`🎯 Buscando documentos para FIIs específicos: ${fiiCodes.join(", ")}`);
      fnetAlerts = await getFNetAlertsForFIIs(fiiCodes);
    } else {
      console.log("🌐 Buscando todos os documentos recentes");
      fnetAlerts = await getRecentFNetAlerts();
    }

    const response = {
      success: true,
      documents: fnetAlerts,
      count: fnetAlerts.length,
      timestamp: new Date().toISOString(),
      testMode
    };

    console.log(`📊 Encontrados ${fnetAlerts.length} documentos FNet`);

    return NextResponse.json(response);

  } catch (error) {
    console.error("❌ Erro ao buscar documentos FNet:", error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: "Erro ao buscar documentos FNet",
        details: error instanceof Error ? error.message : "Erro desconhecido"
      },
      { status: 500 }
    );
  }
}