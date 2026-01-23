"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { checkActivePlan } from "@/actions/check-active-plan";
import { PageLayout } from "@/components/common/page-layout";
import { TestEnvironmentBanner } from "@/components/common/test-environment-banner";
import { PlanRequired } from "@/components/plan-required";
import { authClient } from "@/lib/auth-client";

import { MyFollowContent } from "./components/my-follow-content";
import { MyFollowSkeleton } from "./components/my-follow-skeleton";

export default function MyFollowPage() {
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();
  const [planCheck, setPlanCheck] = useState<{ hasActivePlan: boolean } | null>(null);
  const [isCheckingPlan, setIsCheckingPlan] = useState(true);

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/authentication");
    }
  }, [session, isPending, router]);

  useEffect(() => {
    const checkPlan = async () => {
      if (session?.user) {
        try {
          const result = await checkActivePlan();
          setPlanCheck(result);
        } catch (error) {
          console.error("Erro ao verificar plano:", error);
          setPlanCheck({ hasActivePlan: false });
        }
        setIsCheckingPlan(false);
      }
    };

    if (session?.user && !isPending) {
      checkPlan();
    }
  }, [session, isPending]);

  const handleMenuItemClick = (itemId: string) => {
    if (itemId === "my-follow") {
      // Já estamos na página de acompanhamento
      return;
    } else if (itemId === "home") {
      router.push("/home");
    } else if (itemId === "configuracao") {
      router.push("/configuration");
    } else if (itemId === "planos") {
      router.push("/planos");
    } else if (itemId === "como-funciona") {
      router.push("/step-by-step");
    } else if (itemId === "chat-ia") {
      router.push("/chat-ia");
    } else {
      router.push("/home");
    }
  };

  if (isPending || isCheckingPlan) {
    return <MyFollowSkeleton />;
  }

  if (!session) {
    return null;
  }

  // Verificar se o usuário tem plano ativo
  if (planCheck && !planCheck.hasActivePlan) {
    return (
      <PlanRequired
        message="Plano Necessário"
        description="Para acompanhar e configurar alertas de FIIs, você precisa de um plano ativo. Escolha um plano que melhor se adequa às suas necessidades."
      />
    );
  }

  return (
    <>
      <TestEnvironmentBanner />
      <PageLayout
        title="Acompanhamento"
        activeMenuItem="my-follow"
        session={{
          user: session?.user ? {
            name: session.user.name,
            email: session.user.email,
            image: session.user.image || undefined
          } : undefined
        }}
        onMenuItemClick={handleMenuItemClick}
      >
        <MyFollowContent session={{
          user: session?.user ? {
            name: session.user.name,
            email: session.user.email,
            image: session.user.image || undefined
          } : undefined
        }} />
      </PageLayout>
    </>
  );
}
