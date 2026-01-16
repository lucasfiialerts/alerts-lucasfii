import { NextResponse } from 'next/server';
import { db } from '@/db';
import { userFiiFollowTable } from '@/db/schema';
import { eq } from 'drizzle-orm';

/**
 * Endpoint para atualizar threshold de alertas para usuários existentes
 */
export async function POST() {
  try {
    console.log('🔄 Iniciando atualização de threshold de alertas...');
    
    // Atualizar todos os follows que têm 0.5% para 0.1%
    const result = await db
      .update(userFiiFollowTable)
      .set({ minVariationPercent: '0.1' })
      .where(eq(userFiiFollowTable.minVariationPercent, '0.5'));
    
    console.log(`✅ Threshold atualizado para ${result.rowCount || 0} follows`);
    
    // Verificar status atual
    const allFollows = await db
      .select({
        minVariationPercent: userFiiFollowTable.minVariationPercent,
      })
      .from(userFiiFollowTable);
    
    const thresholdCounts = allFollows.reduce((acc: any, follow) => {
      const threshold = follow.minVariationPercent || '0.5';
      acc[threshold] = (acc[threshold] || 0) + 1;
      return acc;
    }, {});
    
    return NextResponse.json({
      success: true,
      message: 'Threshold de alertas atualizado com sucesso!',
      updatedCount: result.rowCount || 0,
      currentDistribution: thresholdCounts,
      newDefault: '0.1%'
    });
    
  } catch (error) {
    console.error('❌ Erro ao atualizar threshold:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}