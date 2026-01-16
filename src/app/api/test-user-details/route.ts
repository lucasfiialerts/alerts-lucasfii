import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../db';
import { userTable, userFiiFollowTable, fiiFundTable } from '../../../db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'UserId required' }, { status: 400 });
    }

    // Buscar dados do usuário
    const users = await db
      .select({
        id: userTable.id,
        email: userTable.email,
        name: userTable.name,
        whatsappNumber: userTable.whatsappNumber,
        whatsappVerified: userTable.whatsappVerified,
        alertPreferencesFnet: userTable.alertPreferencesFnet,
      })
      .from(userTable)
      .where(eq(userTable.id, userId));

    if (users.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const user = users[0];

    // Buscar FIIs seguidos pelo usuário
    const userFIIs = await db
      .select({ ticker: fiiFundTable.ticker })
      .from(userFiiFollowTable)
      .innerJoin(fiiFundTable, eq(userFiiFollowTable.fundId, fiiFundTable.id))
      .where(eq(userFiiFollowTable.userId, userId));

    const followedFIIs = userFIIs.map(f => f.ticker);

    return NextResponse.json({
      ...user,
      followedFIIs
    });

  } catch (error) {
    console.error('Erro ao buscar detalhes do usuário:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}