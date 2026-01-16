"use server";

import { eq } from "drizzle-orm";
import { headers } from "next/headers";

import { db } from "@/db";
import { userTable } from "@/db/schema";
import { auth } from "@/lib/auth";

export const cancelBySubscriptionId = async (subscriptionId: string) => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  // Buscar usuário com esta assinatura
  const userWithSubscription = await db.query.userTable.findFirst({
    where: eq(userTable.stripeSubscriptionId, subscriptionId),
    columns: {
      id: true,
      email: true,
      activePlan: true,
      stripeSubscriptionId: true,
    },
  });

  console.log("Usuário encontrado:", userWithSubscription);

  if (!userWithSubscription) {
    throw new Error(`Nenhum usuário encontrado com assinatura ${subscriptionId}`);
  }

  // Cancelar assinatura no banco
  await db
    .update(userTable)
    .set({
      activePlan: null,
      planExpiresAt: null,
      stripeSubscriptionId: null,
      updatedAt: new Date(),
    })
    .where(eq(userTable.stripeSubscriptionId, subscriptionId));

  return {
    success: true,
    message: `Assinatura ${subscriptionId} cancelada com sucesso!`,
    user: userWithSubscription,
  };
};
