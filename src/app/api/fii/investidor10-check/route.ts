import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';

/**
 * API para verificar relatórios no Investidor10
 * Chama o script Node.js e retorna os dados
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ticker } = body;

    if (!ticker) {
      return NextResponse.json({
        success: false,
        error: 'Ticker é obrigatório'
      }, { status: 400 });
    }

    console.log(`🔍 Verificando ${ticker} no Investidor10...`);

    // Chamar o módulo do Investidor10 diretamente
    const investidor10Module = require('../../../../../scripts/relatorio-investidor10-ia');
    
    try {
      // 1. Buscar comunicados
      const comunicados = await investidor10Module.buscarComunicados(ticker);
      
      // Filtrar relatórios relevantes
      const relatoriosRelevantes = comunicados.filter((c: any) => 
        c.tipo === 'Relatório Gerencial' || 
        c.tipo === 'Fato Relevante' ||
        c.tipo === 'Informe Mensal'
      );
      
      if (relatoriosRelevantes.length === 0) {
        return NextResponse.json({
          success: true,
          hasNewReport: false,
          message: 'Nenhum relatório relevante encontrado'
        });
      }

      // Pegar o mais recente
      const documento = relatoriosRelevantes[0];
      
      // Verificar se é recente (últimos 30 dias)
      const docDate = new Date(documento.data.split('/').reverse().join('-'));
      const now = new Date();
      const diffDays = Math.floor((now.getTime() - docDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays > 30) {
        return NextResponse.json({
          success: true,
          hasNewReport: false,
          message: `Documento antigo (${documento.data})`
        });
      }

      // 2. Obter link do PDF
      const linkPDF = await investidor10Module.obterLinkPDF(documento.url);
      
      // 3. Baixar PDF
      const pdfBuffer = await investidor10Module.baixarPDF(linkPDF);
      
      // 4. Extrair texto
      const textoCompleto = await investidor10Module.extrairTextoPDF(pdfBuffer);
      
      // Limitar texto para não estourar a resposta
      const textoLimitado = textoCompleto.length > 3000 
        ? textoCompleto.substring(0, 3000) + '\n\n[...] (Texto truncado)'
        : textoCompleto;

      console.log(`✅ Relatório encontrado: ${documento.tipo} - ${documento.data}`);

      return NextResponse.json({
        success: true,
        hasNewReport: true,
        report: {
          ticker: ticker,
          tipo: documento.tipo,
          data: documento.data,
          linkPDF: linkPDF,
          textoExtraido: textoLimitado,
          tamanhoCompleto: textoCompleto.length
        }
      });

    } catch (scriptError) {
      console.error(`❌ Erro ao processar ${ticker}:`, scriptError);
      
      return NextResponse.json({
        success: false,
        hasNewReport: false,
        error: scriptError instanceof Error ? scriptError.message : 'Erro ao processar'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('❌ Erro na API investidor10-check:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    service: 'Investidor10 Report Checker',
    description: 'Verifica novos relatórios e fatos relevantes no Investidor10',
    usage: {
      method: 'POST',
      body: {
        ticker: 'string (ex: HGLG11)'
      }
    }
  });
}
