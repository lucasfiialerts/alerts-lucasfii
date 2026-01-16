"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import IndicesChart from "./indices-chart";
import BitcoinChart from "./bitcoin-chart";
import { BitcoinAlertCard } from "./bitcoin-alert-card";
import { useWhatsAppStatus } from "@/hooks/use-whatsapp-status";
import { useBitcoinAlerts } from "@/hooks/use-bitcoin-alerts";
import { getDashboardStats, type DashboardStats } from "@/actions/get-dashboard-stats";
import { LoadingSpinner } from "@/components/common/loading-spinner";


interface Session {
  user?: {
    name?: string;
    email?: string;
    image?: string;
  };
}

interface HomeContentProps {
  session: Session;
}

export function HomeContent({ session }: HomeContentProps) {
  const { isConnected: isWhatsAppConnected, isLoading } = useWhatsAppStatus();
  const { currentAlert, isMonitoring, startMonitoring, stopMonitoring, dismissAlert } = useBitcoinAlerts();
  const router = useRouter();
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  // Carregar dados do dashboard
  useEffect(() => {
    const loadDashboardStats = async () => {
      setIsLoadingStats(true);
      try {
        const stats = await getDashboardStats();
        setDashboardStats(stats);
      } catch (error) {
        console.error("Erro ao carregar estatísticas:", error);
      } finally {
        setIsLoadingStats(false);
      }
    };

    loadDashboardStats();
  }, []);

  // DESATIVADO: Monitoramento Bitcoin automático no frontend
  // O monitoramento agora é feito apenas via cron job
  useEffect(() => {
    console.log('⚠️ Monitoramento Bitcoin no frontend desativado');
    console.log('💡 Alertas são enviados apenas via cron job oficial');
    
    // Não inicia mais o monitoramento automático
    // if (!isMonitoring) {
    //   console.log('🚀 Iniciando monitoramento Bitcoin...');
    //   startMonitoring();
    // }

    // Cleanup quando o componente for desmontado
    return () => {
      console.log('🛑 Parando monitoramento Bitcoin...');
      stopMonitoring();
    };
  }, []); // Array vazio para executar apenas uma vez

  const handleAdicionarAtivo = () => {
    router.push("/my-follow");
  };

  const handleConfigurarAlertas = () => {
    router.push("/configuration");
  };

  const handleVerRelatorios = () => {
    router.push("/my-follow");
  };

  if (isLoadingStats) {
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
        {/* Welcome Section */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl">Home</h1>

          <br />

          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-2 break-words">
            Olá,{' '}
            <span className="block sm:inline">
              {session?.user?.name || 'Usuário'}!
            </span>
          </h2>

          {/* <p className="text-sm sm:text-base md:text-lg text-gray-400">
            Acompanhe seus ativos e configurações aqui.
          </p> */}
        </div>

        {/* === Cards de Aviso === */}


        {/* === Card de Alerta do Bitcoin === */}

        <div className="space-y-4">
          
          {/* TEMPORARIAMENTE DESATIVADO: Bitcoin Alert Card */}
          {/* currentAlert && (
            <BitcoinAlertCard
              alert={currentAlert}
              onDismiss={dismissAlert}
            />
          ) */}

          {/* --- Card de aviso de manutenção --- */}

          {/* <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <div className="w-6 h-6 bg-black-500 rounded-sm flex items-center justify-center">
                  <span className="text-white text-sm font-bold">❗️</span>
                </div>
              </div>
              <div className="flex-1">
                <p className="text-red-200 text-sm">
                  Aviso de<span className="font-semibold text-red-300 bg-red-900/30 px-2 py-1 rounded">Manutenção </span> programada no sistema no dia 25/12 das 02:00 às 04:00. Durante esse período, alguns serviços podem ficar indisponíveis. Agradecemos sua compreensão.
                </p>
              </div>
            </div>
          </div> */}


          {/* --- Card de Atenção sobre Planos --- */}

          {/* <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <div className="w-6 h-6 bg-orange-500 rounded-sm flex items-center justify-center">
                  <span className="text-white text-sm font-bold">⚠</span>
                </div>
              </div>
              <div className="flex-1">
                <p className="text-orange-200 text-sm">
                  <span className="font-semibold">Atenção:</span> Estamos lançando nossos planos, <span className="font-semibold text-orange-300">para continuar recebendo os alertas</span>, basta escolher o que faz mais sentido pra você.{" "}
                  <button 
                    onClick={() => router.push("/planos")}
                    className="text-orange-300 underline hover:text-orange-200 transition-colors"
                  >
                    Clique para ver planos
                  </button>
                </p>
              </div>
            </div>
          </div> */}

          {/* --- Card sobre Comando WhatsApp --- */}

          {/* <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <div className="w-6 h-6 bg-green-500 rounded-sm flex items-center justify-center">
                  <span className="text-white text-sm font-bold">💡</span>
                </div>
              </div>
              <div className="flex-1">
                <p className="text-green-200 text-sm">
                  Envie o comando <span className="font-semibold text-green-300 bg-green-900/30 px-2 py-1 rounded">Atualização</span> no WhatsApp e receba sua lista de acompanhamento com preços atualizados a qualquer momento
                </p>
              </div>
            </div>
          </div> */}
        </div>

        {/* TODO: === Market Indices Section === */}

        {/* <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">📈 Índices do Mercado</h3>
          <IndicesChart />
        </div> */}

        {/* Quick Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
          <Card className="bg-slate-900/70 backdrop-blur-xl border-slate-600/30 shadow-2xl hover:bg-slate-900/80 transition-all duration-300 hover:border-blue-500/40">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 sm:p-5">
              <CardTitle className="text-sm sm:text-base font-semibold text-gray-300 tracking-wide">
                Total de Ativos
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-5 pt-0">
              {isLoadingStats ? (
                <div className="h-8 w-12 bg-gray-700 animate-pulse rounded"></div>
              ) : (
                <>
                  <div className="text-2xl sm:text-3xl font-bold text-white mb-1">{dashboardStats?.trackedAssets || 0}</div>
                  <p className="text-sm text-gray-400 font-medium">
                    {dashboardStats?.trackedAssets === 0 ? "Nenhum ativo" : "Ativos seguidos"}
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="bg-slate-900/70 backdrop-blur-xl border-slate-600/30 shadow-2xl hover:bg-slate-900/80 transition-all duration-300 hover:border-blue-500/40">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 sm:p-5">
              <CardTitle className="text-sm sm:text-base font-semibold text-gray-300 tracking-wide">
                Alertas
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-5 pt-0">
              {isLoadingStats ? (
                <div className="h-8 w-12 bg-gray-700 animate-pulse rounded"></div>
              ) : (
                <>
                  <div className="text-2xl sm:text-3xl font-bold text-white mb-1">{dashboardStats?.alertsToday || 0}</div>
                  <p className="text-sm text-gray-400 font-medium">
                    {dashboardStats?.alertsToday === 0 ? "Configure" : "Total"}
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="bg-slate-900/70 backdrop-blur-xl border-slate-600/30 shadow-2xl hover:bg-slate-900/80 transition-all duration-300 hover:border-blue-500/40">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 sm:p-5">
              <CardTitle className="text-sm sm:text-base font-semibold text-gray-300 tracking-wide">
                Seu Plano Atual
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-5 pt-0">
              {isLoadingStats ? (
                <div className="h-8 w-16 bg-gray-700 animate-pulse rounded"></div>
              ) : (
                <>
                  <div className={`text-lg sm:text-xl font-bold mb-1 ${(dashboardStats?.currentPlan && dashboardStats?.currentPlan !== "Você não tem um plano")
                    ? "text-green-400"
                    : "text-orange-400"
                    }`}>
                    {dashboardStats?.currentPlan || "Você não tem um plano"}
                  </div>
                  <p className="text-sm text-gray-400 font-medium">
                    {(dashboardStats?.currentPlan && dashboardStats?.currentPlan !== "Você não tem um plano")
                      ? "Ativo"
                      : "Inativo"
                    }
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="bg-slate-900/70 backdrop-blur-xl border-slate-600/30 shadow-2xl hover:bg-slate-900/80 transition-all duration-300 hover:border-blue-500/40">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 sm:p-5">
              <CardTitle className="text-sm sm:text-base font-semibold text-gray-300 tracking-wide">
                Status WhatsApp
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-5 pt-0">
              {isLoading ? (
                <div className="text-base text-yellow-400 font-medium">Verificando...</div>
              ) : (
                <div className={`flex items-center gap-3 ${isWhatsAppConnected ? 'text-green-400' : 'text-red-400'}`}>
                  <div className={`w-3 h-3 rounded-full ${isWhatsAppConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'} shadow-lg`}></div>
                  <span className="text-lg sm:text-xl font-bold">
                    {isWhatsAppConnected ? 'Conectado' : 'Desconectado'}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* TODO: Implementar dados! === Índices de Mercado === */}

        {/* <Card className="bg-[#1a1a35] border-gray-700/50 shadow-xl">
          <CardHeader className="flex items-center justify-between">
            <CardTitle className="text-white">Índices de Mercado</CardTitle>
            <div className="text-sm text-gray-400">Últimos 7 dias</div>
          </CardHeader>
          <CardContent>
            <IndicesChart />
          </CardContent>
        </Card> */}


        {/* === Bitcoin Price Section === */}

        {/* <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">💰 Preço do Bitcoin</h3>
          <BitcoinChart />
        </div> */}

        {/* TODO: Temporarily hidden === Quick Actions === */}

        {/* <div className="mt-6 sm:mt-8">
          <h3 className="text-lg sm:text-xl font-semibold text-white mb-4 sm:mb-6">Ações Rápidas</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
            <Button
              onClick={handleAdicionarAtivo}
              variant="outline"
              className="group h-auto p-5 sm:p-7 bg-slate-900/70 backdrop-blur-xl border-slate-600/30 text-white hover:bg-blue-600/20 hover:border-blue-500/60 shadow-2xl transition-all duration-300 text-left cursor-pointer transform hover:scale-[1.03] hover:shadow-blue-500/20"
            >
              <div className="w-full">
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center group-hover:bg-blue-500/40 transition-colors duration-300 shadow-lg">
                    <span className="text-blue-400 text-xl">📈</span>
                  </div>
                  <div className="font-bold text-base sm:text-lg md:text-xl group-hover:text-blue-300 transition-colors duration-300">
                    Adicionar Ativo
                  </div>
                </div>
                <div className="text-sm sm:text-base text-gray-400 group-hover:text-gray-300 leading-relaxed transition-colors duration-300 font-medium">
                  Comece adicionando seus primeiros ativos
                </div>
              </div>
            </Button>

            <Button
              onClick={handleConfigurarAlertas}
              variant="outline"
              className="group h-auto p-5 sm:p-7 bg-slate-900/70 backdrop-blur-xl border-slate-600/30 text-white hover:bg-blue-600/20 hover:border-blue-500/60 shadow-2xl transition-all duration-300 text-left cursor-pointer transform hover:scale-[1.03] hover:shadow-blue-500/20"
            >
              <div className="w-full">
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center group-hover:bg-yellow-500/40 transition-colors duration-300 shadow-lg">
                    <span className="text-yellow-400 text-xl">🔔</span>
                  </div>
                  <div className="font-bold text-base sm:text-lg md:text-xl group-hover:text-yellow-300 transition-colors duration-300">
                    Configurar Alertas
                  </div>
                </div>
                <div className="text-sm sm:text-base text-gray-400 group-hover:text-gray-300 leading-relaxed transition-colors duration-300 font-medium">
                  Defina que notificações deseja receber
                </div>
              </div>
            </Button>

            <Button
              onClick={handleVerRelatorios}
              variant="outline"
              className="group h-auto p-5 sm:p-7 bg-slate-900/70 backdrop-blur-xl border-slate-600/30 text-white hover:bg-blue-600/20 hover:border-blue-500/60 shadow-2xl transition-all duration-300 text-left cursor-pointer transform hover:scale-[1.03] hover:shadow-blue-500/20 sm:col-span-2 xl:col-span-1"
            >
              <div className="w-full">
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center group-hover:bg-green-500/40 transition-colors duration-300 shadow-lg">
                    <span className="text-green-400 text-xl">📊</span>
                  </div>
                  <div className="font-bold text-base sm:text-lg md:text-xl group-hover:text-green-300 transition-colors duration-300">
                    Ver Relatórios
                  </div>
                </div>
                <div className="text-sm sm:text-base text-gray-400 group-hover:text-gray-300 leading-relaxed transition-colors duration-300 font-medium">
                  Acesse relatórios detalhados
                </div>
              </div>
            </Button>
          </div>
        </div> */}

        {/* Getting Started */}
        <Card className="bg-slate-900/70 backdrop-blur-xl border-slate-600/30 shadow-2xl hover:bg-slate-900/80 transition-all duration-300">
          <CardHeader className="p-5 sm:p-7">
            <CardTitle className="text-white text-lg sm:text-xl font-bold">Primeiros Passos</CardTitle>
          </CardHeader>
          <CardContent className="text-gray-300 p-5 sm:p-7 pt-0">
            <ol className="list-decimal list-inside space-y-3 sm:space-y-4 text-base sm:text-lg leading-relaxed font-medium">
              <li className="break-words hover:text-white transition-colors">Adquira um dos planos</li>
              <li className="break-words hover:text-white transition-colors">Adicione seus primeiros ativos para acompanhar</li>
              <li className="break-words hover:text-white transition-colors">Conecte o WhatsApp para receber notificações</li>
              <li className="break-words hover:text-white transition-colors">Configure os tipos de alertas que deseja receber</li>
              {/* <li className="break-words hover:text-white transition-colors">Explore os relatórios e dados em tempo real</li> */}
            </ol>
          </CardContent>
        </Card>

        <br />
        <br />
        <br />

      </div>
    </main>
  );
}
