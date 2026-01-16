import { NextResponse } from 'next/server';

import { db } from '@/db';
import { fiiReportTable } from '@/db/schema';

export async function DELETE() {
  try {
    console.log('🗑️ Removendo todos os relatórios do banco de dados...');
    
    const deletedReports = await db
      .delete(fiiReportTable)
      .returning();

    console.log(`✅ ${deletedReports.length} relatórios removidos`);

    return NextResponse.json({
      success: true,
      message: `${deletedReports.length} relatórios removidos com sucesso`,
      deletedCount: deletedReports.length
    });

  } catch (error) {
    console.error('❌ Erro ao limpar relatórios:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
