"use server";

import { eq } from "drizzle-orm";
import { headers } from "next/headers";

import { db } from "@/db";
import { userTable } from "@/db/schema";
import { auth } from "@/lib/auth";

export const manualActivatePlan = async (planType: "basico" | "annualbasico") => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const now = new Date();
  let expiresAt: Date;

  if (planType === "basico") {
    // Plano mensal - expira em 30 dias
    expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  } else if (planType === "annualbasico") {
    // Plano anual - expira em 365 dias
    expiresAt = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
  } else {
    throw new Error("Tipo de plano inválido");
  }

  // Ativar plano manualmente
  await db
    .update(userTable)
    .set({
      activePlan: planType,
      planExpiresAt: expiresAt,
      stripeSubscriptionId: `manual_${Date.now()}`, // ID temporário para teste
      updatedAt: new Date(),
    })
    .where(eq(userTable.id, session.user.id));

  return {
    success: true,
    message: `Plano ${planType} ativado manualmente!`,
    expiresAt: expiresAt.toISOString(),
  };
};
