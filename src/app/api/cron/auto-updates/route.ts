import { and, eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/db';
import { fiiFundTable, userFiiFollowTable, userTable } from '@/db/schema';
import { BrapiService } from '@/lib/brapi';

/**
 * API para enviar atualizações automáticas dos FIIs seguidos pelos usuários
 * 
 * POST /api/cron/auto-updates
 * 
 * Webhook do EasyCron - enviará atualizações automáticas para usuários com preferência ativa
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação do webhook (mesmo sistema dos outros crons)
    const secret = request.headers.get('x-webhook-secret');
    if (secret !== 'fii-alerts-webhook-2025-secure-key') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔔 Iniciando atualizações automáticas...');

    // 1. Buscar usuários com preferência de atualização automática ativa
    const usersWithAutoUpdate = await db
      .select({
        userId: userTable.id,
        userPhone: userTable.whatsappNumber,
        userVerified: userTable.whatsappVerified,
        email: userTable.email,
      })
      .from(userTable)
      .where(
        and(
          eq(userTable.alertPreferencesAutoUpdate, true),
          eq(userTable.whatsappVerified, true)
        )
      );

    if (usersWithAutoUpdate.length === 0) {
      console.log('👤 Nenhum usuário com atualização automática ativa');
      return NextResponse.json({
        success: true,
        message: 'Nenhum usuário com atualização automática ativa',
        stats: { usersProcessed: 0, messagesSet: 0 }
      });
    }

    console.log(`👥 Encontrados ${usersWithAutoUpdate.length} usuários com atualização automática ativa`);

    const results = [];
    let totalMessagesSent = 0;

    // 2. Para cada usuário, buscar seus FIIs seguidos e enviar atualização
    for (const user of usersWithAutoUpdate) {
      try {
        console.log(`\n🔍 Processando usuário: ${user.email}`);

        // Buscar FIIs seguidos pelo usuário
        const userFiis = await db
          .select({
            ticker: fiiFundTable.ticker,
            name: fiiFundTable.name,
          })
          .from(userFiiFollowTable)
          .innerJoin(fiiFundTable, eq(userFiiFollowTable.fundId, fiiFundTable.id))
          .where(eq(userFiiFollowTable.userId, user.userId))
          .limit(10); // Limitar a 10 FIIs para não sobrecarregar a mensagem

        if (userFiis.length === 0) {
          console.log(`⚠️ Usuário ${user.email} não segue nenhum FII`);
          continue;
        }

        console.log(`📊 Buscando dados de ${userFiis.length} FIIs...`);

        // 3. Buscar dados atuais dos FIIs na BRAPI
        const fiiUpdates = [];
        const brapiService = new BrapiService();
        const tickers = userFiis.map(fii => fii.ticker);
        
        try {
          console.log(`📈 Buscando dados de ${tickers.join(', ')}...`);
          const fiisData = await brapiService.getFiiData(tickers);
          
          for (const fiiData of fiisData) {
            const userFii = userFiis.find(f => f.ticker === fiiData.symbol);
            
            if (userFii && fiiData.regularMarketPrice !== undefined) {
              const changePercent = fiiData.regularMarketChangePercent || 0;
              fiiUpdates.push({
                ticker: fiiData.symbol,
                name: userFii.name,
                price: fiiData.regularMarketPrice,
                changePercent: changePercent,
                emoji: changePercent >= 0 ? '🟢' : '🔴'
              });
            }
          }
          
        } catch (error) {
          console.error(`❌ Erro ao buscar dados dos FIIs para ${user.email}:`, error);
          // Continuar com próximo usuário se falhar
          continue;
        }

        if (fiiUpdates.length === 0) {
          console.log(`⚠️ Nenhum dado válido encontrado para ${user.email}`);
          continue;
        }

        // 4. Criar mensagem de atualização automática
        const message = createAutoUpdateMessage(fiiUpdates);

        // 5. Enviar via WhatsApp
        const whatsappResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/send-whatsapp`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            phoneNumber: user.userPhone,
            message: message
          })
        });

        if (whatsappResponse.ok) {
          console.log(`✅ Atualização automática enviada para ${user.email}`);
          totalMessagesSent++;
          
          results.push({
            userId: user.userId,
            email: user.email,
            phone: user.userPhone,
            fiisCount: fiiUpdates.length,
            status: 'success'
          });
        } else {
          console.warn(`❌ Falha no envio para ${user.email}: ${whatsappResponse.status}`);
          results.push({
            userId: user.userId,
            email: user.email,
            phone: user.userPhone,
            fiisCount: fiiUpdates.length,
            status: 'failed',
            error: `HTTP ${whatsappResponse.status}`
          });
        }

        // Aguardar entre envios
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.error(`❌ Erro ao processar usuário ${user.email}:`, error);
        results.push({
          userId: user.userId,
          email: user.email,
          phone: user.userPhone,
          status: 'error',
          error: error instanceof Error ? error.message : 'Erro desconhecido'
        });
      }
    }

    console.log(`\n🎉 Atualizações automáticas concluídas: ${totalMessagesSent}/${usersWithAutoUpdate.length} enviadas`);

    return NextResponse.json({
      success: true,
      message: 'Atualizações automáticas processadas com sucesso',
      stats: {
        usersWithAutoUpdate: usersWithAutoUpdate.length,
        usersProcessed: results.length,
        messagesSent: totalMessagesSent,
        successRate: `${Math.round((totalMessagesSent / usersWithAutoUpdate.length) * 100)}%`
      },
      results
    });

  } catch (error) {
    console.error('❌ Erro nas atualizações automáticas:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Erro interno nas atualizações automáticas',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}

/**
 * Criar mensagem de atualização automática formatada
 */
function createAutoUpdateMessage(fiiUpdates: Array<{
  ticker: string;
  name: string;
  price: number;
  changePercent: number;
  emoji: string;
}>): string {
  const header = `📌 *Lista de acompanhamento que você segue*\n`;
  
  const fiiLines = fiiUpdates.map(fii => {
    const changeText = fii.changePercent >= 0 
      ? `+${fii.changePercent.toFixed(2)}%` 
      : `${fii.changePercent.toFixed(2)}%`;
    
    return `${fii.emoji} ${changeText} - ${fii.ticker} – R$ ${fii.price.toFixed(2)}`;
  });
  
  const footer = `\n📱 Acesse: lucasfiialerts.com`;
  
  return header + fiiLines.join('\n') + footer;
}

/**
 * GET - Health check e estatísticas
 */
export async function GET() {
  try {
    // Buscar usuários com atualização automática ativa
    const usersWithAutoUpdate = await db
      .select({
        userId: userTable.id,
        email: userTable.email,
        whatsappVerified: userTable.whatsappVerified,
      })
      .from(userTable)
      .where(eq(userTable.alertPreferencesAutoUpdate, true));

    const verifiedUsers = usersWithAutoUpdate.filter(u => u.whatsappVerified);

    return NextResponse.json({
      service: 'Auto Updates',
      status: 'active',
      stats: {
        totalUsersWithAutoUpdate: usersWithAutoUpdate.length,
        verifiedUsersWithAutoUpdate: verifiedUsers.length,
        readyToReceive: verifiedUsers.length
      },
      webhook: {
        endpoint: 'POST /api/cron/auto-updates',
        secret: 'x-webhook-secret: fii-alerts-webhook-2025-secure-key',
        frequency: 'A cada hora (recomendado)'
      },
      lastChecked: new Date().toISOString()
    });

  } catch (error) {
    return NextResponse.json({
      service: 'Auto Updates',
      status: 'error',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}
