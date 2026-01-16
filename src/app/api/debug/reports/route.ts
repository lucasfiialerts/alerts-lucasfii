import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/db';
import { fiiFundTable,fiiReportTable } from '@/db/schema';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const ticker = url.searchParams.get('ticker');

    if (ticker) {
      // Buscar relatórios de um FII específico
      const fund = await db
        .select()
        .from(fiiFundTable)
        .where(eq(fiiFundTable.ticker, ticker))
        .limit(1);

      if (fund.length === 0) {
        return NextResponse.json({ error: `FII ${ticker} não encontrado` }, { status: 404 });
      }

      const reports = await db
        .select()
        .from(fiiReportTable)
        .where(eq(fiiReportTable.fundId, fund[0].id))
        .orderBy(fiiReportTable.reportDate);

      return NextResponse.json({
        ticker,
        fundName: fund[0].name,
        fundId: fund[0].id,
        reports
      });
    }

    // Buscar todos os relatórios
    const reportsWithFunds = await db
      .select({
        ticker: fiiFundTable.ticker,
        fundName: fiiFundTable.name,
        fundId: fiiFundTable.id,
        reportId: fiiReportTable.id,
        reportMonth: fiiReportTable.reportMonth,
        reportDate: fiiReportTable.reportDate,
        reportUrl: fiiReportTable.reportUrl
      })
      .from(fiiReportTable)
      .innerJoin(fiiFundTable, eq(fiiReportTable.fundId, fiiFundTable.id))
      .orderBy(fiiFundTable.ticker, fiiReportTable.reportDate);

    // Agrupar por FII
    const groupedReports = reportsWithFunds.reduce((acc, report) => {
      if (!acc[report.ticker]) {
        acc[report.ticker] = {
          ticker: report.ticker,
          fundName: report.fundName,
          fundId: report.fundId,
          reports: []
        };
      }
      acc[report.ticker].reports.push({
        id: report.reportId,
        month: report.reportMonth,
        date: report.reportDate,
        url: report.reportUrl
      });
      return acc;
    }, {} as any);

    return NextResponse.json({
      totalFunds: Object.keys(groupedReports).length,
      totalReports: reportsWithFunds.length,
      funds: Object.values(groupedReports)
    });

  } catch (error) {
    console.error('❌ Erro ao buscar relatórios:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}