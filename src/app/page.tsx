"use client";

import { ActivityIcon, BarChart3Icon, BellIcon, BuildingIcon, CheckIcon, CrownIcon, DollarSignIcon, MessageCircleIcon, ShieldIcon, SmartphoneIcon, StarIcon, TrendingUpIcon, Users2Icon, XIcon, ZapIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import Image from "next/image";

import Footer from "@/components/common/footer";
import { Header } from "@/components/common/header";
import { TestEnvironmentBanner } from "@/components/common/test-environment-banner";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

const Home = () => {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const [planosTipo, setPlanosTipo] = useState<'mensal' | 'anual'>('mensal');
  const [showMessages, setShowMessages] = useState([false, false, false, false]);
  const [isTyping, setIsTyping] = useState(false);

  // Simula o recebimento de mensagens
  useEffect(() => {
    const timers = [
      setTimeout(() => setShowMessages(prev => [true, false, false, false]), 1000),
      setTimeout(() => {
        setIsTyping(true);
        setTimeout(() => {
          setIsTyping(false);
          setShowMessages(prev => [true, true, false, false]);
        }, 1500);
      }, 2500),
      setTimeout(() => {
        setIsTyping(true);
        setTimeout(() => {
          setIsTyping(false);
          setShowMessages(prev => [true, true, true, false]);
        }, 1500);
      }, 5000),
      setTimeout(() => {
        setIsTyping(true);
        setTimeout(() => {
          setIsTyping(false);
          setShowMessages(prev => [true, true, true, true]);
        }, 1500);
      }, 7500),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  // Intersection Observer para animações on-scroll (bidirecional)
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-in');
          } else {
            entry.target.classList.remove('animate-in');
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px'
      }
    );

    const elements = document.querySelectorAll('.animate-on-scroll');
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [isPending]);

  // Dados dos planos
  const planosData = {
    mensal: [
      {
        id: 'iniciante',
        nome: 'Iniciante',
        preco: 'R$ ?',
        // preco: 'R$ 10,00',
        precoDetalhe: '/mês',
        features: [
          'Acompanhe até 10 ativos',
          'Alerta de acompanhamento lista de ativos',
          'Alertas de variações de preços'
        ],
        notIncluded: [
          'Resumo diário após o fechamento do mercado',
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
        ]
      },
      {
        id: 'investidor',
        nome: 'Investidor',
        preco: 'R$ ?',
        // preco: 'R$ 15,00',
        precoDetalhe: '/mês',
        isPopular: true,
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
        notIncluded: []
      }
    ],
    anual: [
      {
        id: 'iniciante_anual',
        nome: 'Iniciante (ANUAL)',
        preco: 'R$ ?',
        // preco: 'R$ 120,00',
        precoDetalhe: '/ano',
        features: [
          'Acompanhe até 10 ativos',
          'Alerta de acompanhamento lista de ativos',
          'Alertas de variações de preços'
        ],
        notIncluded: [
          'Resumo diário após o fechamento do mercado',
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
        ]
      },
      {
        id: 'investidor_anual',
        nome: 'Investidor (ANUAL)',
        preco: 'R$ ?',
        // preco: 'R$ 180,00',
        precoDetalhe: '/ano',
        isPopular: true,
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
        notIncluded: []
      }
    ]
  };

  // Redirect para home se já estiver logado
  useEffect(() => {
    if (!isPending && session) {
      router.push("/home");
    }
  }, [session, isPending, router]);

  // Loading state enquanto verifica a sessão
  if (isPending) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black">
        <div className="fixed top-0 left-0 right-0 z-50 bg-[#111115] border-b border-gray-800 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="w-32 h-8 bg-gray-700 rounded animate-pulse"></div>
              <div className="flex items-center space-x-4">
                <div className="w-16 h-8 bg-gray-700 rounded animate-pulse"></div>
                <div className="w-16 h-8 bg-gray-700 rounded animate-pulse"></div>
                <div className="w-20 h-8 bg-gray-700 rounded animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-24 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center space-y-6 mb-16">
              <div className="w-96 h-12 bg-gray-700 rounded animate-pulse mx-auto"></div>
              <div className="w-64 h-6 bg-gray-700 rounded animate-pulse mx-auto"></div>
              <div className="flex justify-center space-x-4">
                <div className="w-32 h-12 bg-gray-700 rounded animate-pulse"></div>
                <div className="w-32 h-12 bg-gray-700 rounded animate-pulse"></div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
              {[1, 2, 3].map((item) => (
                <div key={item} className="bg-gray-800/50 rounded-lg p-6">
                  <div className="w-12 h-12 bg-gray-700 rounded animate-pulse mb-4"></div>
                  <div className="w-32 h-6 bg-gray-700 rounded animate-pulse mb-3"></div>
                  <div className="w-full h-4 bg-gray-700 rounded animate-pulse mb-2"></div>
                  <div className="w-3/4 h-4 bg-gray-700 rounded animate-pulse"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <TestEnvironmentBanner />
      <style jsx global>{`
        html {
          scroll-behavior: smooth;
        }
        
        @keyframes fade-in-up {
          0% {
            opacity: 0;
            transform: translateY(20px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes slide-in-left {
          0% {
            opacity: 0;
            transform: translateX(-60px);
          }
          100% {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes slide-in-right {
          0% {
            opacity: 0;
            transform: translateX(60px);
          }
          100% {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes scale-in {
          0% {
            opacity: 0;
            transform: scale(0.9);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        .animate-on-scroll {
          opacity: 0;
        }
        
        .animate-on-scroll.animate-in {
          animation: fade-in-up 0.8s ease-out forwards;
        }
        
        .animate-on-scroll.slide-left.animate-in {
          animation: slide-in-left 0.8s ease-out forwards;
        }
        
        .animate-on-scroll.slide-right.animate-in {
          animation: slide-in-right 0.8s ease-out forwards;
        }
        
        .animate-on-scroll.scale.animate-in {
          animation: scale-in 0.8s ease-out forwards;
        }
        
        .animate-on-scroll.delay-100.animate-in {
          animation-delay: 0.1s;
        }
        
        .animate-on-scroll.delay-200.animate-in {
          animation-delay: 0.2s;
        }
        
        .animate-on-scroll.delay-300.animate-in {
          animation-delay: 0.3s;
        }
        
        .animate-on-scroll.delay-400.animate-in {
          animation-delay: 0.4s;
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out forwards;
          opacity: 0;
        }
        
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        
        @keyframes glow-pulse {
          0%, 100% {
            opacity: 0.5;
          }
          50% {
            opacity: 1;
          }
        }
        
        .glow-border {
          position: relative;
        }
        
        .glow-border::before {
          content: '';
          position: absolute;
          inset: -2px;
          border-radius: inherit;
          padding: 2px;
          background: linear-gradient(45deg, #3b82f6, #8b5cf6, #06b6d4, #3b82f6);
          background-size: 300% 300%;
          animation: gradient-shift 3s ease infinite, glow-pulse 2s ease-in-out infinite;
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          z-index: -1;
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        
        .glow-border:hover::before {
          opacity: 1;
        }
        
        @keyframes gradient-shift {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
      `}</style>

      <Header />

      <div className="w-full overflow-x-hidden min-h-screen pt-28 relative">
        {/* Background Image */}
        <div className="fixed inset-0 z-0">
          <Image
            src="/fundogra.png"
            alt="Background"
            fill
            className="object-cover"
            priority
          />
          {/* Dark overlay para melhor legibilidade */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70"></div>
        </div>

        <br />

        {/* === Hero Section === */}

        <section className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">

          <div className="max-w-7xl mx-auto relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              {/* Conteúdo Principal */}
              <div className="text-center lg:text-left space-y-8 animate-on-scroll slide-left">
                {/* <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600/20 to-cyan-600/20 backdrop-blur-sm border border-blue-500/30 text-blue-300 px-6 py-3 rounded-full text-sm font-semibold">
                  <BuildingIcon className="w-4 h-4" />
                  <span>LUCAS FII ALERTS - FUNDOS IMOBILIÁRIOS</span>
                </div> */}

                <h1 className="text-5xl md:text-7xl font-black text-white leading-tight animate-on-scroll delay-100">
                  Maximize seus
                  <span className="bg-gradient-to-r from-blue-400 via-cyan-500 to-blue-600 bg-clip-text text-transparent block mt-2">
                    FIIs com IA
                  </span>
                  no WhatsApp
                </h1>

                <p className="text-xl text-gray-300 max-w-2xl leading-relaxed animate-on-scroll delay-200">
                  Receba alertas inteligentes em tempo real sobre seus Fundos Imobiliários favoritos.
                  Nossa IA monitora 24/7 preços, dividendos, oportunidades e muito mais,
                  enviando tudo direto no seu WhatsApp.
                </p>

                <div className="flex flex-col sm:flex-row gap-6">
                  {/* <Button
                    size="lg"
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-6 px-10 rounded-2xl text-lg shadow-2xl transform hover:scale-105 transition-all duration-300"
                  >
                    <MessageCircleIcon className="mr-3 h-6 w-6" />
                    Começar Agora
                  </Button> */}

                  {/* <Button
                    size="lg"
                    variant="outline"
                    className="border-2 border-blue-500/50 text-blue-400 hover:bg-blue-500/10 font-bold py-6 px-10 rounded-2xl text-lg backdrop-blur-sm transition-all duration-300"
                  >
                    <ActivityIcon className="mr-3 h-6 w-6" />
                    Ver Demo Ao Vivo
                  </Button> */}
                </div>

                <div className="grid grid-cols-3 gap-6 pt-8 animate-on-scroll delay-300">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-white">📱</div>
                    <div className="text-sm text-gray-400">WhatsApp</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-white">⚡</div>
                    <div className="text-sm text-gray-400">Tempo real</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-white">🤖</div>
                    <div className="text-sm text-gray-400">IA especializada</div>
                  </div>
                </div>
              </div>

              {/* Mockup do WhatsApp Melhorado */}
              <div className="relative flex justify-center animate-on-scroll slide-right delay-200">
                <div className="relative">
                  {/* Efeito de glow animado */}
                  <div className="absolute -inset-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl blur-xl opacity-30 animate-pulse"></div>

                  {/* Partículas flutuantes */}
                  <div className="absolute -inset-20 overflow-hidden pointer-events-none">
                    <div className="absolute top-10 left-10 w-2 h-2 bg-blue-400 rounded-full animate-float" style={{ animationDelay: '0s', animationDuration: '3s' }}></div>
                    <div className="absolute top-32 right-10 w-1.5 h-1.5 bg-purple-400 rounded-full animate-float" style={{ animationDelay: '1s', animationDuration: '4s' }}></div>
                    <div className="absolute bottom-24 left-16 w-1 h-1 bg-cyan-400 rounded-full animate-float" style={{ animationDelay: '2s', animationDuration: '3.5s' }}></div>
                  </div>

                  {/* Smartphone Frame com animação 3D */}
                  <div className="relative bg-gray-900/90 backdrop-blur-xl rounded-[3rem] p-3 shadow-2xl border border-gray-700/50 hover:scale-105 transition-transform duration-500 hover:rotate-y-6" style={{ transformStyle: 'preserve-3d' }}>
                    <div className="bg-black rounded-[2.5rem] overflow-hidden">
                      {/* Status Bar */}
                      <div className="bg-gray-900 px-6 py-3 flex justify-between items-center text-white text-sm">
                        <span className="font-semibold">9:41</span>
                        <div className="flex items-center gap-2">
                          <div className="flex gap-1">
                            <div className="w-1 h-4 bg-white rounded-full"></div>
                            <div className="w-1 h-4 bg-white rounded-full"></div>
                            <div className="w-1 h-4 bg-white/50 rounded-full"></div>
                          </div>
                          <div className="w-6 h-3 bg-gradient-to-r from-green-400 to-blue-500 rounded-sm"></div>
                        </div>
                      </div>

                      {/* WhatsApp Header */}
                      <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 text-white flex items-center gap-4">
                        <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                          <BellIcon className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="font-bold text-lg">Lucas FII Alerts</div>
                          <div className="text-sm text-blue-100 flex items-center gap-1">
                            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                            online agora
                          </div>
                        </div>
                      </div>

                      {/* Messages */}
                      <div className="bg-gradient-to-b from-gray-900 to-black h-[500px] p-6 space-y-4 overflow-y-auto scrollbar-hide relative">
                        {/* Indicador de digitação */}
                        {isTyping && (
                          <div className="flex justify-start animate-slideInLeft">
                            <div className="bg-gray-700/50 backdrop-blur-sm border border-gray-600/30 rounded-2xl px-6 py-3">
                              <div className="flex gap-1.5">
                                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                              </div>
                            </div>
                          </div>
                        )}
                        {/* Alert Message 1 - Preço */}
                        {showMessages[0] && (
                          <div className="flex justify-start animate-slideInLeft">
                            <div className="bg-gradient-to-r from-red-500/20 to-red-600/20 backdrop-blur-sm border border-red-500/30 rounded-2xl px-4 py-3 max-w-xs shadow-lg hover:shadow-red-500/20 hover:scale-105 transition-all duration-300">
                              <div className="flex items-center gap-2 text-red-400 text-xs font-bold mb-2">
                                <TrendingUpIcon className="w-3 h-3" />
                                ALERTA DE PREÇO
                              </div>
                              <div className="text-white text-sm space-y-1">
                                <div className="font-bold text-base">HGLG11</div>
                                <div className="text-red-300">📉 R$ 160,50 (-2,3%)</div>
                                <div className="text-gray-300">Atingiu limite de compra!</div>
                                <div className="text-blue-300 text-xs">💡 Boa oportunidade</div>
                              </div>
                              <div className="text-gray-500 text-xs mt-2">09:15</div>
                            </div>
                          </div>
                        )}

                        {/* Alert Message 2 - Dividendos */}
                        {showMessages[1] && (
                          <div className="flex justify-start animate-slideInLeft">
                            <div className="bg-gradient-to-r from-yellow-500/20 to-amber-600/20 backdrop-blur-sm border border-yellow-500/30 rounded-2xl px-4 py-3 max-w-xs shadow-lg hover:shadow-yellow-500/20 hover:scale-105 transition-all duration-300">
                              <div className="flex items-center gap-2 text-yellow-400 text-xs font-bold mb-2">
                                <DollarSignIcon className="w-3 h-3" />
                                PAGAMENTO DE DIVIDENDOS
                              </div>
                              <div className="text-white text-sm space-y-1">
                                <div className="font-bold text-base">VISC11</div>
                                <div className="text-yellow-300">💰 R$ 0,95 por cota</div>
                                <div className="text-gray-300">Ex-dividendo: 15/11/2024</div>
                                <div className="text-green-300 text-xs">📈 Yield: 0,89%</div>
                              </div>
                              <div className="text-gray-500 text-xs mt-2">08:30</div>
                            </div>
                          </div>
                        )}

                        {/* Alert Message 3 - Alta */}
                        {showMessages[2] && (
                          <div className="flex justify-start animate-slideInLeft">
                            <div className="bg-gradient-to-r from-green-500/20 to-emerald-600/20 backdrop-blur-sm border border-green-500/30 rounded-2xl px-4 py-3 max-w-xs shadow-lg hover:shadow-green-500/20 hover:scale-105 transition-all duration-300">
                              <div className="flex items-center gap-2 text-green-400 text-xs font-bold mb-2">
                                <ZapIcon className="w-3 h-3" />
                                ALTA SIGNIFICATIVA
                              </div>
                              <div className="text-white text-sm space-y-1">
                                <div className="font-bold text-base">BTLG11</div>
                                <div className="text-green-300">📈 R$ 105,20 (+5,1%)</div>
                                <div className="text-gray-300">Volume acima da média</div>
                                <div className="text-purple-300 text-xs">🎯 Considere venda parcial</div>
                              </div>
                              <div className="text-gray-500 text-xs mt-2">07:45</div>
                            </div>
                          </div>
                        )}

                        {/* Alert Message 4 - IA Insight */}
                        {showMessages[3] && (
                          <div className="flex justify-start animate-slideInLeft">
                            <div className="bg-gradient-to-r from-blue-500/20 to-cyan-600/20 backdrop-blur-sm border border-blue-500/30 rounded-2xl px-4 py-3 max-w-xs shadow-lg hover:shadow-blue-500/20 hover:scale-105 transition-all duration-300">
                              <div className="flex items-center gap-2 text-blue-400 text-xs font-bold mb-2">
                                <StarIcon className="w-3 h-3" />
                                INSIGHT DE IA
                              </div>
                              <div className="text-white text-sm space-y-1">
                                <div className="text-blue-300">🤖 Análise do setor</div>
                                <div className="text-gray-300">FIIs de logística em alta</div>
                                <div className="text-cyan-300 text-xs">📊 3 oportunidades detectadas</div>
                              </div>
                              <div className="text-gray-500 text-xs mt-2">07:20</div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Input Area */}
                      <div className="bg-gray-800/80 backdrop-blur-sm px-6 py-4 border-t border-gray-700/50">
                        <div className="bg-gray-700/50 rounded-full px-4 py-3 text-gray-400 text-sm flex items-center gap-2">
                          <MessageCircleIcon className="w-4 h-4" />
                          Digite uma mensagem...
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Grid Pattern Background */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.02)_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,black,transparent)]"></div>
        </section>

        {/* Seção de Funcionalidades Principais */}
        <section id="recursos" className="py-32 px-4 sm:px-6 lg:px-8 relative">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-20 animate-on-scroll">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-sm border border-blue-500/30 text-blue-300 px-6 py-3 rounded-full text-sm font-semibold mb-6">
                <StarIcon className="w-4 h-4" />
                <span>TECNOLOGIA AVANÇADA</span>
              </div>
              <h2 className="text-4xl md:text-6xl font-black text-white mb-8">
                Recursos que fazem a
                <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent block mt-2">
                  diferença real
                </span>
              </h2>
              <p className="text-xl text-gray-400 max-w-4xl mx-auto leading-relaxed">
                Desenvolvido com inteligência artificial de última geração para monitorar
                o mercado de FIIs 24/7 e identificar as melhores oportunidades automaticamente.
              </p>
            </div>

            {/* Grid de Funcionalidades */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Alertas Inteligentes */}
              <div className="group relative animate-on-scroll scale delay-100">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl blur-lg opacity-25 group-hover:opacity-50 transition duration-500"></div>
                <div className="relative bg-gray-900/80 backdrop-blur-xl border border-gray-700/50 rounded-3xl p-8 h-full hover:border-blue-500/50 transition-all duration-500">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    <BellIcon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">Alertas Personalizados</h3>
                  <p className="text-gray-400 mb-6 leading-relaxed">
                    Configure alertas específicos para cada Ativo: variação de preço, Lista de acompanhamento,
                    dividendos, e muito mais. Receba no WhatsApp em tempo real.
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-blue-300">
                      <CheckIcon className="w-4 h-4" />
                      <span>Alertas de preço min/max</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-blue-300">
                      <CheckIcon className="w-4 h-4" />
                      <span>Notificação de dividendos</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-blue-300">
                      <CheckIcon className="w-4 h-4" />
                      <span>Volume anormal detectado</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Análise de IA */}
              <div className="group relative animate-on-scroll scale delay-200">
                <div className="absolute -inset-1 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-3xl blur-lg opacity-25 group-hover:opacity-50 transition duration-500"></div>
                <div className="relative bg-gray-900/80 backdrop-blur-xl border border-gray-700/50 rounded-3xl p-8 h-full hover:border-cyan-500/50 transition-all duration-500">
                  <div className="w-16 h-16 bg-gradient-to-r from-cyan-500 to-cyan-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    <BarChart3Icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">Análises de IA</h3>
                  <p className="text-gray-400 mb-6 leading-relaxed">
                    Nossa inteligência artificial analisa padrões históricos, tendências
                    do mercado e comportamento dos FIIs para gerar insights únicos.
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-cyan-300">
                      <CheckIcon className="w-4 h-4" />
                      <span>Análise de tendências</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-cyan-300">
                      <CheckIcon className="w-4 h-4" />
                      <span>Oportunidades detectadas</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-cyan-300">
                      <CheckIcon className="w-4 h-4" />
                      <span>Relatórios automáticos</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* TODO: Monitoramento 24/7 */}

              {/* <div className="group relative" data-aos="fade-up" data-aos-delay="300">
                <div className="absolute -inset-1 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-3xl blur-lg opacity-25 group-hover:opacity-50 transition duration-500"></div>
                <div className="relative bg-gray-900/80 backdrop-blur-xl border border-gray-700/50 rounded-3xl p-8 h-full hover:border-emerald-500/50 transition-all duration-500">
                  <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    <TrendingUpIcon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">Vigilância Contínua</h3>
                  <p className="text-gray-400 mb-6 leading-relaxed">
                    Monitoramento ininterrupto do mercado de FIIs. Nunca perca uma
                    oportunidade, mesmo durante finais de semana e feriados.
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-emerald-300">
                      <CheckIcon className="w-4 h-4" />
                      <span>24/7 sem parar</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-emerald-300">
                      <CheckIcon className="w-4 h-4" />
                      <span>Feriados inclusos</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-emerald-300">
                      <CheckIcon className="w-4 h-4" />
                      <span>Tempo real garantido</span>
                    </div>
                  </div>
                </div>
              </div> */}

              {/* Portfolio Tracking */}
              <div className="group relative animate-on-scroll scale delay-300">
                <div className="absolute -inset-1 bg-gradient-to-r from-orange-600 to-red-600 rounded-3xl blur-lg opacity-25 group-hover:opacity-50 transition duration-500"></div>
                <div className="relative bg-gray-900/80 backdrop-blur-xl border border-gray-700/50 rounded-3xl p-8 h-full hover:border-orange-500/50 transition-all duration-500">
                  <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    <ActivityIcon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">Portfolio Inteligente</h3>
                  <p className="text-gray-400 mb-6 leading-relaxed">
                    Acompanhe performance da sua carteira, diversificação por setor
                    e receba sugestões de otimização baseadas em IA.
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-orange-300">
                      <CheckIcon className="w-4 h-4" />
                      <span>Performance em tempo real</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-orange-300">
                      <CheckIcon className="w-4 h-4" />
                      <span>Análise de diversificação</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-orange-300">
                      <CheckIcon className="w-4 h-4" />
                      <span>Sugestões de otimização</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* TODO: Ocultado
               WhatsApp Integration */}

              {/* <div className="group relative" data-aos="fade-up" data-aos-delay="500">
                <div className="absolute -inset-1 bg-gradient-to-r from-green-600 to-emerald-600 rounded-3xl blur-lg opacity-25 group-hover:opacity-50 transition duration-500"></div>
                <div className="relative bg-gray-900/80 backdrop-blur-xl border border-gray-700/50 rounded-3xl p-8 h-full hover:border-green-500/50 transition-all duration-500">
                  <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-green-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    <MessageCircleIcon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">WhatsApp Nativo</h3>
                  <p className="text-gray-400 mb-6 leading-relaxed">
                    Integração completa com WhatsApp. Alertas formatados, imagens,
                    gráficos e até mesmo comandos interativos.
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-green-300">
                      <CheckIcon className="w-4 h-4" />
                      <span>Mensagens formatadas</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-green-300">
                      <CheckIcon className="w-4 h-4" />
                      <span>Lista de acompanhamento inclusa</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-green-300">
                      <CheckIcon className="w-4 h-4" />
                      <span>Resumos formatados</span>
                    </div>
                  </div>
                </div>
              </div> */}

              {/* TODO: Premium Features */}
              {/* 
              <div className="group relative" data-aos="fade-up" data-aos-delay="600">
                <div className="absolute -inset-1 bg-gradient-to-r from-yellow-600 to-amber-600 rounded-3xl blur-lg opacity-25 group-hover:opacity-50 transition duration-500"></div>
                <div className="relative bg-gray-900/80 backdrop-blur-xl border border-gray-700/50 rounded-3xl p-8 h-full hover:border-yellow-500/50 transition-all duration-500">
                  <div className="w-16 h-16 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    <CrownIcon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">Recursos Premium</h3>
                  <p className="text-gray-400 mb-6 leading-relaxed">
                    Acesso a dados exclusivos, análises aprofundadas e features
                    avançadas disponíveis apenas para assinantes do plano Investidor.
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-yellow-300">
                      <CheckIcon className="w-4 h-4" />
                      <span>Dados históricos completos</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-yellow-300">
                      <CheckIcon className="w-4 h-4" />
                      <span>Backtesting de estratégias</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-yellow-300">
                      <CheckIcon className="w-4 h-4" />
                      <span>Chat de IA</span>
                    </div>
                  </div>
                </div>
              </div> */}

            </div>
          </div>
        </section>

        {/* === Seção Como Funciona === */}

        <section id="como-funciona" className="py-16 sm:py-24 lg:py-32 px-4 sm:px-6 lg:px-8 relative bg-gradient-to-br from-gray-900 via-slate-900 to-gray-800">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12 sm:mb-16 lg:mb-20 animate-on-scroll">
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white mb-6 sm:mb-8">
                Como funciona o
                <span className="bg-gradient-to-r from-blue-400 to-cyan-500 bg-clip-text text-transparent block mt-1 sm:mt-2">
                  Lucas FII Alerts
                </span>
              </h2>
              <p className="text-base sm:text-lg lg:text-xl text-gray-400 max-w-3xl mx-auto px-2">
                Em poucos passos você estará recebendo alertas inteligentes sobre seus
                investimentos direto no WhatsApp.
              </p>
            </div>


            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 sm:gap-x-16 lg:gap-x-24 gap-y-20 sm:gap-y-24 max-w-5xl mx-auto">

              <div className="flex flex-col items-center text-center relative px-4 sm:px-0 animate-on-scroll scale delay-100">
                <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl sm:rounded-3xl flex items-center justify-center mb-4 sm:mb-6 shadow-2xl">
                  <span className="text-white font-bold text-lg sm:text-xl lg:text-2xl">1</span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4">Cadastre-se</h3>
                <p className="text-sm sm:text-base text-gray-400 leading-relaxed max-w-xs sm:max-w-sm">
                  Crie sua conta gratuita e ganhe 5 dias de teste completo de todos os recursos.
                </p>

                <div className="hidden lg:block absolute top-1/2 right-0 transform translate-x-12 -translate-y-1/2">
                  <div className="w-12 h-1 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full relative">
                    <div className="absolute -right-1 top-1/2 transform -translate-y-1/2 w-0 h-0 border-l-4 border-l-cyan-500 border-t-2 border-t-transparent border-b-2 border-b-transparent"></div>
                  </div>
                </div>

                <div className="md:hidden absolute -bottom-10 left-1/2 transform -translate-x-1/2">
                  <div className="w-1 h-10 sm:h-12 bg-gradient-to-b from-blue-500 to-cyan-500 rounded-full relative">
                    <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-0 h-0 border-t-4 border-t-cyan-500 border-l-2 border-l-transparent border-r-2 border-r-transparent"></div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-center text-center relative px-4 sm:px-0 animate-on-scroll scale delay-200">
                <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-2xl sm:rounded-3xl flex items-center justify-center mb-4 sm:mb-6 shadow-2xl">
                  <span className="text-white font-bold text-lg sm:text-xl lg:text-2xl">2</span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4">Configure seus ativos</h3>
                <p className="text-sm sm:text-base text-gray-400 leading-relaxed max-w-xs sm:max-w-sm">
                  Adicione os ativos que você quer acompanhar e configure seus alertas personalizados.
                </p>

                <div className="md:hidden absolute -bottom-10 left-1/2 transform -translate-x-1/2">
                  <div className="w-1 h-10 sm:h-12 bg-gradient-to-b from-cyan-500 to-blue-600 rounded-full relative">
                    <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-0 h-0 border-t-4 border-t-blue-600 border-l-2 border-l-transparent border-r-2 border-r-transparent"></div>
                  </div>
                </div>
              </div>


              <div className="flex flex-col items-center text-center relative px-4 sm:px-0 animate-on-scroll scale delay-300">
                <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl sm:rounded-3xl flex items-center justify-center mb-4 sm:mb-6 shadow-2xl">
                  <span className="text-white font-bold text-lg sm:text-xl lg:text-2xl">3</span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4">Conecte no WhatsApp</h3>
                <p className="text-sm sm:text-base text-gray-400 leading-relaxed max-w-xs sm:max-w-sm">
                  Vincule seu número do WhatsApp para receber todos os alertas automaticamente.
                </p>

                <div className="hidden lg:block absolute top-1/2 right-0 transform translate-x-12 -translate-y-1/2">
                  <div className="w-12 h-1 bg-gradient-to-r from-blue-600 to-blue-800 rounded-full relative">
                    <div className="absolute -right-1 top-1/2 transform -translate-y-1/2 w-0 h-0 border-l-4 border-l-blue-800 border-t-2 border-t-transparent border-b-2 border-b-transparent"></div>
                  </div>
                </div>

                <div className="md:hidden absolute -bottom-10 left-1/2 transform -translate-x-1/2">
                  <div className="w-1 h-10 sm:h-12 bg-gradient-to-b from-blue-600 to-blue-700 rounded-full relative">
                    <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-0 h-0 border-t-4 border-t-blue-700 border-l-2 border-l-transparent border-r-2 border-r-transparent"></div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-center text-center px-4 sm:px-0 animate-on-scroll scale delay-400">
                <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 bg-gradient-to-br from-blue-700 to-blue-800 rounded-2xl sm:rounded-3xl flex items-center justify-center mb-4 sm:mb-6 shadow-2xl">
                  <span className="text-white font-bold text-lg sm:text-xl lg:text-2xl">4</span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4">Receba alertas</h3>
                <p className="text-sm sm:text-base text-gray-400 leading-relaxed max-w-xs sm:max-w-sm">
                  Relaxe e receba todas as informações importantes direto no seu celular.
                </p>
              </div>
            </div>

            {/* Botão de CTA */}
            <div className="mt-12 sm:mt-16 lg:mt-20 text-center px-4">
              <Link href="/authentication">
                <Button
                  className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold py-3 sm:py-4 px-8 sm:px-12 rounded-xl text-base sm:text-lg shadow-xl transform hover:scale-105 transition-all duration-200 w-full sm:w-auto"
                  size="lg"
                >
                  Começar agora
                </Button>
              </Link>
              <div className="flex items-center justify-center gap-2 mt-3 sm:mt-4 text-yellow-400 text-xs sm:text-sm">
                <ZapIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="font-semibold">Configuração em menos de 3 minutos</span>
              </div>
            </div>
          </div>
        </section>


        {/* Seção de Planos e Preços */}
        <section className="py-32 px-4 sm:px-6 lg:px-8 relative" id="planos">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-20 animate-on-scroll">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-sm border border-blue-500/30 text-blue-300 px-6 py-3 rounded-full text-sm font-semibold mb-6">
                <DollarSignIcon className="w-4 h-4" />
                <span>PLANOS FLEXÍVEIS</span>
              </div>
              <h2 className="text-4xl md:text-6xl font-black text-white mb-8">
                Escolha o plano
                <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent block mt-2">
                  perfeito para você
                </span>
              </h2>
              <p className="text-xl text-gray-400 max-w-3xl mx-auto">
                Escolha o plano ideal para você e comece a receber alertas!
              </p>
            </div>

            {/* Toggle Mensal/Anual */}
            <div className="flex justify-center mb-12 animate-on-scroll delay-100">
              <div className="flex bg-gray-900/80 backdrop-blur-xl rounded-full p-2 border border-gray-700/50">
                <button
                  className={`px-8 py-3 rounded-full font-semibold transition-all ${planosTipo === 'mensal'
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                    : 'text-gray-400 hover:text-white'
                    }`}
                  onClick={() => setPlanosTipo('mensal')}
                >
                  Mensal
                </button>
                <button
                  className={`px-8 py-3 rounded-full font-semibold transition-all ${planosTipo === 'anual'
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                    : 'text-gray-400 hover:text-white'
                    }`}
                  onClick={() => setPlanosTipo('anual')}
                >
                  {/* Anual <span className="text-green-400 font-normal ml-1">2 meses grátis!</span> */}
                  Anual
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl mx-auto animate-on-scroll delay-200">
              {planosData[planosTipo].map((plano, index) => (
                <div
                  key={plano.id}
                  className={`relative group ${plano.isPopular ? 'transform scale-105' : ''}`}
                >
                  {plano.isPopular && (
                    <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 z-20">
                      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-full text-sm font-bold shadow-2xl">
                        MAIS POPULAR
                      </div>
                    </div>
                  )}

                  <div className={`absolute -inset-1 ${plano.isPopular
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 opacity-50 group-hover:opacity-75'
                    : 'bg-gradient-to-r from-blue-600 to-purple-600 opacity-20 group-hover:opacity-40'
                    } rounded-3xl blur-lg transition duration-500`}></div>

                  <div className={`relative ${plano.isPopular
                    ? 'bg-gradient-to-b from-blue-900/40 to-purple-900/40 backdrop-blur-xl border-2 border-blue-500/50'
                    : 'bg-gray-900/80 backdrop-blur-xl border border-gray-700/50'
                    } rounded-3xl p-8 h-full`}>
                    <div className="text-center mb-8">
                      <h3 className="text-2xl font-bold text-white mb-2">{plano.nome}</h3>
                      <div className="text-5xl font-black text-white mb-2">
                        {plano.preco.split(',')[0]}<span className="text-2xl">,{plano.preco.split(',')[1]}</span>
                      </div>
                      <div className={plano.isPopular ? "text-blue-200" : "text-gray-400"}>{plano.precoDetalhe}</div>
                    </div>

                    <ul className="space-y-4 mb-8">
                      {plano.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <CheckIcon className={`h-5 w-5 ${plano.isPopular ? 'text-blue-400' : 'text-blue-400'} mt-0.5 flex-shrink-0`} />
                          <span className={plano.isPopular ? "text-gray-200" : "text-gray-300"}>{feature}</span>
                        </li>
                      ))}
                      {plano.notIncluded.map((feature, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <XIcon className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-500 opacity-70">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <Link href="/authentication">
                      <Button
                        className={`w-full font-bold py-6 rounded-2xl text-lg transition-all duration-300 ${plano.isPopular
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-2xl transform hover:scale-105'
                          : 'border-2 border-blue-500/70 text-blue-400 hover:bg-gradient-to-r hover:from-blue-600 hover:to-cyan-600 hover:text-white hover:border-blue-400 hover:shadow-xl transform hover:scale-105 hover:shadow-blue-500/25'
                          }`}
                        variant={plano.isPopular ? 'default' : 'outline'}
                        size="lg"
                      >
                        Escolher Plano
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {/* Garantias */}
            <div className="text-center mt-16 animate-on-scroll delay-400">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
                <div className="flex items-center justify-center gap-3 text-gray-400">
                  <ShieldIcon className="h-6 w-6 text-green-400" />
                  <span>7 dias de garantia</span>
                </div>
                <div className="flex items-center justify-center gap-3 text-gray-400">
                  <CheckIcon className="h-6 w-6 text-blue-400" />
                  <span>Cancele a qualquer momento</span>
                </div>
                <div className="flex items-center justify-center gap-3 text-gray-400">
                  <Users2Icon className="h-6 w-6 text-purple-400" />
                  <span>Suporte</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* === Seção Call to Action Final === */}

        <section className="py-32 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
          <div className="max-w-6xl mx-auto text-center relative z-10">
            <div className="mb-12 animate-on-scroll">
              <h2 className="text-5xl md:text-7xl font-black text-white mb-8 leading-tight">
                Pronto para
                <span className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent block mt-2">
                  maximizar seus FIIs?
                </span>
              </h2>

              {/* <p className="text-2xl text-gray-300 mb-12 max-w-4xl mx-auto leading-relaxed">
                Junte-se a mais de 15.000 investidores que já transformaram
                seus resultados com alertas inteligentes do Lucas FII Alerts
              </p> */}

              <p className="text-2xl text-gray-300 mb-12 max-w-4xl mx-auto leading-relaxed">
                Seus resultados com alertas inteligentes do Lucas FII Alerts
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-8 justify-center items-center mb-16 animate-on-scroll delay-200">
              <Link href="/authentication">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-8 px-16 rounded-3xl text-xl shadow-2xl transform hover:scale-105 transition-all duration-300"
                >
                  <MessageCircleIcon className="mr-4 h-8 w-8" />
                  Começar Agora - 7 Dias de Garantia
                </Button>
              </Link>
            </div>

            {/* TODO:  <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center" data-aos="fade-up" data-aos-delay="400">
              <div className="space-y-2">
                <div className="text-4xl font-black text-white">15k+</div>
                <div className="text-gray-400">Investidores</div>
              </div>
              <div className="space-y-2">
                <div className="text-4xl font-black text-white">500+</div>
                <div className="text-gray-400">FIIs Suportados</div>
              </div>
              <div className="space-y-2">
                <div className="text-4xl font-black text-white">24/7</div>
                <div className="text-gray-400">Monitoramento</div>
              </div>
              <div className="space-y-2">
                <div className="text-4xl font-black text-white">99.9%</div>
                <div className="text-gray-400">Uptime</div>
              </div>
            </div> */}

            <div className="mt-16 flex items-center justify-center gap-8 text-white/60 text-sm" data-aos="fade-up" data-aos-delay="600">
              <div className="flex items-center gap-2">
                <CheckIcon className="h-4 w-4 text-green-400" />
                <span>Setup em 3 minutos</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckIcon className="h-4 w-4 text-green-400" />
                <span>Cancele quando quiser</span>
              </div>
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
};


export default Home;
