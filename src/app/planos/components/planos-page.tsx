"use client";

import { useEffect, useState } from "react";
import { getUserSubscription } from "@/actions/get-user-subscription";
import { syncSubscriptionStatus } from "@/actions/sync-subscription-status";
import { PlanButton } from "@/app/planos/components/plan-button";
import { LoadingSpinner } from "@/components/common/loading-spinner";

interface UserSubscription {
  isActive: boolean;
  plan?: string;
  expiresAt?: Date | null;
  daysRemaining?: number | null;
  stripeSubscriptionId?: string | null;
}

interface Session {
  user?: {
    name?: string;
    email?: string;
    image?: string;
  };
}

interface PlanosContentProps {
  session: Session;
}

export function PlanosContent({ session }: PlanosContentProps) {
  const [userSubscription, setUserSubscription] = useState<UserSubscription | null>(null);
  const [planosTipo, setPlanosTipo] = useState<'mensal' | 'anual'>('mensal');
  const [isLoading, setIsLoading] = useState(true);

  // Lista dos planos disponíveis
  const planos = [
    {
      id: 'iniciante',
      tipo: 'mensal',
      nome: 'Iniciante',
      preco: 'R$ ?',
      // preco: 'R$ 10,00',
      precoDetalhe: '/mês',
      planType: 'iniciante',
      features: [
        'Acompanhe até 10 ativos',
        'Alerta de acompanhamento lista de ativos',
        'Alertas de variações de preços',
      ],
      notIncluded: [
        'Acompanhe até 45 ativos',
        'Alerta de acompanhamento lista de ativos',
        'Resumo diário após o fechamento do mercado',
        'Alertas sobre variação de preços',
        'Atualizações dos seus ativos automaticamente',
        'Alerta de Dividendos de FIIs',

        // TODO: prioridade 2
        // 'Alerta de Dividendos de Ações e ETFs',
        // 'Rendimentos de todos os FII, Fiagro, FIP-IE, FI-Infra',
        // 'Fatos Relevantes e comunicados do mercado',

        // TODO: prioridade 1
        // 'Atualizações das taxas do Tesouro Direto (Breve)',
        // 'Fatos Relevantes resumidos por IA (Breve)',
        // 'Relatórios Gerenciais resumidos por IA (Breve)'
      ],
    },
    {
      id: 'investidor',
      tipo: 'mensal',
      nome: 'Investidor',
      preco: 'R$ ?',
      // preco: 'R$ 15,00',
      precoDetalhe: '/mês',
      planType: 'investidor',
      features: [
        'Acompanhe até 45 ativos',
        'Alerta de acompanhamento lista de ativos',
        'Resumo diário após o fechamento do mercado',
        'Alertas sobre variação de preços',
        'Atualizações dos seus ativos automaticamente',
        'Alerta de Dividendos de FIIs',

        // TODO: prioridade 2
        // 'Alerta de Dividendos de Ações e ETFs',
        // 'Rendimentos de todos os FII, Fiagro, FIP-IE, FI-Infra',
        // 'Fatos Relevantes e comunicados do mercado',

        // TODO: prioridade 1
        // 'Atualizações das taxas do Tesouro Direto (Breve)',
        // 'Fatos Relevantes resumidos por IA (Breve)',
        // 'Relatórios Gerenciais resumidos por IA (Breve)'
      ],
      notIncluded: [],
    },
    {
      id: 'iniciante_anual',
      tipo: 'anual',
      nome: 'Iniciante (ANUAL)',
      preco: 'R$ ?',
      // preco: 'R$ 120,00',
      precoDetalhe: '/ano',
      planType: 'iniciante_anual',
      features: [
        'Acompanhe até 10 ativos',
        'Alerta de acompanhamento lista de ativos',
        'Alertas de variações de preços',
      ],
      notIncluded: [
        'Acompanhe até 45 ativos',
        'Alerta de acompanhamento lista de ativos',
        'Resumo diário após o fechamento do mercado',
        'Alertas sobre variação de preços',
        'Atualizações dos seus ativos automaticamente',
        'Alerta de Dividendos de FIIs',

        // TODO: prioridade 2
        // 'Alerta de Dividendos de Ações e ETFs',
        // 'Rendimentos de todos os FII, Fiagro, FIP-IE, FI-Infra',
        // 'Fatos Relevantes e comunicados do mercado',

        // TODO: prioridade 1
        // 'Atualizações das taxas do Tesouro Direto (Breve)',
        // 'Fatos Relevantes resumidos por IA (Breve)',
        // 'Relatórios Gerenciais resumidos por IA (Breve)'
      ],
    },
    {
      id: 'investidor_anual',
      tipo: 'anual',
      nome: 'Investidor (ANUAL)',
      preco: 'R$ ?',
      // preco: 'R$ 180,00',
      precoDetalhe: '/ano',
      planType: 'investidor_anual',
      features: [
        'Acompanhe até 45 ativos',
        'Alerta de acompanhamento lista de ativos',
        'Resumo diário após o fechamento do mercado',
        'Alertas sobre variação de preços',
        'Atualizações dos seus ativos automaticamente',
        'Alerta de Dividendos de FIIs',

        // TODO: prioridade 2
        // 'Alerta de Dividendos de Ações e ETFs',
        // 'Rendimentos de todos os FII, Fiagro, FIP-IE, FI-Infra',
        // 'Fatos Relevantes e comunicados do mercado',

        // TODO: prioridade 1
        // 'Atualizações das taxas do Tesouro Direto (Breve)',
        // 'Fatos Relevantes resumidos por IA (Breve)',
        // 'Relatórios Gerenciais resumidos por IA (Breve)'
      ],
      notIncluded: [],
    },
  ];


  const getPlanDisplayName = (planType: string) => {
    console.log('Plan type received:', planType);
    const planNames: Record<string, string> = {
      'iniciante': 'Iniciante',
      'iniciante_anual': 'Iniciante (Anual)',
      'investidor': 'Investidor',
      'investidor_anual': 'Investidor (Anual)',
      'beta_tester': 'Beta Tester',
    };
    const displayName = planNames[planType] || planType;
    console.log('Display name:', displayName);
    return displayName;
  };

  useEffect(() => {
    const loadSubscriptionData = async () => {
      if (session?.user) {
        setIsLoading(true);
        try {
          await syncSubscriptionStatus();
          const subscription = await getUserSubscription();
          console.log('Subscription data:', subscription);
          setUserSubscription(subscription);
        } catch (error) {
          console.error("Erro ao carregar dados da assinatura:", error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadSubscriptionData();
  }, [session]);

  if (isLoading) {
    return (
      <main className="flex-1 p-3 sm:p-4 md:p-6 pb-24 md:pb-6 min-h-screen overflow-hidden">
        <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
          <LoadingSpinner />
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 p-3 sm:p-4 md:p-6 pb-24 md:pb-6 min-h-screen overflow-hidden">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">

        <div className="mb-6 sm:mb-8">


          <h1 className="text-xl sm:text-2xl">Planos</h1>

          <br />

          <p className="text-sm sm:text-base md:text-lg text-gray-400">
            Escolha o plano ideal para você e comece a receber alertas!
          </p>

          <br />

          {/* <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-2 break-words">
            Planos
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-gray-400">
            Escolha o plano ideal para você e comece a receber alertas!
          </p> */}
        </div>

        <br />

        {/* Status da Assinatura */}
        {userSubscription && userSubscription.isActive && (
          <div className="max-w-md mx-auto bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-400/30 rounded-xl p-6 text-center mb-8 backdrop-blur-sm shadow-lg">
            <div className="flex items-center justify-center gap-3 mb-3">
              <div className="w-8 h-8 bg-green-400/20 rounded-full flex items-center justify-center">
                <span className="text-green-400 text-lg">✓</span>
              </div>
              <h3 className="text-green-400 font-bold text-lg tracking-wide">PLANO ATIVO</h3>
            </div>
            <div className="bg-white/5 rounded-lg py-3 px-4 backdrop-blur-sm">
              <p className="text-white font-semibold text-lg">
                {getPlanDisplayName(userSubscription.plan || '')}
              </p>
            </div>
          </div>
        )}

        <br />

        {/* === Planos === */}

        <div className="mb-16">
          {/* Toggle Mensal/Anual */}
          <div className="flex justify-center mb-8">
            <div className="flex bg-[#181825] rounded-full p-1 border border-gray-700 w-fit">
              <button
                className={`px-6 py-2 rounded-full font-semibold transition-all ${planosTipo === 'mensal' ? 'bg-[#001770] text-white shadow' : 'text-white'}`}
                onClick={() => setPlanosTipo('mensal')}
              >
                Mensal
              </button>
              <button
                className={`px-6 py-2 rounded-full font-semibold transition-all ${planosTipo === 'anual' ? 'bg-[#001770] text-white shadow' : 'text-white'}`}
                onClick={() => setPlanosTipo('anual')}
              >
                Anual
              </button>

              {/* <button
                className={`px-6 py-2 rounded-full font-semibold transition-all ${planosTipo === 'anual' ? 'bg-lime-200 text-black shadow' : 'text-white'}`}
                onClick={() => setPlanosTipo('anual')}
              >
                Anual <span className="text-green-500 font-normal ml-1">2 meses grátis!</span>
              </button> */}
            </div>
          </div>
          {/* Cards filtrados */}
          <div className="flex justify-center">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 max-w-4xl">
              {planos.filter(p => p.tipo === planosTipo).map(plano => (
                <div
                  key={plano.id}
                  className={`bg-[#1a1a35] rounded-xl p-6 sm:p-8 transition-all relative ${userSubscription?.isActive && userSubscription?.plan === plano.planType
                    ? 'border-2 border-green-500 shadow-lg shadow-green-500/20'
                    : 'border border-gray-700 hover:border-gray-600'
                    }`}
                >
                  {/* Badge do Plano Ativo */}
                  {userSubscription?.isActive && userSubscription?.plan === plano.planType && (
                    <div className="absolute -top-3 sm:-top-4 left-1/2 transform -translate-x-1/2 z-10">
                      <span className="bg-green-500 text-white px-2 sm:px-3 lg:px-4 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold shadow-lg border-2 border-green-400">
                        ✅ ATIVO
                      </span>
                    </div>
                  )}
                  <div className="text-center">
                    <h3 className="text-lg sm:text-xl font-bold text-white mb-2">{plano.nome}</h3>
                    <div className="mb-4 sm:mb-6">
                      {/* <span className="text-2xl sm:text-3xl lg:text-4xl font-bold text-blue-400">{plano.preco}</span> */}
                      <span className="text-gray-400 text-sm sm:text-base">{plano.precoDetalhe}</span>
                    </div>
                  </div>
                  <ul className="space-y-2 sm:space-y-3 mb-6 sm:mb-8">
                    {plano.features.map((f, i) => (
                      <li key={i} className="flex items-center text-white text-sm sm:text-base">
                        <span className="w-5 h-5 bg-purple-200 rounded-full flex items-center justify-center mr-3 text-xs text-purple-800 flex-shrink-0">✓</span>
                        {f}
                      </li>
                    ))}
                    {plano.notIncluded.map((f, i) => (
                      <li key={i} className="flex items-center text-gray-400 text-sm sm:text-base opacity-90">
                        <span className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center mr-3 text-xs text-white flex-shrink-0">✗</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                  {/* <PlanButton
                    planType={plano.planType}
                    isDisabled={userSubscription?.isActive}
                  >
                    Escolher Plano
                  </PlanButton> */}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* === FAQ Section === */}
        <div className="mt-12 sm:mt-16">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">Perguntas Frequentes</h2>
          </div>

          <div className="max-w-4xl mx-auto">
            <FAQAccordion />
          </div>

          <br />
          <br />
          <br />
          <br />

        </div>
      </div>
    </main>
  );
}

// Componente FAQ Accordion
function FAQAccordion() {
  const [openItem, setOpenItem] = useState<number | null>(null);

  const faqItems = [
    {
      question: "Como funcionam os alertas?",
      answer: "Você recebe os alertas diretamente no seu WhatsApp, sem precisar entrar na plataforma. É possível configurar diversos alertas, como: variações de preço, anúncio de rendimentos, atualizações automáticas, relatórios dos seus ativos."
    },
    {
      question: "Posso mudar de plano quando quiser?",
      answer: "Sim! Você pode fazer upgrade ou downgrade do seu plano a qualquer momento em gerenciar assinatura."
    },
    {
      question: "O que acontece se eu cancelar meu plano?",
      answer: "Você pode cancelar sua assinatura a qualquer momento sem taxas de cancelamento e você terá acesso até o final do período pago, sem renovação automática."
    },
    {
      question: "Qual a diferença entre os planos Iniciante e Investidor?",
      answer: "O Iniciante é ideal para quem está começando e quer acompanhar até 10 ativos com alertas básicos. O Investidor oferece recursos completos, incluindo acompanhamento de até 45 ativos, resumo diário, alertas de dividendos, fatos relevantes resumidos por IA e muito mais."
    },
    // {
    //   question: "Vocês têm plano anual com desconto?",
    //   answer: "Você tem até 7 dias para solicitar reembolso."
    // }
  ];

  const toggleItem = (index: number) => {
    setOpenItem(openItem === index ? null : index);
  };

  return (
    <div className="space-y-1">
      {faqItems.map((item, index) => (
        <div key={index} className="border-b border-gray-700">
          <button
            onClick={() => toggleItem(index)}
            className="w-full py-4 sm:py-6 px-4 sm:px-6 text-left flex justify-between items-center hover:bg-gray-800/30 transition-colors"
          >
            <span className={`text-sm sm:text-base lg:text-lg font-medium pr-4 ${openItem === index ? 'text-blue-400' : 'text-white'
              }`}>
              {item.question}
            </span>
            <span className={`text-xl sm:text-2xl transition-transform duration-200 flex-shrink-0 ${openItem === index ? 'rotate-45 text-blue-400' : 'text-blue-400'
              }`}>
              +
            </span>
          </button>

          {openItem === index && (
            <div className="px-4 sm:px-6 pb-4 sm:pb-6 text-gray-300 text-xs sm:text-sm lg:text-base leading-relaxed animate-in slide-in-from-top-1">
              {item.answer}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
