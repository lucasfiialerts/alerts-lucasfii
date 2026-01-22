import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../../db';
import { userTable } from '../../../../db/schema';

export async function GET() {
  try {
    // Get users with their preferences
    const userPreferences = await db
      .select({
        id: userTable.id,
        email: userTable.email,
        whatsappNumber: userTable.whatsappNumber,
        alertPreferencesReports: userTable.alertPreferencesReports,
        alertPreferencesMarketClose: userTable.alertPreferencesMarketClose,
        alertPreferencesTreasury: userTable.alertPreferencesTreasury,
        alertPreferencesAutoUpdate: userTable.alertPreferencesAutoUpdate,
        alertPreferencesVariation: userTable.alertPreferencesVariation,
        alertPreferencesYield: userTable.alertPreferencesYield,
        alertPreferencesFnet: userTable.alertPreferencesFnet,
        alertPreferencesOnDemandQuote: userTable.alertPreferencesOnDemandQuote,
      })
      .from(userTable)
      .limit(10);

    return NextResponse.json({
      success: true,
      users: userPreferences,
    });

  } catch (error) {
    console.error('Erro ao buscar preferências:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
