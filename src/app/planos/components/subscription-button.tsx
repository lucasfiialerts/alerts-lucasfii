"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { createSubscription } from "@/actions/create-subscription";
import { authClient } from "@/lib/auth-client";

interface SubscriptionButtonProps {
  planType: "basico" | "annualbasico";
  isActive?: boolean;
  isDisabled?: boolean;
  children: React.ReactNode;
}

export const SubscriptionButton = ({ planType, isActive, isDisabled, children }: SubscriptionButtonProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { data: session } = authClient.useSession();
  const router = useRouter();

  const handleSubscribe = async () => {
    if (isActive || isDisabled) return;
    
    // Verificar se o usuário está logado
    if (!session?.user) {
      toast.error("Faça o login ou cadastre-se para adquirir o plano!", {
        description: (
          <span style={{ color: "#4b5563" }}>
            Clique no botão para ir para a página de login
          </span>
        ),
        action: {
          label: "Fazer Login",
          onClick: () => router.push("/authentication")
        },
        duration: 6000,
        style: {
          backgroundColor: "#fef2f2",
          border: "1px solid #fecaca",
          color: "#991b1b",
        },
      });
      return;
    }
    
    setIsLoading(true);
    try {
      await createSubscription(planType);
      toast.success("Redirecionando para o pagamento...", {
        description: (
          <span style={{ color: "#365314" }}>
            Aguarde enquanto preparamos seu checkout
          </span>
        ),
        duration: 3000,
        style: {
          backgroundColor: "#f0fdf4",
          border: "1px solid #bbf7d0",
          color: "#166534",
        },
      });
    } catch (error) {
      console.error("Erro ao criar assinatura:", error);
      toast.error("Erro ao criar assinatura", {
        description: (
          <span style={{ color: "#7f1d1d" }}>
            Tente novamente em alguns instantes
          </span>
        ),
        duration: 4000,
        style: {
          backgroundColor: "#fef2f2",
          border: "1px solidrgb(251, 251, 251)",
          color: "#991b1b",
        },
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isActive) {
    return (
      <div className="inline-flex items-center justify-center w-full bg-green-600 text-white font-bold py-3 px-6 rounded-lg">
        <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        Assinatura Ativa
      </div>
    );
  }

  if (isDisabled) {
    return (
      <div className="inline-flex items-center justify-center w-full bg-gray-400 text-white font-bold py-3 px-6 rounded-lg cursor-not-allowed">
        <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
        </svg>
        Plano Indisponível
      </div>
    );
  }

  return (
    <button
      onClick={handleSubscribe}
      disabled={isLoading}
      className="inline-flex items-center justify-center w-full bg-green-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
    >
      {isLoading ? (
        <>
          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Processando...
        </>
      ) : (
        <>
          {children}
          <div className="ml-2 w-6 h-6 bg-green-700 rounded flex items-center justify-center">
            <span className="text-white text-sm font-bold">$</span>
          </div>
        </>
      )}
    </button>
  );
};
