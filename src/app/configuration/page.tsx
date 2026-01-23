"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { PageLayout } from "@/components/common/page-layout";
import { TestEnvironmentBanner } from "@/components/common/test-environment-banner";
import { authClient } from "@/lib/auth-client";

import { ConfigurationPage } from "./components/configuration-page";
import { ConfigurationSkeleton } from "./components/configuration-skeleton";

export default function ConfigurationPageRoute() {
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/authentication");
    }
  }, [session, isPending, router]);

  const handleMenuItemClick = (itemId: string) => {
    if (itemId === "configuracao") {
      // Já estamos na página de configuração
      return;
    } else if (itemId === "home") {
      router.push("/home");
    } else if (itemId === "my-follow") {
      router.push("/my-follow");
    } else if (itemId === "planos") {
      router.push("/planos");
    } else if (itemId === "chat-ia") {
      router.push("/chat-ia");
    } else if (itemId === "como-funciona") {
      router.push("/step-by-step");
    }
  };

  if (isPending) {
    return <ConfigurationSkeleton />;
  }

  if (!session) {
    return null;
  }

  return (
    <>
      <TestEnvironmentBanner />
      <PageLayout
        title="Configuração"
        activeMenuItem="configuracao"
        session={{
          user: session?.user ? {
            name: session.user.name,
            email: session.user.email,
            image: session.user.image || undefined
          } : undefined
        }}
        onMenuItemClick={handleMenuItemClick}
      >
        <ConfigurationPage session={{
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
