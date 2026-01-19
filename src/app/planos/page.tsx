"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { PageLayout } from "@/components/common/page-layout";
import { TestEnvironmentBanner } from "@/components/common/test-environment-banner";
import { authClient } from "@/lib/auth-client";

import { PlanosContent } from "./components/planos-page";
import { PlanosSkeleton } from "./components/planos-skeleton";

export default function PlanosPage() {
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
    } else if (itemId === "como-funciona") {
      router.push("/step-by-step");
    } else if (itemId === "planos") {
      // Já estamos na página de planos
      return;
    }
  };

  if (isPending) {
    return <PlanosSkeleton />;
  }

  if (!session) {
    return null;
  }

  return (
    <>
      <TestEnvironmentBanner />
      <PageLayout
        title="Planos"
        activeMenuItem="planos"
        session={{
          user: {
            name: session.user.name,
            email: session.user.email,
            image: session.user.image || undefined
          }
        }}
        onMenuItemClick={handleMenuItemClick}
      >
        <PlanosContent session={{ 
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
