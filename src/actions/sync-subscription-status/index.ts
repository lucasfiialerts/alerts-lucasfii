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

export const syncSubscriptionStatus = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  // Buscar usuário com assinatura ativa
  const user = await db.query.userTable.findFirst({
    where: eq(userTable.id, session.user.id),
    columns: {
      id: true,
      email: true,
      activePlan: true,
      stripeSubscriptionId: true,
      planExpiresAt: true,
    },
  });

  if (!user?.stripeSubscriptionId) {
    return {
      success: true,
      message: "Usuário não possui assinatura ativa",
      hasActiveSubscription: false,
    };
  }

  try {
    // Buscar status da assinatura no Stripe
    const stripeSubscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
    
    console.log("Status da assinatura no Stripe:", stripeSubscription.status);
    
    // Se a assinatura foi cancelada ou expirou no Stripe
    if (stripeSubscription.status === "canceled" || 
        stripeSubscription.status === "unpaid" || 
        stripeSubscription.status === "past_due" ||
        stripeSubscription.status === "incomplete_expired") {
      
      console.log(`Assinatura ${user.stripeSubscriptionId} está ${stripeSubscription.status} - removendo do banco`);
      
      // Remover do banco
      await db
        .update(userTable)
        .set({
          activePlan: null,
          planExpiresAt: null,
          stripeSubscriptionId: null,
          updatedAt: new Date(),
        })
        .where(eq(userTable.id, session.user.id));

      return {
        success: true,
        message: `Assinatura cancelada - status: ${stripeSubscription.status}`,
        hasActiveSubscription: false,
        stripeStatus: stripeSubscription.status,
      };
    }

    // Se a assinatura está ativa, verificar se houve mudança de plano
    if (stripeSubscription.status === "active" && stripeSubscription.items.data.length > 0) {
      const currentPriceId = stripeSubscription.items.data[0].price.id;
      
      // Mapear price IDs para tipos de plano
      const priceIdToPlanMap: Record<string, string> = {
        [process.env.STRIPE_INICIANTE_PRICE_ID!]: "iniciante",
        [process.env.STRIPE_INVESTIDOR_PRICE_ID!]: "investidor",
        [process.env.STRIPE_INICIANTE_ANUAL_PRICE_ID!]: "iniciante_anual",
        [process.env.STRIPE_INVESTIDOR_ANUAL_PRICE_ID!]: "investidor_anual",
      };
      
      const actualPlanType = priceIdToPlanMap[currentPriceId];
      
      // Se o plano no Stripe é diferente do banco, atualizar
      if (actualPlanType && actualPlanType !== user.activePlan) {
        console.log(`Atualizando plano: ${user.activePlan} → ${actualPlanType}`);
        
        // Calcular nova data de expiração baseada no período da assinatura
        const subscription = stripeSubscription as any; // Cast temporário para acessar propriedades
        const currentPeriodEnd = subscription.current_period_end 
          ? new Date(subscription.current_period_end * 1000)
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // Fallback: 30 dias
        
        await db
          .update(userTable)
          .set({
            activePlan: actualPlanType,
            planExpiresAt: currentPeriodEnd,
            updatedAt: new Date(),
          })
          .where(eq(userTable.id, session.user.id));
        
        return {
          success: true,
          message: `Plano atualizado de ${user.activePlan} para ${actualPlanType}`,
          hasActiveSubscription: true,
          stripeStatus: stripeSubscription.status,
          planUpdated: true,
          oldPlan: user.activePlan,
          newPlan: actualPlanType,
        };
      }
    }

    return {
      success: true,
      message: `Assinatura ativa - status: ${stripeSubscription.status}`,
      hasActiveSubscription: true,
      stripeStatus: stripeSubscription.status,
    };

  } catch (error) {
    console.error("Erro ao verificar assinatura no Stripe:", error);
    
    // Se a assinatura não existe mais no Stripe, remover do banco
    if (error instanceof Error && error.message.includes("No such subscription")) {
      console.log(`Assinatura ${user.stripeSubscriptionId} não existe mais no Stripe - removendo do banco`);
      
      await db
        .update(userTable)
        .set({
          activePlan: null,
          planExpiresAt: null,
          stripeSubscriptionId: null,
          updatedAt: new Date(),
        })
        .where(eq(userTable.id, session.user.id));

      return {
        success: true,
        message: "Assinatura não existe mais no Stripe - removida do banco",
        hasActiveSubscription: false,
        stripeStatus: "not_found",
      };
    }

    throw error;
  }
};
