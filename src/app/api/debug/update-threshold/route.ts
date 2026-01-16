import { NextRequest, NextResponse } from 'next/server';

import { db } from "@/db";
import { userFiiFollowTable } from "@/db/schema";

export async function POST(request: NextRequest) {
  try {
    const { threshold } = await request.json();
    
    if (!threshold) {
      return NextResponse.json(
        { error: 'Threshold é obrigatório' },
        { status: 400 }
      );
    }

    // Atualizar threshold para TODOS os usuários (para teste)
    const result = await db
      .update(userFiiFollowTable)
      .set({
        minVariationPercent: threshold.toString(),
      })
      .returning({
        id: userFiiFollowTable.id,
        userId: userFiiFollowTable.userId,
        minVariationPercent: userFiiFollowTable.minVariationPercent,
      });

    console.log(`🔧 Threshold atualizado para ${threshold}% em ${result.length} registros`);

    return NextResponse.json({
      success: true,
      message: `Threshold atualizado para ${threshold}%`,
      updated: result.length,
      records: result,
    });

  } catch (error) {
    console.error('❌ Erro ao atualizar threshold:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      },
      { status: 500 }
    );
  }
}