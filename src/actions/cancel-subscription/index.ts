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

export const cancelSubscription = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  // Buscar a assinatura ativa do usuário
  const user = await db.query.userTable.findFirst({
    where: eq(userTable.id, session.user.id),
    columns: {
      stripeSubscriptionId: true,
    },
  });

  if (!user?.stripeSubscriptionId) {
    throw new Error("Usuário não possui assinatura ativa");
  }

  try {
    // Cancelar a assinatura no Stripe
    await stripe.subscriptions.cancel(user.stripeSubscriptionId);
    
    console.log(`Assinatura ${user.stripeSubscriptionId} cancelada no Stripe`);
    
    // O webhook vai atualizar o banco automaticamente
    // Mas podemos atualizar localmente também
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
      message: "Assinatura cancelada com sucesso!",
    };
  } catch (error) {
    console.error("Erro ao cancelar assinatura:", error);
    throw new Error("Erro ao cancelar assinatura no Stripe");
  }
};
