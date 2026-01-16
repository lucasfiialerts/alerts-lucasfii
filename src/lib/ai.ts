/**
 * AI Configuration - Gemini Integration
 * 
 * Configuração do Google Gemini para análise de relatórios FII
 * Usa Vercel AI SDK para integração otimizada
 */

import { google } from '@ai-sdk/google';
import { CoreMessage,generateText, streamText } from 'ai';

// Configuração do modelo Gemini
const geminiModel = google('gemini-1.5-flash');

/**
 * Configuração específica para análise de FII
 */
export const FII_ANALYSIS_CONFIG = {
  model: geminiModel,
  temperature: 0.3, // Baixa criatividade, mais factual
  topP: 0.8,
} as const;

/**
 * Prompts especializados para análise de relatórios FII
 */
export const FII_PROMPTS = {
  RELATORIO_GERENCIAL: `
Você é um especialista em análise de Fundos de Investimento Imobiliário (FII).
Analise o seguinte relatório gerencial e forneça um resumo estruturado focando em:

## 📊 DESEMPENHO FINANCEIRO
- Receitas e despesas principais
- Variações percentuais vs período anterior
- Margem operacional e rentabilidade

## 🏢 PORTFÓLIO IMOBILIÁRIO  
- Composição do portfólio (tipos de imóveis)
- Taxa de ocupação atual
- Principais locatários e concentração

## 💰 DISTRIBUIÇÕES
- Valor dos dividendos/rendimentos
- Yield atual e histórico
- Política de distribuição

## ⚠️ RISCOS E OPORTUNIDADES
- Principais riscos identificados
- Perspectivas futuras
- Projetos e investimentos planejados

## 📈 INDICADORES CHAVE
- P/VP (Preço/Valor Patrimonial)
- Dividend Yield
- Liquidez e volume negociado

Seja OBJETIVO, FACTUAL e use DADOS ESPECÍFICOS do relatório.
Destaque números importantes e percentuais.
`,

  RESUMO_EXECUTIVO: `
Como analista de FII, crie um RESUMO EXECUTIVO CONCISO (máximo 300 palavras) do relatório focando em:

🎯 PRINCIPAIS DESTAQUES
🔢 NÚMEROS CHAVE 
📊 PERFORMANCE VS BENCHMARK
⚡ FATOS RELEVANTES

Use linguagem clara e profissional. Destaque informações que um investidor precisa saber IMEDIATAMENTE.
`,

  ANALISE_SETORIAL: `
Analise este relatório FII sob a perspectiva SETORIAL:

🏢 SEGMENTO DE ATUAÇÃO
- Classificação do fundo (logístico, corporativo, shoppings, etc.)
- Posição no setor
- Comparação com peers

📍 GEOGRAFIA E LOCALIZAÇÃO  
- Distribuição regional dos ativos
- Qualidade das localizações
- Exposição a diferentes mercados

🎯 ESTRATÉGIA
- Foco de investimento
- Estratégias de crescimento
- Gestão ativa vs passiva

Contextualize dentro do cenário atual do mercado imobiliário brasileiro.
`
} as const;

/**
 * Gera resumo de relatório FII usando Gemini
 */
export async function generateFIIReportSummary(
  pdfText: string,
  ticker: string,
  promptType: keyof typeof FII_PROMPTS = 'RELATORIO_GERENCIAL'
): Promise<{
  success: boolean;
  summary?: string;
  error?: string;
  usage?: any;
}> {
  
  if (!process.env.GEMINI_API_KEY) {
    return {
      success: false,
      error: 'GEMINI_API_KEY não configurado'
    };
  }

  if (!pdfText || pdfText.length < 100) {
    return {
      success: false,
      error: 'Texto do PDF muito curto ou vazio'
    };
  }

  try {
    const prompt = FII_PROMPTS[promptType];
    
    const result = await generateText({
      ...FII_ANALYSIS_CONFIG,
      messages: [
        {
          role: 'system',
          content: prompt
        },
        {
          role: 'user', 
          content: `
TICKER: ${ticker}
RELATÓRIO FII:

${pdfText}

---

Analise este relatório seguindo exatamente a estrutura solicitada.
          `
        }
      ]
    });

    return {
      success: true,
      summary: result.text,
      usage: result.usage
    };

  } catch (error) {
    console.error('Erro ao gerar resumo FII:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    };
  }
}

/**
 * Gera análise comparativa entre múltiplos FIIs
 */
export async function generateFIIComparison(
  reports: Array<{ ticker: string; content: string; }>
): Promise<{
  success: boolean;
  comparison?: string;
  error?: string;
}> {
  
  if (!process.env.GEMINI_API_KEY) {
    return {
      success: false,
      error: 'GEMINI_API_KEY não configurado'
    };
  }

  if (reports.length < 2) {
    return {
      success: false,
      error: 'Necessário pelo menos 2 relatórios para comparação'
    };
  }

  try {
    const reportsText = reports.map(r => 
      `## FUNDO: ${r.ticker}\n${r.content}\n\n---\n`
    ).join('\n');

    const result = await generateText({
      ...FII_ANALYSIS_CONFIG,
      messages: [
        {
          role: 'system',
          content: `
Você é um analista especializado em FII. Compare os relatórios fornecidos criando uma análise COMPARATIVA estruturada:

## 📊 PERFORMANCE COMPARATIVA
- Rentabilidade e dividend yield
- Crescimento de receitas
- Eficiência operacional

## 🏢 PORTFÓLIO E ESTRATÉGIA
- Diferenças setoriais
- Qualidade dos ativos
- Diversificação

## 💰 ATRATIVIDADE PARA INVESTIDOR
- Valuation relativo
- Riscos específicos
- Recomendação de alocação

## 🎯 RANKING E CONCLUSÃO
- Classificação dos fundos
- Justificativa técnica
- Próximos catalisadores

Use DADOS ESPECÍFICOS e seja IMPARCIAL na análise.
          `
        },
        {
          role: 'user',
          content: `Analise e compare os seguintes relatórios FII:\n\n${reportsText}`
        }
      ]
    });

    return {
      success: true,
      comparison: result.text
    };

  } catch (error) {
    console.error('Erro na comparação FII:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    };
  }
}

/**
 * Stream de análise em tempo real (para UX melhorada)
 */
export async function streamFIIAnalysis(
  pdfText: string,
  ticker: string
) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY não configurado');
  }

  return streamText({
    ...FII_ANALYSIS_CONFIG,
    messages: [
      {
        role: 'system',
        content: FII_PROMPTS.RELATORIO_GERENCIAL
      },
      {
        role: 'user',
        content: `TICKER: ${ticker}\nRELATÓRIO: ${pdfText}`
      }
    ]
  });
}

/**
 * Verifica se a API do Gemini está configurada e funcionando
 */
export async function checkGeminiHealth(): Promise<{
  configured: boolean;
  working?: boolean;
  error?: string;
}> {
  if (!process.env.GEMINI_API_KEY) {
    return { configured: false };
  }

  try {
    const result = await generateText({
      ...FII_ANALYSIS_CONFIG,
      messages: [
        { 
          role: 'user', 
          content: 'Responda apenas: "Gemini funcionando!" se tudo estiver OK.' 
        }
      ]
    });

    return {
      configured: true,
      working: result.text.includes('funcionando'),
    };

  } catch (error) {
    return {
      configured: true,
      working: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    };
  }
}
