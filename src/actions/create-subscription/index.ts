"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Stripe from "stripe";

import { auth } from "@/lib/auth";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-07-30.basil",
});

export const createSubscription = async (planType: "basico" | "annualbasico") => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  // IDs dos preços no Stripe do .env
  const priceId = planType === "basico" 
    ? process.env.STRIPE_BASICO_PRICE_ID
    : process.env.STRIPE_ANNUAL_PRICE_ID;

  if (!priceId) {
    throw new Error(`Price ID não configurado no .env para o plano ${planType}`);
  }

  // Criar sessão de checkout para assinatura
  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "subscription",
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
