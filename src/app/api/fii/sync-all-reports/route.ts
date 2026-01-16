import { NextRequest, NextResponse } from "next/server";

import { db } from "@/db";
import { fiiFundTable } from "@/db/schema";

/**
 * API para sincronizar automaticamente todos os relatórios
 * 
 * Busca os relatórios mais recentes para todos os FIIs ativos
 */
export async function POST(request: NextRequest) {
  try {
    console.log("🔄 Iniciando sincronização de todos os relatórios...");
    
    // Buscar todos os fundos ativos
    const allFunds = await db
      .select()
      .from(fiiFundTable);
    
    console.log(`📊 Encontrados ${allFunds.length} fundos para sincronizar`);
    
    const results = [];
    const errors = [];
    
    // Sincronizar relatórios para cada fundo
    for (const fund of allFunds) {
      try {
        console.log(`🔍 Sincronizando ${fund.ticker}...`);
        
        // Chamar a API de relatórios para cada fundo
        const reportResponse = await fetch(`${request.nextUrl.origin}/api/fii/reports?fundId=${fund.id}`, {
          method: 'GET'
        });
        
        if (reportResponse.ok) {
          const reportData = await reportResponse.json();
          results.push({
            ticker: fund.ticker,
            fundName: fund.name,
            status: 'success',
            latestReport: reportData.latestReport,
            totalReports: reportData.totalReports
          });
          
          console.log(`✅ ${fund.ticker} sincronizado - ${reportData.latestReport?.reportMonth}`);
        } else {
          const errorData = await reportResponse.json();
          errors.push({
            ticker: fund.ticker,
            fundName: fund.name,
            status: 'error',
            error: errorData.error || 'Erro desconhecido'
          });
          
          console.log(`❌ Erro ao sincronizar ${fund.ticker}: ${errorData.error}`);
        }
        
        // Aguardar um pouco entre requisições para não sobrecarregar
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        errors.push({
          ticker: fund.ticker,
          fundName: fund.name,
          status: 'error',
          error: error instanceof Error ? error.message : 'Erro desconhecido'
        });
        
        console.log(`❌ Erro ao processar ${fund.ticker}:`, error);
      }
    }
    
    console.log(`🎉 Sincronização concluída: ${results.length} sucessos, ${errors.length} erros`);
    
    return NextResponse.json({
      success: true,
      message: "Sincronização de relatórios concluída",
      stats: {
        totalFunds: allFunds.length,
        successful: results.length,
        errors: errors.length
      },
      results,
      errors
    });
    
  } catch (error) {
    console.error("❌ Erro na sincronização de relatórios:", error);
    
    return NextResponse.json({
      success: false,
      error: "Erro na sincronização de relatórios",
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}

/**
 * GET - Verificar status da sincronização
 */
export async function GET() {
  try {
    const allFunds = await db
      .select({
        id: fiiFundTable.id,
        ticker: fiiFundTable.ticker,
        name: fiiFundTable.name,
        updatedAt: fiiFundTable.updatedAt
      })
      .from(fiiFundTable);
    
    return NextResponse.json({
      service: "Auto Sync Reports",
      status: "active",
      totalFunds: allFunds.length,
      funds: allFunds.map(f => ({
        ticker: f.ticker,
        name: f.name,
        lastUpdated: f.updatedAt
      }))
    });
    
  } catch (error) {
    return NextResponse.json({
      service: "Auto Sync Reports",
      status: "error",
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}