/**
 * Módulo de IA para resumir documentos FNet usando Google Gemini 2.5 Flash
 * Atualizado para usar a mesma estrutura da API de chat-ia
 */

require('dotenv').config();
const { generateText } = require('ai');
const { google } = require('@ai-sdk/google');

// Função para gerar resumo usando Gemini 2.5 Flash (mesma versão da API chat-ia)
async function chamarGeminiAPI(dados, tipoDocumento, codigoFII) {
  const GOOGLE_GENERATIVE_AI_API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  
  if (!GOOGLE_GENERATIVE_AI_API_KEY) {
    throw new Error('GOOGLE_GENERATIVE_AI_API_KEY não configurada no .env');
  }
  
  // Preparar dados para análise
  const dadosFormatados = {
    fundo: dados.nomeFundo || 'N/A',
    cnpj: dados.cnpj || 'N/A',
    competencia: dados.competencia || 'N/A',
    patrimonio: dados.patrimonio || '0',
    qtdCotas: dados.qtdCotas || '0',
    valorCota: dados.valorCota || 'N/A',
    rendimentos: dados.rendimentos || '0',
    administrador: dados.administrador || 'N/A',
    classificacao: dados.classificacao || 'N/A',
    segmentoAtuacao: dados.segmentoAtuacao || 'N/A',
    publicoAlvo: dados.publicoAlvo || 'N/A'
  };
  
  // Prompt otimizado para análise de documentos FNet
  const prompt = `📋 ANÁLISE DE DOCUMENTO FNET - ${codigoFII}

TIPO DE DOCUMENTO: ${tipoDocumento}

DADOS OFICIAIS EXTRAÍDOS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🏢 Fundo: ${dadosFormatados.fundo}
📋 CNPJ: ${dadosFormatados.cnpj}
📅 Competência: ${dadosFormatados.competencia}
💰 Patrimônio Líquido: R$ ${parseFloat(dadosFormatados.patrimonio || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}
📊 Quantidade de Cotas: ${parseInt(dadosFormatados.qtdCotas || 0).toLocaleString('pt-BR')}
💵 Valor por Cota: ${dadosFormatados.valorCota !== 'N/A' ? 'R$ ' + parseFloat(dadosFormatados.valorCota).toLocaleString('pt-BR', {minimumFractionDigits: 2}) : 'N/A'}
💸 Rendimentos: R$ ${parseFloat(dadosFormatados.rendimentos || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}
🏛️ Administrador: ${dadosFormatados.administrador}
🎯 Classificação: ${dadosFormatados.classificacao}
🏗️ Segmento: ${dadosFormatados.segmentoAtuacao}
👥 Público Alvo: ${dadosFormatados.publicoAlvo}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

INSTRUÇÕES DE ANÁLISE:
1. Crie um resumo executivo conciso (máximo 6 linhas)
2. Destaque os 3 pontos mais importantes para investidores
3. Use linguagem clara mas profissional
4. Inclua análise sobre patrimônio, rendimentos ou mudanças relevantes
5. Seja objetivo e focado em informações acionáveis
6. Use emojis apropriados para destacar informações
7. Termine com "🤖 Resumo gerado pela IA da LucasFII Alerts"

FORMATO ESPERADO:
[Resumo executivo objetivo e insights relevantes]`;

  try {
    // Usar generateText ao invés de streamText para obter resultado direto
    const result = await generateText({
      model: google('models/gemini-2.5-flash-lite'), // Mesma versão do chat-ia
      prompt: prompt,
      system: `Você é um analista especializado em Fundos Imobiliários (FIIs) da LucasFII Alerts.

DATA ATUAL: ${new Date().toLocaleDateString("pt-BR", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })}

OBJETIVO:
Analisar documentos oficiais do FNET B3 e gerar resumos inteligentes e acionáveis para investidores.

DIRETRIZES:
• Foco em informações relevantes para decisões de investimento
• Análise objetiva de indicadores financeiros
• Linguagem clara e acessível
• Identificar pontos de atenção e oportunidades
• Contextualizar dados com o mercado de FIIs

IMPORTANTE:
• NÃO prometer rentabilidade futura
• NÃO fazer recomendações de compra/venda diretas
• Manter tom educacional e informativo
• Destacar tanto pontos positivos quanto de atenção`,
      maxTokens: 600,
      temperature: 0.4
    });
    
    return result.text.trim();
    
  } catch (error) {
    console.error('❌ Erro na API Gemini:', error);
    throw new Error(`Erro na API do Gemini: ${error.message}`);
  }
}

// Função para gerar resumo com fallback manual
async function gerarResumoInteligente(dados, tipoDocumento, codigoFII) {
  console.log(`🤖 Gerando resumo IA para ${codigoFII}...`);
  
  try {
    const resumoIA = await chamarGeminiAPI(dados, tipoDocumento, codigoFII);
    console.log(`✅ Resumo IA gerado com sucesso`);
    return resumoIA;
    
  } catch (error) {
    console.log(`⚠️ Erro na IA (${error.message}), usando resumo automático`);
    
    // Fallback: resumo automático baseado em regras inteligentes
    const patrimonio = parseFloat(dados.patrimonio || 0);
    const cotas = parseInt(dados.qtdCotas || 0);
    const rendimentos = parseFloat(dados.rendimentos || 0);
    const competencia = dados.competencia || 'N/A';
    
    let resumo = `\n🤖 *RESUMO INTELIGENTE ${codigoFII}*\n\n`;
    
    // Análise do patrimônio
    if (patrimonio > 0) {
      const patrimonioFormatado = formatarValor(patrimonio);
      
      if (patrimonio > 1000000000) {
        resumo += `� *Patrimônio robusto* de ${patrimonioFormatado} (+ R$ 1 bi)\n`;
      } else if (patrimonio > 500000000) {
        resumo += `📈 *Patrimônio sólido* de ${patrimonioFormatado} (+ R$ 500 mi)\n`;
      } else if (patrimonio > 100000000) {
        resumo += `💼 *Patrimônio* de ${patrimonioFormatado}\n`;
      } else {
        resumo += `� *Patrimônio* de ${patrimonioFormatado}\n`;
      }
    }
    
    // Análise das cotas
    if (cotas > 0) {
      const cotasFormatadas = cotas.toLocaleString('pt-BR');
      
      if (cotas > 10000000) {
        resumo += `📊 *Base ampla* com ${cotasFormatadas} cotas\n`;
      } else if (cotas > 1000000) {
        resumo += `📊 *Boa distribuição* com ${cotasFormatadas} cotas\n`;
      } else {
        resumo += `📊 ${cotasFormatadas} cotas emitidas\n`;
      }
    }
    
    // Análise de rendimentos
    if (rendimentos > 0) {
      resumo += `💸 *Rendimentos disponíveis:* ${formatarValor(rendimentos)}\n`;
    } else {
      resumo += `📋 *Sem rendimentos* neste período\n`;
    }
    
    // Análise do administrador
    const admin = dados.administrador || 'N/A';
    if (admin !== 'N/A') {
      const adminSimplificado = admin.split(' ')[0];
      resumo += `🏛️ *Gestão:* ${adminSimplificado}\n`;
    }
    
    // Análise da classificação
    if (dados.classificacao && dados.classificacao !== 'N/A') {
      resumo += `🎯 *Estratégia:* ${dados.classificacao}\n`;
    }
    
    // Análise temporal
    if (competencia !== 'N/A' && competencia.includes('-')) {
      const [ano, mes] = competencia.split('-');
      resumo += `📅 *Período:* ${mes}/${ano}\n`;
    }
    
    resumo += `\n🤖 *Resumo feito pela IA da LucasFII Alerts*`;
    
    return resumo;
  }
}

// Função auxiliar para formatar valores
function formatarValor(valor) {
  if (!valor || valor === 0) return 'R$ 0,00';
  
  const num = typeof valor === 'string' ? parseFloat(valor.replace(',', '.')) : valor;
  if (isNaN(num)) return 'N/A';
  
  // Formatação abreviada para valores grandes
  if (num >= 1000000000) {
    return `R$ ${(num / 1000000000).toFixed(1)}bi`;
  } else if (num >= 1000000) {
    return `R$ ${(num / 1000000).toFixed(1)}mi`;
  } else {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(num);
  }
}

module.exports = {
  gerarResumoInteligente,
  chamarGeminiAPI
};
