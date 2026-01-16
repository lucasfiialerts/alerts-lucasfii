"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { stripe } from "@/lib/stripe";

export async function createBillingPortalSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new Error("Usuário não autenticado");
  }

  // Buscar o customer ID do Stripe através do email
  const customers = await stripe.customers.list({
    email: session.user.email,
    limit: 1,
  });

  if (customers.data.length === 0) {
    throw new Error("Cliente não encontrado no Stripe");
  }

  const customerId = customers.data[0].id;

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}`,
  });

  return redirect(portalSession.url);
}
