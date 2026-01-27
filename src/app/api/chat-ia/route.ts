
import { streamText } from "ai";
import { google } from "@ai-sdk/google";
import { groq as groqProvider } from '@ai-sdk/groq';
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { userTable } from "@/db/schema";
import { eq } from "drizzle-orm";
import { HfInference } from '@huggingface/inference';

// Disable AI SDK warnings
if (typeof globalThis !== 'undefined') {
  (globalThis as any).AI_SDK_LOG_WARNINGS = false;
}

// Hugging Face Request Handler
async function handleHuggingFaceRequest(messages: any[], userId: string, modelName: string = 'Qwen/Qwen2.5-VL-7B-Instruct', isFinanceMode: boolean = false) {
  // Verificar se a API key está configurada
  if (!process.env.HUGGINGFACE_API_KEY) {
    console.error('❌ HUGGINGFACE_API_KEY não está configurada no .env');
    return Response.json({ 
      error: 'API do Hugging Face não configurada. Configure HUGGINGFACE_API_KEY no arquivo .env.local' 
    }, { status: 500 });
  }

  const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

  // Verificar se há imagens nas mensagens
  const hasImages = messages.some((msg: any) => 
    msg.parts?.some((part: any) => part.type === 'image')
  );

  // Se for Finance mas tiver imagens, usar Qwen2.5-VL ao invés de GLM
  if (isFinanceMode && hasImages && modelName === 'zai-org/GLM-4.7-Flash') {
    console.log('🖼️ Imagens detectadas no modo Finance. Alternando para Qwen2.5-VL (suporta visão)...');
    modelName = 'Qwen/Qwen2.5-VL-7B-Instruct';
  }

  // Log apropriado baseado no modo
  if (isFinanceMode) {
    console.log(`📊 Processando com modo Finance (${hasImages ? 'com imagens' : 'texto'})...`);
  } else {
    console.log('🦙 Processando com Qwen2-VL (Alibaba)...');
  }

  // System prompt especializado para modo Finance
  const financeSystemPrompt = isFinanceMode ? `Você é um especialista em análise financeira e investimentos, com foco em Fundos Imobiliários (FIIs) e mercado brasileiro. 

**IMPORTANTE: RESPONDA SEMPRE EM PORTUGUÊS BRASILEIRO (PT-BR). NUNCA use inglês nas suas respostas.**

Sua expertise inclui:
- Análise fundamentalista de FIIs (dividend yield, P/VP, vacância, liquidez)
- Avaliação de risco e retorno
- Estratégias de carteira de investimentos
- Interpretação de indicadores financeiros
- Análise de relatórios gerenciais e balanços
- Tendências do mercado imobiliário brasileiro

Sempre forneça análises objetivas, baseadas em dados e indicadores reais. Explique conceitos de forma clara e didática, adaptando-se ao nível de conhecimento do investidor.

**LEMBRE-SE: Todas as respostas devem ser em PORTUGUÊS BRASILEIRO, incluindo títulos, listas e exemplos.**

IMPORTANTE: Nunca garanta retornos futuros. Sempre mencione os riscos envolvidos e que a decisão final é do investidor.` : '';

  // Converter mensagens para o formato do Hugging Face
  let hfMessages = messages.map((msg: any) => {
    if (msg.parts) {
      // Mensagem com parts (pode ter imagens)
      const textParts = msg.parts.filter((p: any) => p.type === 'text');
      const imageParts = msg.parts.filter((p: any) => p.type === 'image');

      // Se tiver imagens, usar formato multimodal
      if (imageParts.length > 0) {
        const content: any[] = [];
        
        // Adicionar texto
        if (textParts.length > 0) {
          content.push({
            type: 'text',
            text: textParts.map((p: any) => p.text).join('\n')
          });
        }
        
        // Adicionar imagens
        imageParts.forEach((imgPart: any) => {
          content.push({
            type: 'image_url',
            image_url: {
              url: imgPart.image
            }
          });
        });

        return {
          role: msg.role,
          content: content
        };
      }

      // Sem imagens, apenas texto
      const textContent = textParts.map((p: any) => p.text).join('\n');
      return {
        role: msg.role,
        content: textContent
      };
    } else {
      return {
        role: msg.role,
        content: msg.content
      };
    }
  });

  // Adicionar system prompt no início se for modo Finance
  if (isFinanceMode && financeSystemPrompt) {
    hfMessages = [
      { role: 'system', content: financeSystemPrompt },
      ...hfMessages
    ];
    
    // Forçar a primeira mensagem do usuário a incluir instrução de português
    if (hfMessages.length > 1 && hfMessages[1].role === 'user') {
      const originalContent = hfMessages[1].content;
      hfMessages[1].content = `[INSTRUÇÃO IMPORTANTE: Responda SOMENTE em português brasileiro (PT-BR). NÃO use inglês.]\n\n${originalContent}`;
    }
  }

  console.log('📤 Enviando para Hugging Face:', { 
    messageCount: hfMessages.length,
    model: modelName,
    financeMode: isFinanceMode
  });

  try {
    // Configurar parâmetros baseados no modo e modelo
    const maxTokens = isFinanceMode ? 1500 : 2000;
    const temperature = isFinanceMode ? 0.6 : 0.7;

    // Chamar o modelo do Hugging Face
    const response = await hf.chatCompletion({
      model: modelName,
      messages: hfMessages,
      max_tokens: maxTokens,
      temperature: temperature,
    });

    console.log('✅ Resposta recebida do HF:', {
      hasChoices: !!response.choices,
      choicesLength: response.choices?.length,
      hasContent: !!response.choices?.[0]?.message?.content,
      hasReasoningContent: !!(response.choices?.[0]?.message as any)?.reasoning_content,
      contentPreview: response.choices?.[0]?.message?.content?.substring(0, 100),
      reasoningPreview: ((response.choices?.[0]?.message as any)?.reasoning_content as string)?.substring(0, 100)
    });

    // GLM-4.7-Flash usa reasoning_content ao invés de content
    const encoder = new TextEncoder();
    const message = response.choices?.[0]?.message as any;
    let text = message?.reasoning_content || message?.content || 'Sem resposta do modelo';
    
    console.log('📝 Texto original:', typeof text === 'string' ? text.substring(0, 200) : text);
    
    // Se for modo Finance e o texto estiver em inglês, traduzir para português
    if (isFinanceMode && typeof text === 'string' && text.length > 0) {
      const isEnglish = /\b(analyze|user|request|fund|yield|dividend|calculate|based|monthly|annual)\b/i.test(text.substring(0, 500));
      
      if (isEnglish) {
        console.log('🌐 Detectado texto em inglês, traduzindo para português...');
        
        try {
          // Usar Gemini para traduzir
          const translateResponse = await hf.chatCompletion({
            model: 'Qwen/Qwen2.5-VL-7B-Instruct',
            messages: [
              { 
                role: 'system', 
                content: 'You are a professional translator. Translate financial analysis texts from English to Brazilian Portuguese (PT-BR). Maintain formatting, structure, and all numbers/calculations exactly as they are.' 
              },
              { 
                role: 'user', 
                content: `Traduza para português brasileiro:\n\n${text}` 
              }
            ],
            max_tokens: 2000,
            temperature: 0.3,
          });
          
          const translatedText = translateResponse.choices?.[0]?.message?.content;
          if (translatedText) {
            text = translatedText;
            console.log('✅ Tradução concluída');
          }
        } catch (translateError) {
          console.error('❌ Erro na tradução, usando texto original:', translateError);
        }
      }
    }
    
    // Limpar metadados do processo de raciocínio (thinking process)
    if (typeof text === 'string') {
      // Remover linhas de metadados como "Esboço do Conteúdo", "Polimento Final", etc.
      text = text
        .replace(/^\d+\.\s*\*\*[A-Z][^:]+:\*\*[\s\S]*?(?=\n\d+\.|\n\n[A-Z]|$)/gm, '') // Remove seções numeradas de thinking
        .replace(/^(Esboço|Polimento|Rascunho|Verificação|Análise Interna)[^:]*:.*$/gm, '') // Remove linhas de processo
        .replace(/^\(.*?\)$/gm, '') // Remove comentários entre parênteses
        .replace(/\n{3,}/g, '\n\n') // Remove múltiplas linhas em branco
        .trim();
    }
    
    const readable = new ReadableStream({
      start(controller) {
        // Enviar o texto completo
        controller.enqueue(encoder.encode(`0:${JSON.stringify(text)}\n`));
        controller.close();
      }
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'x-vercel-ai-data-stream': 'v1',
      },
    });
  } catch (error: any) {
    console.error('❌ Erro ao chamar Hugging Face:', {
      message: error.message,
      code: error.code,
      statusCode: error.httpResponse?.statusCode,
      statusText: error.httpResponse?.statusText,
      body: error.httpResponse?.body
    });
    
    // Mensagem de erro mais específica
    let errorMessage = 'Erro ao processar com Hugging Face';
    
    if (error.httpResponse?.statusCode === 401 || error.httpResponse?.statusCode === 403) {
      errorMessage = 'API key do Hugging Face inválida. Verifique a configuração.';
    } else if (error.httpResponse?.statusCode === 404) {
      errorMessage = 'Modelo não encontrado no Hugging Face.';
    } else if (error.httpResponse?.statusCode === 429) {
      errorMessage = 'Limite de uso do Hugging Face atingido.';
    } else if (error.message) {
      errorMessage = `Erro do Hugging Face: ${error.message}`;
    }
    
    return Response.json({ error: errorMessage }, { status: 500 });
  }
}

// Function to get AI model based on user preference
async function getAIModel(userId: string, hasImages: boolean = false) {
  try {
    const [userData] = await db
      .select({ selectedAiProvider: userTable.selectedAiProvider })
      .from(userTable)
      .where(eq(userTable.id, userId))
      .limit(1);

    const provider = userData?.selectedAiProvider || 'gemini-flash';

    // WiroAI Finance (Hugging Face) - usando GLM-4.7-Flash otimizado
    if (provider === 'wiro-finance') {
      console.log('📊 Provider: WiroAI Finance (GLM-4.7-Flash especializado)');
      return { model: null, isGroq: false, isHF: true, modelName: 'zai-org/GLM-4.7-Flash', isFinanceMode: true };
    }

    // Hugging Face Llama 4 Maverick
    if (provider === 'llama4-vision') {
      console.log('🦙 Provider: Llama 4 Maverick (Hugging Face)');
      return { model: null, isGroq: false, isHF: true, modelName: 'Qwen/Qwen2.5-VL-7B-Instruct' };
    }

    // Groq Llama 3.3 (apenas texto, modelos de visão foram descontinuados)
    if (provider === 'groq-llama') {
      console.log('🚀 Usando GROQ Llama 3.3 (70B) - apenas texto');
      return { model: groqProvider('llama-3.3-70b-versatile'), isGroq: true, isHF: false };
    }
    
    // Gemini Flash (padrão, suporta imagens)
    console.log('⚡ Usando Gemini Flash Lite');
    return { model: google("models/gemini-2.5-flash-lite"), isGroq: false, isHF: false };
  } catch (error) {
    console.error("Error getting AI model:", error);
    return { model: google("models/gemini-2.5-flash-lite"), isGroq: false, isHF: false };
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

        // Detectar se há imagens nas mensagens
        const hasImages = messages.some((msg: any) => 
            msg.parts?.some((part: any) => part.type === 'image')
        );

        // Get user's selected model
        const { model, isGroq, isHF, modelName, isFinanceMode } = await getAIModel(session.user.id, hasImages);

        console.log('🔍 Provider selecionado:', { isGroq, isHF, modelName, isFinanceMode, hasImages });

        // Se for Hugging Face, processar com API diferente
        if (isHF) {
            console.log(`🤗 Usando Hugging Face: ${modelName || 'modelo padrão'}...`);
            return handleHuggingFaceRequest(messages, session.user.id, modelName, isFinanceMode || false);
        }

        console.log('📨 Mensagens recebidas:', JSON.stringify(messages, null, 2));

        // Processar mensagens de forma diferente para Groq e Gemini
        const processedMessages = messages
            .filter((msg: any) => msg.role !== 'system')
            .map((msg: any) => {
                // Para Groq
                if (isGroq) {
                    // Se tiver imagens E esta mensagem específica tem imagens
                    if (hasImages && msg.parts && Array.isArray(msg.parts) && msg.parts.some((p: any) => p.type === 'image')) {
                        const content: any[] = [];
                        
                        msg.parts.forEach((part: any) => {
                            if (part.type === 'text' && part.text) {
                                content.push({ type: 'text', text: part.text });
                            } else if (part.type === 'image' && part.image) {
                                // Groq espera formato image_url
                                content.push({
                                    type: 'image_url',
                                    image_url: { url: part.image }
                                });
                            }
                        });
                        
                        // Só retornar array se realmente tiver conteúdo
                        if (content.length > 0) {
                            return {
                                role: msg.role,
                                content: content
                            };
                        }
                    }
                    
                    // Sem imagens, usar apenas texto como string simples
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
                    // Verificar se esta mensagem específica tem imagens
                    const hasImageInMsg = msg.parts.some((p: any) => p.type === 'image');
                    
                    // Se tiver imagens na mensagem
                    if (hasImageInMsg) {
                        const content: any[] = [];

                        msg.parts.forEach((part: any) => {
                            if (part.type === 'text' && part.text) {
                                content.push({ type: 'text', text: part.text });
                            } else if (part.type === 'image' && part.image) {
                                // Extrair o mimeType e os dados base64
                                const imageUrl = part.image;
                                let mimeType = 'image/jpeg'; // Default
                                let base64Data = imageUrl;
                                
                                // Se tiver o formato data:image/xxx;base64,xxxxx
                                if (imageUrl.startsWith('data:')) {
                                    const matches = imageUrl.match(/data:(image\/[^;]+);base64,(.+)/);
                                    if (matches) {
                                        mimeType = matches[1];
                                        base64Data = matches[2];
                                    }
                                }
                                
                                console.log('🖼️ Processando imagem para Gemini:', {
                                    mimeType,
                                    base64Length: base64Data.length,
                                    base64Preview: base64Data.substring(0, 50) + '...'
                                });
                                
                                // Formato correto para o Google AI SDK
                                content.push({
                                    type: 'image',
                                    image: Buffer.from(base64Data, 'base64'),
                                    mimeType: mimeType
                                });
                            }
                        });

                        return {
                            role: msg.role,
                            content: content
                        };
                    }
                    
                    // Sem imagens, extrair apenas o texto como string
                    const textContent = msg.parts
                        .filter((part: any) => part.type === 'text')
                        .map((part: any) => part.text)
                        .join('');
                    
                    return {
                        role: msg.role,
                        content: textContent || msg.content || ''
                    };
                }

                return {
                    role: msg.role,
                    content: msg.content || ''
                };
            });

        console.log('✅ Mensagens processadas:', processedMessages.length);
        
        // Log detalhado das mensagens processadas
        processedMessages.forEach((msg: any, idx: number) => {
            console.log(`📋 Mensagem ${idx}:`, {
                role: msg.role,
                contentType: typeof msg.content,
                isArray: Array.isArray(msg.content),
                contentSample: Array.isArray(msg.content) 
                    ? `Array com ${msg.content.length} items` 
                    : typeof msg.content === 'string' 
                        ? msg.content.substring(0, 50) 
                        : 'outro'
            });
        });

        if (!model) {
            throw new Error('Model not available');
        }

        try {
            const result = streamText({
                model: model,
            messages: processedMessages,
            system: `Você é um assistente especializado em análise de textos, PDFs e Fundos Imobiliários (FIIs).

DATA ATUAL: Hoje é ${new Date().toLocaleDateString("pt-BR", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
            })} (${new Date().toISOString().split("T")[0]})

═══════════════════════════════════════════════════════════════════════════

📝 REGRAS DE FORMATAÇÃO OBRIGATÓRIAS

SEMPRE siga estas regras ao responder:

1. Use MARKDOWN para formatação:
   • **Negrito** para destaques importantes
   • Listas numeradas (1., 2., 3.) ou bullet points (•)
   • Deixe uma linha em branco entre parágrafos
   • Use subtítulos claros quando necessário

2. Estruture as respostas assim:
   • Introdução curta (1-2 linhas)
   • Corpo principal organizado em tópicos
   • Conclusão ou próximos passos

3. NUNCA use:
   • ❌ Caracteres de escape como \\n
   • ❌ Texto corrido sem quebras
   • ❌ Parágrafos gigantes

4. Prefira sempre:
   • ✅ Listas organizadas
   • ✅ Parágrafos curtos (2-3 linhas)
   • ✅ Espaçamento visual

Exemplo de boa formatação:

**Análise do seu portfólio:**

Com base no gráfico, vejo que você tem uma distribuição igual entre os fundos (7,69% cada). Aqui estão pontos importantes:

**1. Diversificação**
Uma estratégia fundamental para minimizar riscos. Sua carteira atual já está diversificada.

**2. Desempenho**
Verifique o histórico de cada fundo antes de aportar mais.

**3. Próximos passos**
• Compare indicadores (DY, P/VP)
• Analise vacância dos fundos de tijolo
• Revise regularmente sua carteira

═══════════════════════════════════════════════════════════════════════════

🎯 OBJETIVO GERAL DO ASSISTENTE

O assistente tem como objetivo apoiar o usuário em decisões de investimento de forma 
educacional e responsável, com foco principal em Fundos Imobiliários (FIIs), atuando 
como um analista virtual que:

• Identifica oportunidades de investimento em FIIs
• Explica conceitos do mercado financeiro e imobiliário
• Analisa indicadores financeiros relevantes
• Ajuda o usuário a entender riscos, vantagens e limitações de cada ativo
• Oferece recomendações personalizadas, sem prometer retornos
• Consulta informações na internet para fornecer dados atualizados e precisos sobre FIIs, mercado imobiliário e indicadores financeiros

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
• Buscar informações atualizadas na internet sobre FIIs, indicadores, dividendos e notícias do mercado imobiliário
• Validar dados com fontes confiáveis sempre que possível

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

✅ Usar markdown e formatação visual
✅ Escrever parágrafos curtos e espaçados
✅ Priorizar educação financeira
✅ Usar linguagem acessível, clara e amigável
✅ Manter rigor técnico sem excesso de jargões
✅ Deixar claro que a decisão final é do usuário

O assistente NÃO DEVE:

❌ Nunca prometer rentabilidade futura
❌ Não usar linguagem sensacionalista ou apelativa
❌ Não usar caracteres de escape (\\n, \\t, etc)
❌ Não exibir informações técnicas internas (datas em ISO, IDs, logs)
❌ Não fazer parágrafos gigantes sem quebras

═══════════════════════════════════════════════════════════════════════════

🔧 LEMBRE-SE: Responda sempre com formatação limpa, visual e bem espaçada. Use markdown!`,
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
