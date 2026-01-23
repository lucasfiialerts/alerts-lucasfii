"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { PageLayout } from "@/components/common/page-layout";
import { TestEnvironmentBanner } from "@/components/common/test-environment-banner";
import { LoadingSpinner } from "@/components/common/loading-spinner";
import { authClient } from "@/lib/auth-client";

import { ChatIaPage } from "./components/chat-ia-page";

export default function ChatIaRoute() {
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/authentication");
    }
  }, [session, isPending, router]);

  const handleMenuItemClick = (itemId: string) => {
    if (itemId === "chat-ia") {
      return;
    }

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
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black">
        <LoadingSpinner />
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
        title="Chat IA"
        activeMenuItem="chat-ia"
        session={{
          user: session?.user
            ? {
                name: session.user.name,
                email: session.user.email,
                image: session.user.image || undefined,
              }
            : undefined,
        }}
        onMenuItemClick={handleMenuItemClick}
      >
        <ChatIaPage />
      </PageLayout>
    </>
  );
}
