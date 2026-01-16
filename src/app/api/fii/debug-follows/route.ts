import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/db';
import { fiiFundTable, userFiiFollowTable, userTable } from '@/db/schema';

/**
 * API para debug dos follows
 * 
 * GET /api/fii/debug-follows
 */

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Debugando follows...');

    // Buscar todos os usuários que seguem FIIs
    const usersWithFollows = await db
      .select({
        userId: userFiiFollowTable.userId,
        userPhone: userTable.whatsappNumber,
        userWhatsappVerified: userTable.whatsappVerified,
        fundId: fiiFundTable.id,
        ticker: fiiFundTable.ticker,
        fundName: fiiFundTable.name,
        notifications: userFiiFollowTable.notificationsEnabled,
        followedAt: userFiiFollowTable.createdAt
      })
      .from(userFiiFollowTable)
      .innerJoin(fiiFundTable, eq(userFiiFollowTable.fundId, fiiFundTable.id))
      .leftJoin(userTable, eq(userFiiFollowTable.userId, userTable.id))
      .where(eq(userFiiFollowTable.notificationsEnabled, true));

    return NextResponse.json({
      success: true,
      message: 'Debug de follows concluído',
      data: {
        totalFollows: usersWithFollows.length,
        follows: usersWithFollows
      }
    });

  } catch (error) {
    console.error('❌ Erro no debug de follows:', error);
    return NextResponse.json({
      success: false,
      error: 'Falha no debug de follows',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}