import { eq } from "drizzle-orm";
import { NextResponse } from 'next/server';

import { db } from "@/db";
import { fiiFundTable, userFiiFollowTable } from "@/db/schema";

export async function GET() {
  try {
    console.log('🔍 Debug: Buscando todos os registros de userFiiFollow...');
    
    // Buscar TODOS os registros primeiro
    const allFollows = await db
      .select({
        id: userFiiFollowTable.id,
        userId: userFiiFollowTable.userId,
        fundId: userFiiFollowTable.fundId,
        notificationsEnabled: userFiiFollowTable.notificationsEnabled,
        priceAlertEnabled: userFiiFollowTable.priceAlertEnabled,
        minVariationPercent: userFiiFollowTable.minVariationPercent,
        alertFrequency: userFiiFollowTable.alertFrequency,
        createdAt: userFiiFollowTable.createdAt,
      })
      .from(userFiiFollowTable);

    console.log(`📊 Total de follows encontrados: ${allFollows.length}`);

    // Buscar com JOIN para pegar dados dos fundos
    const followsWithFunds = await db
      .select({
        id: userFiiFollowTable.id,
        userId: userFiiFollowTable.userId,
        fundId: userFiiFollowTable.fundId,
        ticker: fiiFundTable.ticker,
        name: fiiFundTable.name,
        notificationsEnabled: userFiiFollowTable.notificationsEnabled,
        priceAlertEnabled: userFiiFollowTable.priceAlertEnabled,
        minVariationPercent: userFiiFollowTable.minVariationPercent,
        alertFrequency: userFiiFollowTable.alertFrequency,
      })
      .from(userFiiFollowTable)
      .innerJoin(fiiFundTable, eq(userFiiFollowTable.fundId, fiiFundTable.id));

    console.log(`📊 Follows com fundos: ${followsWithFunds.length}`);

    return NextResponse.json({
      success: true,
      totalFollows: allFollows.length,
      followsWithFundsCount: followsWithFunds.length,
      allFollows,
      followsWithFunds,
    });

  } catch (error) {
    console.error('❌ Erro no debug:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      },
      { status: 500 }
    );
  }
}