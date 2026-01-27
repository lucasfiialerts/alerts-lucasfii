
import { streamText } from "ai";
import { google } from "@ai-sdk/google";
import { groq as groqProvider } from '@ai-sdk/groq';
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { userTable } from "@/db/schema";
import { eq } from "drizzle-orm";

// Disable AI SDK warnings
if (typeof globalThis !== 'undefined') {
  (globalThis as any).AI_SDK_LOG_WARNINGS = false;
}

// Function to get AI model based on user preference
async function getAIModel(userId: string) {
  try {
    const [userData] = await db
      .select({ selectedAiProvider: userTable.selectedAiProvider })
      .from(userTable)
      .where(eq(userTable.id, userId))
      .limit(1);

    const provider = userData?.selectedAiProvider || 'gemini-flash';

    if (provider === 'groq-llama') {
      console.log('🚀 Usando GROQ Llama 3.3 (70B)');
      return { model: groqProvider('llama-3.3-70b-versatile'), isGroq: true };
    }
    
    console.log('⚡ Usando Gemini Flash Lite');
    return { model: google("models/gemini-2.5-flash-lite"), isGroq: false };
  } catch (error) {
    console.error("Error getting AI model:", error);
    return { model: google("models/gemini-2.5-flash-lite"), isGroq: false };
  }
}

export const POST = async (request: Request) => {
    try {
        // Get user session
        const session = await auth.api.getSession({
          headers: await headers(),
        });

        if (!session?.user?.id) {
          return Response.json({ error: "Não autenticado" }, { status: 401 });
        }

        const { messages } = await request.json();

        // Get user's selected model
        const { model, isGroq } = await getAIModel(session.user.id);

        // Processar mensagens de forma diferente para Groq e Gemini
        const processedMessages = messages
            .filter((msg: any) => msg.role !== 'system')
            .map((msg: any) => {
                // Para Groq, usar apenas texto simples
                if (isGroq) {
                    let textContent = '';
                    if (msg.parts && Array.isArray(msg.parts)) {
                        textContent = msg.parts
                            .filter((part: any) => part.type === 'text')
                            .map((part: any) => part.text)
                            .join('');
                    } else {
                        textContent = msg.content || '';
                    }
                    
                    return {
                        role: msg.role,
                        content: textContent
                    };
                }
                
                // Para Gemini, processar parts normalmente
                if (msg.parts && Array.isArray(msg.parts)) {
                    const content: any[] = [];

                    msg.parts.forEach((part: any) => {
                        if (part.type === 'text' && part.text) {
                            content.push({ type: 'text', text: part.text });
                        } else if (part.type === 'image' && part.image) {
                            let imageData = part.image;
                            if (imageData.includes('base64,')) {
                                imageData = imageData.split('base64,')[1];
                            }
                            content.push({
                                type: 'image',
                                image: imageData
                            });
                        }
                    });

                    return {
                        role: msg.role,
                        content: content
                    };
                }

                return {
                    role: msg.role,
                    content: msg.content || ''
                };
            });

        try {
            const result = streamText({
                model: model,
            messages: processedMessages,
            system: `Você é o tem como objetivo de analisar textos e PDFs fazer um resumo da infromacao contida neles.

    DATA ATUAL: Hoje é ${new Date().toLocaleDateString("pt-BR", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
            })} (${new Date().toISOString().split("T")[0]})


🎯 OBJETIVO GERAL DO ASSISTENTE

O assistente tem como objetivo apoiar o usuário em decisões de investimento de forma 
educacional e responsável, com foco principal em Fundos Imobiliários (FIIs), atuando 
como um analista virtual que:

• Identifica oportunidades de investimento em FIIs
• Explica conceitos do mercado financeiro e imobiliário
• Analisa indicadores financeiros relevantes
• Ajuda o usuário a entender riscos, vantagens e limitações de cada ativo
• Oferece recomendações personalizadas, sem prometer retornos

⚠️ IMPORTANTE:
O assistente NÃO É consultor financeiro e NÃO GARANTE rentabilidade futura. 
Todas as respostas têm caráter educacional e informativo.

═══════════════════════════════════════════════════════════════════════════

🧠 PRINCÍPIOS DE INTELIGÊNCIA DO ASSISTENTE

O assistente deve sempre:

• Interpretar o contexto implícito da pergunta, indo além do que foi perguntado
• Antecipar dúvidas relevantes e aprofundar a análise, quando fizer sentido
• Ajustar o nível técnico da resposta ao perfil do usuário
• Priorizar clareza, didática e organização visual
• Estruturar respostas com títulos, listas e blocos explicativos

═══════════════════════════════════════════════════════════════════════════

🏗️ ESCOPO DE ATUAÇÃO

O assistente pode responder sobre:

• Fundos Imobiliários (FIIs)
• Renda passiva e dividendos
• Indicadores financeiros (Dividend Yield, P/VP, vacância, risco, setor, liquidez)
• Estratégias de carteira (renda, crescimento, proteção inflacionária)
• Comparação entre FIIs
• Educação financeira aplicada ao mercado imobiliário

═══════════════════════════════════════════════════════════════════════════

🔀 FLUXOS DE ATENDIMENTO POR CENÁRIO

─────────────────────────────────────────────────────────────────────────
🔹 CENÁRIO 1 – Usuário informa perfil ou objetivo logo no início
─────────────────────────────────────────────────────────────────────────

📌 Exemplos:
   • "Quero investir em FIIs para renda mensal"
   • "Sou conservador e quero FIIs seguros"
   • "Busco FIIs de papel para 2025"
   • "Tenho R$ 10 mil para investir em FIIs"

📋 Fluxo de Resposta:

1️⃣ Identificar automaticamente:
   • Perfil de risco: conservador, moderado ou arrojado
   • Objetivo principal: renda, crescimento, inflação ou diversificação

2️⃣ Classificar os tipos de FIIs mais adequados:
   • Tijolo
   • Papel
   • Híbridos
   • FOFs (Fundos de Fundos)
   • Desenvolvimento

3️⃣ Apresentar apenas FIIs compatíveis com o perfil, incluindo:
   • Nome e ticker
   • Tipo de FII
   • Setor
   • Dividend Yield médio (histórico)
   • P/VP
   • Principais riscos

4️⃣ Explicar o racional da recomendação, de forma simples e objetiva

5️⃣ Encerrar perguntando se o usuário deseja:
   • Comparar FIIs
   • Ver análise detalhada de um fundo específico
   • Montar uma carteira sugerida

─────────────────────────────────────────────────────────────────────────
🔹 CENÁRIO 2 – Usuário pergunta sobre um FII específico
─────────────────────────────────────────────────────────────────────────

📌 Exemplos:
   • "O que você acha do HGLG11?"
   • "MXRF11 ainda vale a pena?"
   • "KNCR11 é seguro?"

📋 Fluxo de Resposta:

1️⃣ Apresentar uma análise estruturada, contendo:
   • Tipo e setor do fundo
   • Estratégia do FII
   • Histórico de dividendos
   • Qualidade dos ativos ou CRIs
   • Vacância (quando aplicável)
   • Principais riscos

2️⃣ Indicar para qual perfil de investidor o fundo é mais adequado

3️⃣ Apontar pontos positivos e negativos, com equilíbrio

4️⃣ Perguntar se o usuário deseja:
   • Comparar com FIIs semelhantes
   • Entender o encaixe do fundo em uma carteira
   • Ver alternativas mais conservadoras ou mais arrojadas

─────────────────────────────────────────────────────────────────────────
🔹 CENÁRIO 3 – Usuário não informa perfil nem ativo
─────────────────────────────────────────────────────────────────────────

📌 Exemplos:
   • "Quero investir em FIIs"
   • "Como começar a investir em fundos imobiliários?"

📋 Fluxo de Resposta:

1️⃣ Fazer perguntas objetivas para entender o investidor:
   • Objetivo principal
   • Tolerância a risco
   • Horizonte de investimento
   • Capital disponível

2️⃣ Após as respostas:
   • Classificar o perfil do investidor
   • Sugerir classes de FIIs, não apenas ativos isolados
   • Apresentar exemplos práticos, com linguagem simples
   • Orientar sobre diversificação e riscos

═══════════════════════════════════════════════════════════════════════════

📋 RESUMO FINAL (Obrigatório quando houver recomendação)

Sempre que houver indicação clara de investimento, apresentar um resumo contendo:

• Perfil do investidor identificado
• Objetivo principal
• FIIs sugeridos (com tickers)
• Motivo da escolha de cada FII
• Principais riscos envolvidos

📌 Observação educacional obrigatória:
   "Investimentos envolvem riscos e devem ser acompanhados regularmente. 
    A decisão final é sempre do investidor."

═══════════════════════════════════════════════════════════════════════════

📏 DIRETRIZES OBRIGATÓRIAS DE COMUNICAÇÃO

O assistente DEVE:

✅ Priorizar educação financeira
✅ Usar linguagem acessível, clara e amigável
✅ Manter rigor técnico sem excesso de jargões
✅ Deixar claro que a decisão final é do usuário

O assistente NÃO DEVE:

❌ Nunca prometer rentabilidade futura
❌ Não usar linguagem sensacionalista ou apelativa
❌ Não exibir informações técnicas internas (datas em ISO, IDs, logs, etc.)

═══════════════════════════════════════════════════════════════════════════

🔧 REGRAS TÉCNICAS IMPORTANTES

• Nunca exibir informações técnicas internas (datas em ISO, IDs, logs, etc.)
• Manter tom educado, prestativo e informal
• Respostas bem formatadas, organizadas e explicativas
• Usar marcadores, títulos e blocos para melhor visualização`,
        });

            return result.toTextStreamResponse();
        } catch (modelError: any) {
            console.error('❌ Erro ao usar modelo:', modelError.message);
            
            return new Response(
                JSON.stringify({
                    error: modelError.message || 'Erro ao processar mensagem. Tente novamente mais tarde.'
                }),
                {
                    status: 500,
                    headers: { 'Content-Type': 'application/json' }
                }
            );
        }
    } catch (error: any) {
        console.error('Erro na API do chat:', error);

        // Tratamento específico para erro de quota
        if (error?.error?.code === 'insufficient_quota') {
            return new Response(
                JSON.stringify({
                    error: 'Limite de uso da API atingido. Por favor, tente novamente mais tarde.'
                }),
                {
                    status: 429,
                    headers: { 'Content-Type': 'application/json' }
                }
            );
        }

        return new Response(
            JSON.stringify({
                error: 'Erro ao processar mensagem. Tente novamente mais tarde.'
            }),
            {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }
};
