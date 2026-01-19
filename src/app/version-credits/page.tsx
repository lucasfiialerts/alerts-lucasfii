"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ArrowLeft, Code, Rocket, Heart, Bell } from "lucide-react";

import { PageLayout } from "@/components/common/page-layout";
import { TestEnvironmentBanner } from "@/components/common/test-environment-banner";
import { authClient } from "@/lib/auth-client";

export default function VersionCreditsPage() {
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/authentication");
    }
  }, [session, isPending, router]);

  const handleMenuItemClick = (itemId: string) => {
    if (itemId === "home") {
      router.push("/home");
    } else if (itemId === "my-follow") {
      router.push("/my-follow");
    } else if (itemId === "configuracao") {
      router.push("/configuration");
    } else if (itemId === "planos") {
      router.push("/planos");
    } else if (itemId === "como-funciona") {
      router.push("/step-by-step");
    } else {
      router.push("/home");
    }
  };

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-slate-900 to-black">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <>
      <TestEnvironmentBanner />
      <PageLayout
        title="Versão e Créditos"
        activeMenuItem=""
        session={{
          user: session?.user ? {
            name: session.user.name,
            email: session.user.email,
            image: session.user.image || undefined
          } : undefined
        }}
        onMenuItemClick={handleMenuItemClick}
      >
        <div className="min-h-screen p-6 sm:p-8 lg:p-12">
          <div className="max-w-4xl mx-auto">
            {/* Botão Voltar */}
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Voltar</span>
            </button>

            {/* Card Principal */}
            <div className="bg-slate-900/70 backdrop-blur-xl border border-gray-700/50 rounded-2xl shadow-2xl p-8 sm:p-12">
              {/* Ícone e Título */}
              <div className="flex items-center justify-center mb-8">
                <div className="relative">
                  <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full"></div>
                  {/* <Rocket className="w-20 h-20 text-blue-400 relative" /> */}
                  <Bell className="w-20 h-20 text-blue-400 relative" />
                </div>
              </div>

              <h1 className="text-4xl sm:text-5xl font-bold text-center mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
                Lucas FII Alerts
              </h1>

              {/* Versão */}
              <div className="flex items-center justify-center gap-3 mb-12">
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-full px-6 py-2">
                  <p className="text-blue-400 font-mono text-lg font-semibold">
                    v1.0.0-beta
                  </p>
                </div>
              </div>

              {/* Separador */}
              <div className="border-t border-gray-700/50 my-8"></div>

              {/* Créditos */}
              <div className="space-y-6">
                <div className="flex items-center justify-center gap-2 text-gray-400">
                  <Code className="w-5 h-5" />
                  <span className="text-lg">Desenvolvido</span>

                  <span className="text-lg">por</span>
                </div>

                <div className="text-center">
                  <a
                    href="https://www.devrocha.com.br"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400 hover:from-blue-300 hover:to-cyan-300 transition-all duration-300"
                  >
                    DevRocha
                  </a>
                  {/* <p className="text-gray-500 mt-2">
                    Soluções em Desenvolvimento de Software
                  </p> */}
                </div>
              </div>

              {/* Informações Adicionais */}
              <div className="mt-12 pt-8 border-t border-gray-700/50">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
                  {/* <div>
                    <p className="text-gray-500 text-sm mb-1">Fase</p>
                    <p className="text-white font-semibold">Beta Testing</p>
                  </div> */}
                  <div>
                    <p className="text-gray-500 text-sm mb-1">Lançamento</p>
                    <p className="text-white font-semibold">Sem Data</p>
                  </div>
                  {/* <div>
                    <p className="text-gray-500 text-sm mb-1">Tecnologia</p>
                    <p className="text-white font-semibold">Next.js 14</p>
                  </div> */}
                </div>
              </div>
            </div>

            {/* Nota de Rodapé */}
            <div className="mt-8 text-center text-gray-500 text-sm">
              <p>© 2026 Lucas FII Alerts. Todos os direitos reservados.</p>
            </div>
          </div>
        </div>
      </PageLayout>
    </>
  );
}
