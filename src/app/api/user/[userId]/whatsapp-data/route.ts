import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from 'next/server';

import { db } from "@/db";
import { userTable } from "@/db/schema";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await context.params;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID é obrigatório' },
        { status: 400 }
      );
    }

    const user = await db
      .select({
        whatsappNumber: userTable.whatsappNumber,
        whatsappVerified: userTable.whatsappVerified,
      })
      .from(userTable)
      .where(eq(userTable.id, userId))
      .limit(1);

    if (user.length === 0) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      whatsappNumber: user[0].whatsappNumber,
      whatsappVerified: user[0].whatsappVerified,
    });

  } catch (error) {
    console.error('❌ Erro ao buscar dados do usuário:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      },
      { status: 500 }
    );
  }
}