"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ArrowLeftIcon, CheckCircleIcon, TrendingUpIcon, BellIcon, CalendarIcon, DollarSignIcon, ListCheckIcon } from "lucide-react";
import Link from "next/link";

import { Header } from "@/components/common/header";
// Tabs removidas temporariamente
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

// Components comentados temporariamente
// import SignInForm from "./components/sign-in-form";
// import SignUpForm from "./components/sign-up-form";

const Authentication = () => {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  // Redirect para home se já estiver logado
  useEffect(() => {
    if (!isPending && session) {
      router.push("/home");
    }
  }, [session, isPending, router]);

  const handleSignInWithGoogle = async () => {
    try {
      await authClient.signIn.social({
        provider: "google",
        callbackURL: "/home", // Redirect direto para home após login
      });
    } catch (error) {
      console.error("Erro no login:", error);
    }
  };

  const handleSignInWithMicrosoft = async () => {
    try {
      await authClient.signIn.social({
        provider: "microsoft",
        callbackURL: "/home", // Redirect direto para home após login
      });
    } catch (error) {
      console.error("Erro no login:", error);
    }
  };

  // Se já estiver logado, não mostrar a tela de login
  if (session) {
    return null;
  }

  // Loading state enquanto verifica a sessão
  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative">
        {/* Background Image */}
        <div className="fixed inset-0 z-0">
          <Image
            src="/fundogra.png"
            alt="Background"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/80"></div>
        </div>

        <div className="max-w-md w-full relative z-10">
          <div className="bg-slate-900/90 backdrop-blur-xl rounded-3xl border border-slate-700/50 p-8 shadow-2xl">
            <div className="text-center mb-8">
              <div className="w-48 h-8 bg-gray-700 rounded animate-pulse mx-auto mb-2"></div>
              <div className="w-64 h-4 bg-gray-700 rounded animate-pulse mx-auto"></div>
            </div>

            <div className="w-full h-12 bg-gray-700 rounded animate-pulse mb-6"></div>

            <div className="space-y-3 mb-8">
              {[1, 2, 3, 4, 5].map((item) => (
                <div key={item} className="flex items-center">
                  <div className="w-4 h-4 bg-gray-700 rounded animate-pulse mr-3"></div>
                  <div className="w-48 h-4 bg-gray-700 rounded animate-pulse"></div>
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
      <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative">
        {/* Background Image */}
        <div className="fixed inset-0 z-0">
          <Image
            src="/fundogra.png"
            alt="Background"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/80"></div>
        </div>

        {/* Botão voltar */}
        {/* <Link href="/" className="fixed top-8 left-8 z-20">
          <Button
            variant="ghost"
            className="text-white hover:bg-white/10 backdrop-blur-sm border border-white/20"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </Link> */}

        {/* Container principal */}
        <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
          {/* Coluna esquerda - Informações */}
          <div className="hidden lg:block space-y-8">
            <div>
              <h1 className="text-5xl md:text-6xl font-black text-white leading-tight mb-4">
                Bem-vindo ao
                <span className="bg-gradient-to-r from-blue-400 via-cyan-500 to-blue-600 bg-clip-text text-transparent block mt-2">
                  Lucas FII Alerts
                </span>
              </h1>
              <p className="text-xl text-gray-300 leading-relaxed">
                Monitore seus investimentos em tempo real e receba alertas inteligentes direto no WhatsApp.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-4 bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <BellIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg mb-1">Alertas Personalizados</h3>
                  <p className="text-gray-400 text-sm">Receba notificações sobre seus ativos favoritos em tempo real.</p>
                </div>
              </div>

              <div className="flex items-start gap-4 bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <ListCheckIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg mb-1">Alerta de acompanhamento lista de ativos</h3>
                  <p className="text-gray-400 text-sm">Nunca perca uma data de pagamento de dividendos.</p>
                </div>
              </div>

               <div className="flex items-start gap-4 bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
                <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <TrendingUpIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg mb-1">Análise Completa</h3>
                  <p className="text-gray-400 text-sm">Visualize o desempenho completo do seu portfólio.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Coluna direita - Card de login */}
          <div className="w-full">
            {/* Card principal */}
            <div className="bg-slate-900/90 backdrop-blur-xl rounded-3xl border border-slate-700/50 p-8 shadow-2xl">
              {/* Header do card */}
              <div className="text-center mb-8">
                <div className="mx-auto w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                  <h1 className="text-white text-2xl font-bold font-boogaloo tracking-wide"><span className="font-space-grotesk text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400 font-bold tracking-wider">🚀</span></h1>
                </div>

                <h2 className="text-white text-3xl font-black mb-2">
                  Entre na sua conta
                </h2>

                {/* <h2 className="text-white text-3xl font-black mb-2">
                 Crie sua conta gratuita
                </h2> */}

                <p className="text-slate-400 text-base">
                  Comece a monitorar seus investimentos agora mesmo
                </p>
              </div>

              {/* Divisor */}
              <div className="relative mb-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-600"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-slate-900 text-slate-400 font-medium">Fazer login com</span>
                </div>
              </div>

              {/* Botões de login */}
              <div className="space-y-4 mb-8">
                {/* Botão Google */}
                <Button
                  variant="outline"
                  className="w-full h-14 border-2 border-slate-600 bg-white hover:bg-gray-50 text-slate-900 font-semibold transition-all duration-200 cursor-pointer text-base rounded-xl hover:scale-[1.02] hover:shadow-lg"
                  onClick={handleSignInWithGoogle}
                  type="button"
                >
                  <svg viewBox="0 0 24 24" className="h-6 w-6 mr-3">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  Continuar com Google
                </Button>

                {/* Botão Microsoft comentado temporariamente */}
                {/* 
              <Button
                variant="outline"
                className="w-full h-12 border-slate-600 bg-white hover:bg-gray-50 text-slate-900 font-medium"
                onClick={handleSignInWithMicrosoft}
                type="button"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5 mr-3">
                  <path fill="#f25022" d="M1 1h10v10H1z"/>
                  <path fill="#00a4ef" d="M13 1h10v10H13z"/>
                  <path fill="#7fba00" d="M1 13h10v10H1z"/>
                  <path fill="#ffb900" d="M13 13h10v10H13z"/>
                </svg>
                Fazer Login com Microsoft
              </Button>
              */}
              </div>

              {/* Features list */}
              <div className="space-y-3 pt-6 border-t border-slate-700">
                <p className="text-slate-400 text-sm font-semibold mb-4">O que você terá acesso:</p>
                <div className="flex items-center text-sm text-slate-300">
                  <CheckCircleIcon className="w-5 h-5 text-green-400 mr-3 flex-shrink-0" />
                  Notificações instantâneas no WhatsApp
                </div>
                <div className="flex items-center text-sm text-slate-300">
                  <CheckCircleIcon className="w-5 h-5 text-green-400 mr-3 flex-shrink-0" />
                  Análise completa do seu portfólio
                </div>
                <div className="flex items-center text-sm text-slate-300">
                  <CheckCircleIcon className="w-5 h-5 text-green-400 mr-3 flex-shrink-0" />
                  Monitoramento 24/7 de FIIs e ações
                </div>
                <div className="flex items-center text-sm text-slate-300">
                  <CheckCircleIcon className="w-5 h-5 text-green-400 mr-3 flex-shrink-0" />
                  Acompanhe até 45 ativos
                </div>
                <div className="flex items-center text-sm text-slate-300">
                  <CheckCircleIcon className="w-5 h-5 text-green-400 mr-3 flex-shrink-0" />
                  Alerta de acompanhamento lista de ativos
                </div>
              </div>

              {/* Footer */}
              <div className="text-center mt-8 pt-6 border-t border-slate-700">
                <p className="text-xs text-slate-500">
                  🔒 Seus dados estão seguros e protegidos
                </p>
              </div>
            </div>

            {/* Badge extra */}
            <div className="mt-6 text-center">
              <p className="text-slate-400 text-sm">
                ✨ <span className="font-semibold text-white">Reembolso Garantido</span> até 7 dias!
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Authentication;
