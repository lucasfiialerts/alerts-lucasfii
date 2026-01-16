import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/db';
import { fiiReportTable } from '@/db/schema';

/**
 * API para limpar relatórios processados
 * 
 * DELETE /api/fii/clear-reports
 * 
 * Remove todos os relatórios do banco para permitir reprocessamento
 */

export async function DELETE(request: NextRequest) {
  try {
    console.log('🗑️ Limpando todos os relatórios processados...');

    // Deletar todos os registros da tabela fii_report
    const result = await db.delete(fiiReportTable);
    
    console.log('✅ Relatórios removidos com sucesso');

    return NextResponse.json({
      success: true,
      message: 'Todos os relatórios foram removidos com sucesso',
      data: {
        deletedCount: result.rowCount || 0
      }
    });

  } catch (error) {
    console.error('❌ Erro ao limpar relatórios:', error);
    return NextResponse.json({
      success: false,
      error: 'Falha ao limpar relatórios',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    // Contar quantos relatórios existem
    const reports = await db.select().from(fiiReportTable);
    
    return NextResponse.json({
      success: true,
      message: 'Contagem de relatórios',
      data: {
        totalReports: reports.length
      }
    });

  } catch (error) {
    console.error('❌ Erro ao contar relatórios:', error);
    return NextResponse.json({
      success: false,
      error: 'Falha ao contar relatórios',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}
