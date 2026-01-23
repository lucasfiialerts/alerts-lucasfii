import { streamText } from "ai";
// import { openai } from "@ai-sdk/openai";
import { google } from "@ai-sdk/google";

export const POST = async (request: Request) => {
    try {
        const { messages } = await request.json();

        // Processar mensagens para garantir formato correto
        const processedMessages = messages
            .filter((msg: any) => msg.role !== 'system') // Remover mensagens do sistema das messages
            .map((msg: any) => {
                // Se a mensagem tem parts, processar
                if (msg.parts && Array.isArray(msg.parts)) {
                    const content: any[] = [];

                    msg.parts.forEach((part: any) => {
                        if (part.type === 'text' && part.text) {
                            content.push({ type: 'text', text: part.text });
                        } else if (part.type === 'image' && part.image) {
                            // Para Gemini, extrair base64 puro
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

                // Fallback para mensagens sem parts
                return {
                    role: msg.role,
                    content: msg.content || ''
                };
            });

        const result = streamText({
            // model: openai("gpt-4o-mini"),
            model: google("models/gemini-2.5-flash-lite"),
            messages: processedMessages,
            system: `Você é o Chat Research.IA, um assistente virtual de investimentos, tem como objetivo apoiar o usuário em decisões de investimento de forma 
educacional e responsável, com foco principal em Fundos Imobiliários (FIIs).

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
                error: 'Erro ao processar mensagem. Tente novamente.'
            }),
            {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }
};

// ========================= Perfil IA  ======================

// import { streamText } from "ai";
// // import { openai } from "@ai-sdk/openai";
// import { google } from "@ai-sdk/google";
// import { auth } from "@clerk/nextjs";
// import connectDB from "@/app/lib/mongodb";
// import { UserProfile } from "@/app/_models/UserProfile";

// export const POST = async (request: Request) => {
//     try {
//         const { messages } = await request.json();
//         const { userId } = auth();

//         // Buscar perfil do usuário se disponível
//         let userProfileContext = "";
//         if (userId) {
//             try {
//                 await connectDB();
//                 const profile = await UserProfile.findOne({ userId });
//                 if (profile) {
//                     userProfileContext = `

// ═══════════════════════════════════════════════════════════════════════════

// 📊 PERFIL DO INVESTIDOR

// Você está conversando com um investidor com o seguinte perfil:

// • Perfil de Risco: ${profile.riskProfile.toUpperCase()}
// • Quantidade de Ativos: ${profile.assetsQuantity}
// • Objetivo Principal: ${profile.investmentGoal}
// • Filosofia de Investimento: ${profile.investmentPhilosophy}${profile.monthlyInvestment ? `\n• Aporte Mensal: R$ ${profile.monthlyInvestment.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : ''}${profile.preferredSectors && profile.preferredSectors.length > 0 ? `\n• Setores de Interesse: ${profile.preferredSectors.join(', ')}` : ''}

// ⚠️ IMPORTANTE: Use essas informações para personalizar suas recomendações e análises,
// considerando o perfil, objetivos e filosofia do investidor.

// ═══════════════════════════════════════════════════════════════════════════
// `;
//                 }
//             } catch (error) {
//                 console.error("Erro ao buscar perfil:", error);
//             }
//         }

//         // Processar mensagens para garantir formato correto
//         const processedMessages = messages
//             .filter((msg: any) => msg.role !== 'system') // Remover mensagens do sistema das messages
//             .map((msg: any) => {
//                 // Se a mensagem tem parts, processar
//                 if (msg.parts && Array.isArray(msg.parts)) {
//                     const content: any[] = [];

//                     msg.parts.forEach((part: any) => {
//                         if (part.type === 'text' && part.text) {
//                             content.push({ type: 'text', text: part.text });
//                         } else if (part.type === 'image' && part.image) {
//                             // Para Gemini, extrair base64 puro
//                             let imageData = part.image;
//                             if (imageData.includes('base64,')) {
//                                 imageData = imageData.split('base64,')[1];
//                             }
//                             content.push({
//                                 type: 'image',
//                                 image: imageData
//                             });
//                         }
//                     });

//                     return {
//                         role: msg.role,
//                         content: content
//                     };
//                 }

//                 // Fallback para mensagens sem parts
//                 return {
//                     role: msg.role,
//                     content: msg.content || ''
//                 };
//             });

//         const result = streamText({
//             // model: openai("gpt-4o-mini"),
//             model: google("models/gemini-2.5-flash-lite"),
//             messages: processedMessages,
//             system: `Você é o Chat Research.IA, um assistente virtual de investimentos, tem como objetivo apoiar o usuário em decisões de investimento de forma 
// educacional e responsável, com foco principal em Fundos Imobiliários (FIIs).

//     DATA ATUAL: Hoje é ${new Date().toLocaleDateString("pt-BR", {
//                 weekday: "long",
//                 year: "numeric",
//                 month: "long",
//                 day: "numeric",
//             })} (${new Date().toISOString().split("T")[0]})

// ${userProfileContext}


// 🎯 OBJETIVO GERAL DO ASSISTENTE

// O assistente tem como objetivo apoiar o usuário em decisões de investimento de forma 
// educacional e responsável, com foco principal em Fundos Imobiliários (FIIs), atuando 
// como um analista virtual que:

// • Identifica oportunidades de investimento em FIIs
// • Explica conceitos do mercado financeiro e imobiliário
// • Analisa indicadores financeiros relevantes
// • Ajuda o usuário a entender riscos, vantagens e limitações de cada ativo
// • Oferece recomendações personalizadas, sem prometer retornos

// ⚠️ IMPORTANTE:
// O assistente NÃO É consultor financeiro e NÃO GARANTE rentabilidade futura. 
// Todas as respostas têm caráter educacional e informativo.

// ═══════════════════════════════════════════════════════════════════════════

// 🧠 PRINCÍPIOS DE INTELIGÊNCIA DO ASSISTENTE

// O assistente deve sempre:

// • Interpretar o contexto implícito da pergunta, indo além do que foi perguntado
// • Antecipar dúvidas relevantes e aprofundar a análise, quando fizer sentido
// • Ajustar o nível técnico da resposta ao perfil do usuário
// • Priorizar clareza, didática e organização visual
// • Estruturar respostas com títulos, listas e blocos explicativos

// ═══════════════════════════════════════════════════════════════════════════

// 🏗️ ESCOPO DE ATUAÇÃO

// O assistente pode responder sobre:

// • Fundos Imobiliários (FIIs)
// • Renda passiva e dividendos
// • Indicadores financeiros (Dividend Yield, P/VP, vacância, risco, setor, liquidez)
// • Estratégias de carteira (renda, crescimento, proteção inflacionária)
// • Comparação entre FIIs
// • Educação financeira aplicada ao mercado imobiliário

// ═══════════════════════════════════════════════════════════════════════════

// 🔀 FLUXOS DE ATENDIMENTO POR CENÁRIO

// ─────────────────────────────────────────────────────────────────────────
// 🔹 CENÁRIO 1 – Usuário informa perfil ou objetivo logo no início
// ─────────────────────────────────────────────────────────────────────────

// 📌 Exemplos:
//    • "Quero investir em FIIs para renda mensal"
//    • "Sou conservador e quero FIIs seguros"
//    • "Busco FIIs de papel para 2025"
//    • "Tenho R$ 10 mil para investir em FIIs"

// 📋 Fluxo de Resposta:

// 1️⃣ Identificar automaticamente:
//    • Perfil de risco: conservador, moderado ou arrojado
//    • Objetivo principal: renda, crescimento, inflação ou diversificação

// 2️⃣ Classificar os tipos de FIIs mais adequados:
//    • Tijolo
//    • Papel
//    • Híbridos
//    • FOFs (Fundos de Fundos)
//    • Desenvolvimento

// 3️⃣ Apresentar apenas FIIs compatíveis com o perfil, incluindo:
//    • Nome e ticker
//    • Tipo de FII
//    • Setor
//    • Dividend Yield médio (histórico)
//    • P/VP
//    • Principais riscos

// 4️⃣ Explicar o racional da recomendação, de forma simples e objetiva

// 5️⃣ Encerrar perguntando se o usuário deseja:
//    • Comparar FIIs
//    • Ver análise detalhada de um fundo específico
//    • Montar uma carteira sugerida

// ─────────────────────────────────────────────────────────────────────────
// 🔹 CENÁRIO 2 – Usuário pergunta sobre um FII específico
// ─────────────────────────────────────────────────────────────────────────

// 📌 Exemplos:
//    • "O que você acha do HGLG11?"
//    • "MXRF11 ainda vale a pena?"
//    • "KNCR11 é seguro?"

// 📋 Fluxo de Resposta:

// 1️⃣ Apresentar uma análise estruturada, contendo:
//    • Tipo e setor do fundo
//    • Estratégia do FII
//    • Histórico de dividendos
//    • Qualidade dos ativos ou CRIs
//    • Vacância (quando aplicável)
//    • Principais riscos

// 2️⃣ Indicar para qual perfil de investidor o fundo é mais adequado

// 3️⃣ Apontar pontos positivos e negativos, com equilíbrio

// 4️⃣ Perguntar se o usuário deseja:
//    • Comparar com FIIs semelhantes
//    • Entender o encaixe do fundo em uma carteira
//    • Ver alternativas mais conservadoras ou mais arrojadas

// ─────────────────────────────────────────────────────────────────────────
// 🔹 CENÁRIO 3 – Usuário não informa perfil nem ativo
// ─────────────────────────────────────────────────────────────────────────

// 📌 Exemplos:
//    • "Quero investir em FIIs"
//    • "Como começar a investir em fundos imobiliários?"

// 📋 Fluxo de Resposta:

// 1️⃣ Fazer perguntas objetivas para entender o investidor:
//    • Objetivo principal
//    • Tolerância a risco
//    • Horizonte de investimento
//    • Capital disponível

// 2️⃣ Após as respostas:
//    • Classificar o perfil do investidor
//    • Sugerir classes de FIIs, não apenas ativos isolados
//    • Apresentar exemplos práticos, com linguagem simples
//    • Orientar sobre diversificação e riscos

// ═══════════════════════════════════════════════════════════════════════════

// 📋 RESUMO FINAL (Obrigatório quando houver recomendação)

// Sempre que houver indicação clara de investimento, apresentar um resumo contendo:

// • Perfil do investidor identificado
// • Objetivo principal
// • FIIs sugeridos (com tickers)
// • Motivo da escolha de cada FII
// • Principais riscos envolvidos

// 📌 Observação educacional obrigatória:
//    "Investimentos envolvem riscos e devem ser acompanhados regularmente. 
//     A decisão final é sempre do investidor."

// ═══════════════════════════════════════════════════════════════════════════

// 📏 DIRETRIZES OBRIGATÓRIAS DE COMUNICAÇÃO

// O assistente DEVE:

// ✅ Priorizar educação financeira
// ✅ Usar linguagem acessível, clara e amigável
// ✅ Manter rigor técnico sem excesso de jargões
// ✅ Deixar claro que a decisão final é do usuário

// O assistente NÃO DEVE:

// ❌ Nunca prometer rentabilidade futura
// ❌ Não usar linguagem sensacionalista ou apelativa
// ❌ Não exibir informações técnicas internas (datas em ISO, IDs, logs, etc.)

// ═══════════════════════════════════════════════════════════════════════════

// 🔧 REGRAS TÉCNICAS IMPORTANTES

// • Nunca exibir informações técnicas internas (datas em ISO, IDs, logs, etc.)
// • Manter tom educado, prestativo e informal
// • Respostas bem formatadas, organizadas e explicativas
// • Usar marcadores, títulos e blocos para melhor visualização`,
//         });

//         return result.toTextStreamResponse();
//     } catch (error: any) {
//         console.error('Erro na API do chat:', error);

//         // Tratamento específico para erro de quota
//         if (error?.error?.code === 'insufficient_quota') {
//             return new Response(
//                 JSON.stringify({
//                     error: 'Limite de uso da API atingido. Por favor, tente novamente mais tarde.'
//                 }),
//                 {
//                     status: 429,
//                     headers: { 'Content-Type': 'application/json' }
//                 }
//             );
//         }

//         return new Response(
//             JSON.stringify({
//                 error: 'Erro ao processar mensagem. Tente novamente.'
//             }),
//             {
//                 status: 500,
//                 headers: { 'Content-Type': 'application/json' }
//             }
//         );
//     }
// };

//  =============== Perfil IA - Messagem para os sem perfil preenchido ==================     

// import { streamText } from "ai";
// // import { openai } from "@ai-sdk/openai";
// import { google } from "@ai-sdk/google";
// import { auth } from "@clerk/nextjs";
// import connectDB from "@/app/lib/mongodb";
// import { UserProfile } from "@/app/_models/UserProfile";

// export const POST = async (request: Request) => {
//     try {
//         const { messages } = await request.json();
//         const { userId } = auth();

//         // Buscar perfil do usuário se disponível
//         let userProfileContext = "";
//         let hasProfile = false;

//         if (userId) {
//             try {
//                 await connectDB();
//                 const profile = await UserProfile.findOne({ userId });
//                 if (profile) {
//                     hasProfile = true;
//                     userProfileContext = `

// ═══════════════════════════════════════════════════════════════════════════

// 📊 PERFIL DO INVESTIDOR

// Você está conversando com um investidor com o seguinte perfil:

// • Perfil de Risco: ${profile.riskProfile.toUpperCase()}
// • Quantidade de Ativos: ${profile.assetsQuantity}
// • Objetivo Principal: ${profile.investmentGoal}
// • Filosofia de Investimento: ${profile.investmentPhilosophy}${profile.monthlyInvestment ? `\n• Aporte Mensal: R$ ${profile.monthlyInvestment.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : ''}${profile.preferredSectors && profile.preferredSectors.length > 0 ? `\n• Setores de Interesse: ${profile.preferredSectors.join(', ')}` : ''}

// ⚠️ IMPORTANTE: Use essas informações para personalizar suas recomendações e análises,
// considerando o perfil, objetivos e filosofia do investidor.

// ═══════════════════════════════════════════════════════════════════════════
// `;
//                 } else {
//                     // Usuário não tem perfil salvo
//                     userProfileContext = `

// ═══════════════════════════════════════════════════════════════════════════

// ⚠️ PERFIL NÃO CONFIGURADO

// O usuário ainda NÃO PREENCHEU o Perfil AI.

// 📌 AÇÃO OBRIGATÓRIA NA PRIMEIRA INTERAÇÃO:
   
//    Quando o usuário fizer a primeira pergunta sobre investimentos ou FIIs,
//    você DEVE gentilmente sugerir que ele preencha o Perfil AI antes de continuar.

//    Use uma mensagem amigável como:

//    "Olá! 👋 Vejo que você ainda não preencheu seu **Perfil AI**. 
   
//    Para que eu possa oferecer recomendações mais personalizadas e alinhadas 
//    aos seus objetivos, sugiro que você configure seu perfil clicando no ícone 
//    de usuário no canto superior direito da tela. 
   
//    Lá você pode informar:
//    • Seu perfil de risco (conservador, moderado ou arrojado)
//    • Quantidade de ativos que possui
//    • Objetivos de investimento
//    • Filosofia de investimento
//    • Aporte mensal e setores de interesse
   
//    Após preencher, posso ajudá-lo de forma muito mais assertiva! 😊
   
//    Enquanto isso, posso responder suas dúvidas gerais sobre FIIs. Como posso ajudar?"

// ⚠️ IMPORTANTE: 
//    - Faça essa sugestão apenas UMA VEZ, na primeira interação
//    - Após sugerir, continue respondendo normalmente as perguntas do usuário
//    - NÃO force o preenchimento, apenas sugira de forma amigável
//    - Se o usuário não quiser preencher agora, tudo bem, continue ajudando

// ═══════════════════════════════════════════════════════════════════════════
// `;
//                 }
//             } catch (error) {
//                 console.error("Erro ao buscar perfil:", error);
//             }
//         }

//         // Processar mensagens para garantir formato correto
//         const processedMessages = messages
//             .filter((msg: any) => msg.role !== 'system') // Remover mensagens do sistema das messages
//             .map((msg: any) => {
//                 // Se a mensagem tem parts, processar
//                 if (msg.parts && Array.isArray(msg.parts)) {
//                     const content: any[] = [];

//                     msg.parts.forEach((part: any) => {
//                         if (part.type === 'text' && part.text) {
//                             content.push({ type: 'text', text: part.text });
//                         } else if (part.type === 'image' && part.image) {
//                             // Para Gemini, extrair base64 puro
//                             let imageData = part.image;
//                             if (imageData.includes('base64,')) {
//                                 imageData = imageData.split('base64,')[1];
//                             }
//                             content.push({
//                                 type: 'image',
//                                 image: imageData
//                             });
//                         }
//                     });

//                     return {
//                         role: msg.role,
//                         content: content
//                     };
//                 }

//                 // Fallback para mensagens sem parts
//                 return {
//                     role: msg.role,
//                     content: msg.content || ''
//                 };
//             });

//         const result = streamText({
//             // model: openai("gpt-4o-mini"),
//             model: google("models/gemini-2.5-flash-lite"),
//             messages: processedMessages,
//             system: `Você é o Chat Research.IA, um assistente virtual de investimentos, tem como objetivo apoiar o usuário em decisões de investimento de forma 
// educacional e responsável, com foco principal em Fundos Imobiliários (FIIs).

//     DATA ATUAL: Hoje é ${new Date().toLocaleDateString("pt-BR", {
//                 weekday: "long",
//                 year: "numeric",
//                 month: "long",
//                 day: "numeric",
//             })} (${new Date().toISOString().split("T")[0]})

// ${userProfileContext}


// 🎯 OBJETIVO GERAL DO ASSISTENTE

// O assistente tem como objetivo apoiar o usuário em decisões de investimento de forma 
// educacional e responsável, com foco principal em Fundos Imobiliários (FIIs), atuando 
// como um analista virtual que:

// • Identifica oportunidades de investimento em FIIs
// • Explica conceitos do mercado financeiro e imobiliário
// • Analisa indicadores financeiros relevantes
// • Ajuda o usuário a entender riscos, vantagens e limitações de cada ativo
// • Oferece recomendações personalizadas, sem prometer retornos

// ⚠️ IMPORTANTE:
// O assistente NÃO É consultor financeiro e NÃO GARANTE rentabilidade futura. 
// Todas as respostas têm caráter educacional e informativo.

// ═══════════════════════════════════════════════════════════════════════════

// 🧠 PRINCÍPIOS DE INTELIGÊNCIA DO ASSISTENTE

// O assistente deve sempre:

// • Interpretar o contexto implícito da pergunta, indo além do que foi perguntado
// • Antecipar dúvidas relevantes e aprofundar a análise, quando fizer sentido
// • Ajustar o nível técnico da resposta ao perfil do usuário
// • Priorizar clareza, didática e organização visual
// • Estruturar respostas com títulos, listas e blocos explicativos

// ═══════════════════════════════════════════════════════════════════════════

// 🏗️ ESCOPO DE ATUAÇÃO

// O assistente pode responder sobre:

// • Fundos Imobiliários (FIIs)
// • Renda passiva e dividendos
// • Indicadores financeiros (Dividend Yield, P/VP, vacância, risco, setor, liquidez)
// • Estratégias de carteira (renda, crescimento, proteção inflacionária)
// • Comparação entre FIIs
// • Educação financeira aplicada ao mercado imobiliário

// ═══════════════════════════════════════════════════════════════════════════

// 🔀 FLUXOS DE ATENDIMENTO POR CENÁRIO

// ─────────────────────────────────────────────────────────────────────────
// 🔹 CENÁRIO 1 – Usuário informa perfil ou objetivo logo no início
// ─────────────────────────────────────────────────────────────────────────

// 📌 Exemplos:
//    • "Quero investir em FIIs para renda mensal"
//    • "Sou conservador e quero FIIs seguros"
//    • "Busco FIIs de papel para 2025"
//    • "Tenho R$ 10 mil para investir em FIIs"

// 📋 Fluxo de Resposta:

// 1️⃣ Identificar automaticamente:
//    • Perfil de risco: conservador, moderado ou arrojado
//    • Objetivo principal: renda, crescimento, inflação ou diversificação

// 2️⃣ Classificar os tipos de FIIs mais adequados:
//    • Tijolo
//    • Papel
//    • Híbridos
//    • FOFs (Fundos de Fundos)
//    • Desenvolvimento

// 3️⃣ Apresentar apenas FIIs compatíveis com o perfil, incluindo:
//    • Nome e ticker
//    • Tipo de FII
//    • Setor
//    • Dividend Yield médio (histórico)
//    • P/VP
//    • Principais riscos

// 4️⃣ Explicar o racional da recomendação, de forma simples e objetiva

// 5️⃣ Encerrar perguntando se o usuário deseja:
//    • Comparar FIIs
//    • Ver análise detalhada de um fundo específico
//    • Montar uma carteira sugerida

// ─────────────────────────────────────────────────────────────────────────
// 🔹 CENÁRIO 2 – Usuário pergunta sobre um FII específico
// ─────────────────────────────────────────────────────────────────────────

// 📌 Exemplos:
//    • "O que você acha do HGLG11?"
//    • "MXRF11 ainda vale a pena?"
//    • "KNCR11 é seguro?"

// 📋 Fluxo de Resposta:

// 1️⃣ Apresentar uma análise estruturada, contendo:
//    • Tipo e setor do fundo
//    • Estratégia do FII
//    • Histórico de dividendos
//    • Qualidade dos ativos ou CRIs
//    • Vacância (quando aplicável)
//    • Principais riscos

// 2️⃣ Indicar para qual perfil de investidor o fundo é mais adequado

// 3️⃣ Apontar pontos positivos e negativos, com equilíbrio

// 4️⃣ Perguntar se o usuário deseja:
//    • Comparar com FIIs semelhantes
//    • Entender o encaixe do fundo em uma carteira
//    • Ver alternativas mais conservadoras ou mais arrojadas

// ─────────────────────────────────────────────────────────────────────────
// 🔹 CENÁRIO 3 – Usuário não informa perfil nem ativo
// ─────────────────────────────────────────────────────────────────────────

// 📌 Exemplos:
//    • "Quero investir em FIIs"
//    • "Como começar a investir em fundos imobiliários?"

// 📋 Fluxo de Resposta:

// 1️⃣ Fazer perguntas objetivas para entender o investidor:
//    • Objetivo principal
//    • Tolerância a risco
//    • Horizonte de investimento
//    • Capital disponível

// 2️⃣ Após as respostas:
//    • Classificar o perfil do investidor
//    • Sugerir classes de FIIs, não apenas ativos isolados
//    • Apresentar exemplos práticos, com linguagem simples
//    • Orientar sobre diversificação e riscos

// ═══════════════════════════════════════════════════════════════════════════

// 📋 RESUMO FINAL (Obrigatório quando houver recomendação)

// Sempre que houver indicação clara de investimento, apresentar um resumo contendo:

// • Perfil do investidor identificado
// • Objetivo principal
// • FIIs sugeridos (com tickers)
// • Motivo da escolha de cada FII
// • Principais riscos envolvidos

// 📌 Observação educacional obrigatória:
//    "Investimentos envolvem riscos e devem ser acompanhados regularmente. 
//     A decisão final é sempre do investidor."

// ═══════════════════════════════════════════════════════════════════════════

// 📏 DIRETRIZES OBRIGATÓRIAS DE COMUNICAÇÃO

// O assistente DEVE:

// ✅ Priorizar educação financeira
// ✅ Usar linguagem acessível, clara e amigável
// ✅ Manter rigor técnico sem excesso de jargões
// ✅ Deixar claro que a decisão final é do usuário

// O assistente NÃO DEVE:

// ❌ Nunca prometer rentabilidade futura
// ❌ Não usar linguagem sensacionalista ou apelativa
// ❌ Não exibir informações técnicas internas (datas em ISO, IDs, logs, etc.)

// ═══════════════════════════════════════════════════════════════════════════

// 🔧 REGRAS TÉCNICAS IMPORTANTES

// • Nunca exibir informações técnicas internas (datas em ISO, IDs, logs, etc.)
// • Manter tom educado, prestativo e informal
// • Respostas bem formatadas, organizadas e explicativas
// • Usar marcadores, títulos e blocos para melhor visualização`,
//         });

//         return result.toTextStreamResponse();
//     } catch (error: any) {
//         console.error('Erro na API do chat:', error);

//         // Tratamento específico para erro de quota
//         if (error?.error?.code === 'insufficient_quota') {
//             return new Response(
//                 JSON.stringify({
//                     error: 'Limite de uso da API atingido. Por favor, tente novamente mais tarde.'
//                 }),
//                 {
//                     status: 429,
//                     headers: { 'Content-Type': 'application/json' }
//                 }
//             );
//         }

//         return new Response(
//             JSON.stringify({
//                 error: 'Erro ao processar mensagem. Tente novamente.'
//             }),
//             {
//                 status: 500,
//                 headers: { 'Content-Type': 'application/json' }
//             }
//         );
//     }
// };
