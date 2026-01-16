/**
 * API para buscar e enviar alertas de relatórios da FNET B3
 * Webhook para ser chamado periodicamente (EasyCron ou similar)
 * 
 * Este endpoint busca APENAS relatórios (Relatório Gerencial, Outros Relatórios, etc)
 * SEM resumo de IA - apenas notifica sobre a disponibilidade do documento
 * 
 * Endpoint: POST /api/cron/fnet-relatorios
 * 
 * Headers opcionais:
 * - x-webhook-secret: chave de segurança
 * 
 * Body opcional:
 * - hoursAgo: número de horas para buscar (default: 24)
 * - testMode: se true, não envia mensagens reais
 */

import { NextRequest, NextResponse } from "next/server";
import { 
  getRecentRelatorios, 
  getRelatoriosForFIIs, 
  formatRelatorioSimplesForWhatsApp,
  FNetRelatorioSimples 
} from "@/lib/fnet-service";
import { db } from "@/db";
import { userTable, userFiiFollowTable, fiiFundTable, sentAlertTable } from "@/db/schema";
import { eq, and } from "drizzle-orm";

const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || 'sua-chave-secreta';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    console.log("📋 Iniciando busca de relatórios FNET (sem IA)...");

    // Verificar autorização
    const providedSecret = request.headers.get('x-webhook-secret');
    const isAuthorized = providedSecret === WEBHOOK_SECRET || 
                        process.env.NODE_ENV === 'development';
    
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Parâmetros opcionais
    let hoursAgo = 24;
    let testMode = false;
    
    try {
      const body = await request.json();
      hoursAgo = body.hoursAgo || 24;
      testMode = body.testMode || false;
    } catch {
      // Sem body, usar defaults
    }

    // Buscar relatórios recentes da API FNET
    const relatorios = await getRecentRelatorios(hoursAgo);
    console.log(`📊 Encontrados ${relatorios.length} relatórios nas últimas ${hoursAgo}h`);

    if (relatorios.length === 0) {
      return NextResponse.json({
        success: true,
        message: "Nenhum relatório encontrado no período",
        data: {
          relatoriosEncontrados: 0,
          alertasEnviados: 0,
          usuariosProcessados: 0
        },
        executionTimeMs: Date.now() - startTime
      });
    }

    // Buscar usuários que têm alertas FNET ativos
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

    console.log(`👥 Encontrados ${usersWithFNetAlerts.length} usuários com alertas FNET ativos`);

    let totalSentAlerts = 0;
    let processedUsers = 0;
    const sentDetails: Array<{user: string, relatorio: string, ticker: string}> = [];

    // Processar cada usuário
    for (const user of usersWithFNetAlerts) {
      try {
        // Verificar se o WhatsApp está verificado
        if (!user.whatsappVerified || !user.whatsappNumber) {
          console.log(`⚠️ Usuário ${user.name} não tem WhatsApp verificado. Pulando...`);
          continue;
        }

        // Buscar FIIs que o usuário acompanha
        const userFIIs = await db
          .select({ ticker: fiiFundTable.ticker })
          .from(userFiiFollowTable)
          .innerJoin(fiiFundTable, eq(userFiiFollowTable.fundId, fiiFundTable.id))
          .where(eq(userFiiFollowTable.userId, user.id));

        if (userFIIs.length === 0) {
          console.log(`📋 Usuário ${user.name} não acompanha nenhum FII. Pulando...`);
          continue;
        }

        const tickers = userFIIs.map(f => f.ticker);
        
        // Filtrar relatórios que correspondem aos FIIs do usuário
        const userRelatorios = filterRelatoriosByTickers(relatorios, tickers);

        if (userRelatorios.length === 0) {
          console.log(`📭 Nenhum relatório para os FIIs de ${user.name}`);
          continue;
        }

        console.log(`📄 Encontrados ${userRelatorios.length} relatórios para ${user.name}`);

        // Enviar alertas por WhatsApp
        for (const relatorio of userRelatorios) {
          try {
            // Verificar se já foi enviado (evitar duplicatas)
            const alertKey = `fnet-relatorio-${relatorio.id}`;
            const existingAlert = await db
              .select()
              .from(sentAlertTable)
              .where(and(
                eq(sentAlertTable.userId, user.id),
                eq(sentAlertTable.alertKey, alertKey)
              ))
              .limit(1);

            if (existingAlert.length > 0) {
              console.log(`⏭️ Alerta já enviado para ${user.name}: ${relatorio.nomePregao}`);
              continue;
            }

            const message = formatRelatorioSimplesForWhatsApp(relatorio);
            
            if (!testMode && process.env.ZAPI_TOKEN && process.env.ZAPI_INSTANCE) {
              const apiUrl = `https://api.z-api.io/instances/${process.env.ZAPI_INSTANCE}/token/${process.env.ZAPI_TOKEN}/send-text`;
              
              const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  phone: user.whatsappNumber,
                  message: message
                })
              });

              if (!response.ok) {
                console.error(`❌ Erro ao enviar WhatsApp para ${user.whatsappNumber}:`, await response.text());
                continue;
              }
              
              console.log(`✅ Relatório enviado para ${user.name}: ${relatorio.nomePregao}`);
            } else {
              console.log(`📱 [${testMode ? 'TESTE' : 'SIMULAÇÃO'}] Enviaria para ${user.whatsappNumber}:`);
              console.log(message.substring(0, 100) + '...');
            }

            // Registrar alerta como enviado
            await db.insert(sentAlertTable).values({
              userId: user.id,
              alertKey: alertKey,
              alertType: 'fnet-relatorio',
              sentAt: new Date()
            });
            
            totalSentAlerts++;
            sentDetails.push({
              user: user.name || 'Desconhecido',
              relatorio: relatorio.tipo,
              ticker: relatorio.nomePregao
            });
            
            // Delay entre mensagens
            await new Promise(resolve => setTimeout(resolve, 1000));
            
          } catch (error) {
            console.error(`❌ Erro ao enviar relatório para ${user.name}:`, error);
          }
        }

        processedUsers++;

      } catch (error) {
        console.error(`❌ Erro ao processar usuário ${user.name}:`, error);
      }
    }

    const executionTime = Date.now() - startTime;

    const response = {
      success: true,
      message: "Processamento de relatórios FNET concluído",
      data: {
        relatoriosEncontrados: relatorios.length,
        alertasEnviados: totalSentAlerts,
        usuariosProcessados: processedUsers,
        detalhes: sentDetails.slice(0, 10) // Limitar para não sobrecarregar resposta
      },
      testMode,
      executionTimeMs: executionTime,
      timestamp: new Date().toISOString()
    };

    console.log("🎉 Relatórios FNET processados:", response);

    return NextResponse.json(response);

  } catch (error) {
    console.error("❌ Erro geral no processamento de relatórios FNET:", error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido",
      executionTimeMs: Date.now() - startTime
    }, { status: 500 });
  }
}

// Endpoint GET para verificação de saúde e teste
export async function GET(request: NextRequest) {
  try {
    // Buscar relatórios recentes para demonstração
    const relatorios = await getRecentRelatorios(24);
    
    return NextResponse.json({
      status: 'healthy',
      service: 'FNET Relatórios Webhook',
      description: 'Busca relatórios gerenciais da API FNET B3 e envia alertas (sem resumo de IA)',
      endpoint: 'https://fnet.bmfbovespa.com.br/fnet/publico/abrirGerenciadorDocumentosCVM',
      relatoriosRecentes: relatorios.length,
      amostra: relatorios.slice(0, 3).map(r => ({
        fundo: r.nomePregao || r.fundo.substring(0, 50),
        tipo: r.tipo,
        data: r.dataEntrega
      })),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}

/**
 * Filtra relatórios por tickers do usuário
 */
function filterRelatoriosByTickers(
  relatorios: FNetRelatorioSimples[], 
  tickers: string[]
): FNetRelatorioSimples[] {
  const tickersNormalized = tickers.map(t => 
    t.toLowerCase().replace('11', '').replace('12', '').replace('13', '')
  );
  
  return relatorios.filter(rel => {
    const fundoLower = rel.fundo.toLowerCase();
    const pregaoLower = (rel.nomePregao || '').toLowerCase();
    
    return tickersNormalized.some(ticker => 
      fundoLower.includes(ticker) || 
      pregaoLower.includes(ticker) ||
      pregaoLower.includes(`fii ${ticker}`)
    );
  });
}
