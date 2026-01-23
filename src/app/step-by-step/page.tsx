"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { PageLayout } from "@/components/common/page-layout";
import { TestEnvironmentBanner } from "@/components/common/test-environment-banner";
import { authClient } from "@/lib/auth-client";

import { StepByStepPage } from "./components/step-by-step-page";
import { StepByStepSkeleton } from "./components/step-by-step-skeleton";

export default function StepByStepPageRoute() {
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/authentication");
    }
  }, [session, isPending, router]);

  const handleMenuItemClick = (itemId: string) => {
    if (itemId === "como-funciona") {
      // Já estamos na página como funciona
      return;
    } else if (itemId === "home") {
      router.push("/home");
    } else if (itemId === "my-follow") {
      router.push("/my-follow");
    } else if (itemId === "configuracao") {
      router.push("/configuration");
    } else if (itemId === "planos") {
      router.push("/planos");
    } else if (itemId === "chat-ia") {
      router.push("/chat-ia");
    } else {
      router.push("/home");
    }
  };

  if (isPending) {
    return <StepByStepSkeleton />;
  }

  if (!session) {
    return null;
  }

  return (
    <>
      <TestEnvironmentBanner />
      <PageLayout
        title="Como funciona"
        activeMenuItem="como-funciona"
        session={{
          user: session?.user ? {
            name: session.user.name,
            email: session.user.email,
            image: session.user.image || undefined
          } : undefined
        }}
        onMenuItemClick={handleMenuItemClick}
      >
        <StepByStepPage session={{
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
