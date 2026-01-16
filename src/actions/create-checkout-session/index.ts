"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Stripe from "stripe";

import { auth } from "@/lib/auth";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-07-30.basil",
});

type PlanType = 
  | "iniciante"
  | "investidor"
  | "iniciante_anual"
  | "investidor_anual";

export const createCheckoutSession = async (planType: PlanType) => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  // Mapear planos para Price IDs do .env
  const priceIdMap: Record<PlanType, string | undefined> = {
    "iniciante": process.env.STRIPE_INICIANTE_PRICE_ID,
    "investidor": process.env.STRIPE_INVESTIDOR_PRICE_ID,
    "iniciante_anual": process.env.STRIPE_INICIANTE_ANUAL_PRICE_ID,
    "investidor_anual": process.env.STRIPE_INVESTIDOR_ANUAL_PRICE_ID,
  };

  const priceId = priceIdMap[planType];

  if (!priceId) {
    throw new Error(`Price ID não configurado no .env para o plano ${planType}`);
  }

  // Todos os planos são assinaturas (recorrentes)
  const isSubscription = true;

  // Criar sessão de checkout
  const checkoutSession = await stripe.checkout.sessions.create({
    mode: isSubscription ? "subscription" : "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/planos`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/planos`,
    customer_email: session.user.email,
    metadata: {
      userId: session.user.id,
      planType: planType,
    },
  });

  if (!checkoutSession.url) {
    throw new Error("Failed to create checkout session");
  }

  redirect(checkoutSession.url);
};
