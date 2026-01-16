import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { userFiiFollowTable, userTable, fiiFundTable } from '@/db/schema';
import { and, eq } from 'drizzle-orm';

/**
 * Endpoint para buscar usuários com alertas ativos
 */
export async function GET() {
  try {
    const users = await db
      .select({
        userId: userTable.id,
        userName: userTable.name,
        userEmail: userTable.email,
        alertPreferencesReports: userTable.alertPreferencesReports,
        alertPreferencesVariation: userTable.alertPreferencesVariation,
        ticker: fiiFundTable.ticker,
        fundName: fiiFundTable.name,
        notificationsEnabled: userFiiFollowTable.notificationsEnabled,
        priceAlertEnabled: userFiiFollowTable.priceAlertEnabled
      })
      .from(userFiiFollowTable)
      .innerJoin(userTable, eq(userFiiFollowTable.userId, userTable.id))
      .innerJoin(fiiFundTable, eq(userFiiFollowTable.fundId, fiiFundTable.id))
      .where(
        and(
          eq(userFiiFollowTable.notificationsEnabled, true),
          eq(userFiiFollowTable.priceAlertEnabled, true)
        )
      )
      .limit(5);

    return NextResponse.json({
      success: true,
      message: 'Usuários com alertas encontrados',
      users: users,
      total: users.length,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Erro ao buscar usuários:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}