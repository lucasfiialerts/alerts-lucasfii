import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/db';
import { userTable } from '@/db/schema';

/**
 * Endpoint para atualizar preferências de alerta de um usuário (para testes)
 */
export async function POST(request: NextRequest) {
  try {
    const { userId, alertPreferencesReports } = await request.json();
    
    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'userId é obrigatório'
      }, { status: 400 });
    }
    
    console.log(`🔧 Atualizando preferências do usuário ${userId}: Relatórios e Eventos = ${alertPreferencesReports}`);
    
    // Atualizar preferências do usuário
    const result = await db
      .update(userTable)
      .set({ 
        alertPreferencesReports: alertPreferencesReports 
      })
      .where(eq(userTable.id, userId))
      .returning();
    
    if (result.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Usuário não encontrado'
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Preferências atualizadas com sucesso',
      userId: userId,
      newPreferences: {
        alertPreferencesReports: alertPreferencesReports
      },
      user: result[0],
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Erro ao atualizar preferências:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}