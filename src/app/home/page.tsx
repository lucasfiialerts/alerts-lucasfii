"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { HomeContent } from "@/app/home/components/home-content";
import { PageLayout } from "@/components/common/page-layout";
import { TestEnvironmentBanner } from "@/components/common/test-environment-banner";
import { authClient } from "@/lib/auth-client";

import { DashboardSkeleton } from "./components/dashboard-skeleton";

export default function HomePage() {
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/authentication");
    }
  }, [session, isPending, router]);

  const handleMenuItemClick = (itemId: string) => {
    if (itemId === "home") {
      // Já estamos na página home
      return;
    } else if (itemId === "my-follow") {
      router.push("/my-follow");
    } else if (itemId === "configuracao") {
      router.push("/configuration");
    } else if (itemId === "planos") {
      router.push("/planos");
    } else if (itemId === "como-funciona") {
      router.push("/step-by-step");
    } else {
      // Por enquanto outras opções ficam na home
      return;
    }
  };

  if (isPending) {
    return <DashboardSkeleton />;
  }

  if (!session) {
    return null;
  }

  return (
    <>
      <TestEnvironmentBanner />
      <PageLayout
        title="Home"
        activeMenuItem="home"
        session={{ 
          user: session?.user ? {
            name: session.user.name,
            email: session.user.email,
            image: session.user.image || undefined
          } : undefined
        }}
        onMenuItemClick={handleMenuItemClick}
      >
        <HomeContent session={{ 
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
