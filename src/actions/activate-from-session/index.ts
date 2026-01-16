"use server";

import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import Stripe from "stripe";

import { db } from "@/db";
import { userTable } from "@/db/schema";
import { auth } from "@/lib/auth";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-07-30.basil",
});

export const activateFromSession = async (sessionId: string) => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  try {
    // Buscar a sessão do Stripe
    const stripeSession = await stripe.checkout.sessions.retrieve(sessionId);
    
    console.log("Stripe session:", {
      id: stripeSession.id,
      mode: stripeSession.mode,
      subscription: stripeSession.subscription,
      metadata: stripeSession.metadata,
    });

    if (stripeSession.subscription) {
      const subscriptionId = typeof stripeSession.subscription === 'string' 
        ? stripeSession.subscription 
        : stripeSession.subscription.id;

      // Determinar o tipo de plano baseado no preço
      let planType: "basico" | "annualbasico" = "basico";
      
      if (stripeSession.metadata?.planType) {
        planType = stripeSession.metadata.planType as "basico" | "annualbasico";
      }

      // Calcular data de expiração
      const now = new Date();
      let expiresAt: Date;

      if (planType === "basico") {
        expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 dias
      } else {
        expiresAt = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000); // 365 dias
      }

      // Ativar no banco
      await db
        .update(userTable)
        .set({
          activePlan: planType,
          planExpiresAt: expiresAt,
          stripeSubscriptionId: subscriptionId,
          updatedAt: new Date(),
        })
        .where(eq(userTable.id, session.user.id));

      return {
        success: true,
        message: `Plano ${planType} ativado com sucesso!`,
        subscriptionId,
        planType,
        expiresAt: expiresAt.toISOString(),
      };
    } else {
      throw new Error("Sessão não possui assinatura");
    }
  } catch (error) {
    console.error("Erro ao ativar plano:", error);
    throw new Error("Erro ao processar ativação do plano");
  }
};
