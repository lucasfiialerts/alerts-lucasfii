import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/db';
import { userTable } from '@/db/schema';
import { auth } from '@/lib/auth';

/**
 * API para buscar preferências de alertas do usuário
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      );
    }

    // Buscar preferências do usuário
    const user = await db
      .select({
        alertPreferencesReports: userTable.alertPreferencesReports,
        alertPreferencesMarketClose: userTable.alertPreferencesMarketClose,
        alertPreferencesTreasury: userTable.alertPreferencesTreasury,
        alertPreferencesAutoUpdate: userTable.alertPreferencesAutoUpdate,
        alertPreferencesVariation: userTable.alertPreferencesVariation,
        alertPreferencesYield: userTable.alertPreferencesYield,
        alertPreferencesFnet: userTable.alertPreferencesFnet,
        alertPreferencesBitcoin: userTable.alertPreferencesBitcoin,
        alertPreferencesStatusInvest: userTable.alertPreferencesStatusInvest,
      })
      .from(userTable)
      .where(eq(userTable.id, session.user.id))
      .limit(1);

    if (user.length === 0) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      preferences: user[0],
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Erro ao buscar preferências:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

/**
 * API para atualizar preferências de alertas do usuário
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      alertPreferencesReports,
      alertPreferencesMarketClose,
      alertPreferencesTreasury,
      alertPreferencesAutoUpdate,
      alertPreferencesVariation,
      alertPreferencesYield,
      alertPreferencesFnet,
      alertPreferencesBitcoin,
      alertPreferencesStatusInvest
    } = body;

    // Atualizar preferências no banco
    const result = await db
      .update(userTable)
      .set({
        alertPreferencesReports: alertPreferencesReports ?? undefined,
        alertPreferencesMarketClose: alertPreferencesMarketClose ?? undefined,
        alertPreferencesTreasury: alertPreferencesTreasury ?? undefined,
        alertPreferencesAutoUpdate: alertPreferencesAutoUpdate ?? undefined,
        alertPreferencesVariation: alertPreferencesVariation ?? undefined,
        alertPreferencesYield: alertPreferencesYield ?? undefined,
        alertPreferencesFnet: alertPreferencesFnet ?? undefined,
        alertPreferencesBitcoin: alertPreferencesBitcoin ?? undefined,
        alertPreferencesStatusInvest: alertPreferencesStatusInvest ?? undefined,
        updatedAt: new Date()
      })
      .where(eq(userTable.id, session.user.id))
      .returning();

    if (result.length === 0) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    console.log(`✅ Preferências atualizadas para usuário ${session.user.id}`);

    return NextResponse.json({
      success: true,
      message: 'Preferências atualizadas com sucesso',
      preferences: {
        alertPreferencesReports: result[0].alertPreferencesReports,
        alertPreferencesMarketClose: result[0].alertPreferencesMarketClose,
        alertPreferencesTreasury: result[0].alertPreferencesTreasury,
        alertPreferencesAutoUpdate: result[0].alertPreferencesAutoUpdate,
        alertPreferencesVariation: result[0].alertPreferencesVariation,
        alertPreferencesYield: result[0].alertPreferencesYield,
        alertPreferencesFnet: result[0].alertPreferencesFnet,
        alertPreferencesBitcoin: result[0].alertPreferencesBitcoin,
        alertPreferencesStatusInvest: result[0].alertPreferencesStatusInvest,
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Erro ao atualizar preferências:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
