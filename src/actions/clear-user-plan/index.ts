"use server";

import { eq } from "drizzle-orm";
import { headers } from "next/headers";

import { db } from "@/db";
import { userTable } from "@/db/schema";
import { auth } from "@/lib/auth";

export const clearUserPlan = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  // Limpar plano do usuário
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
    message: "Plano removido com sucesso!",
  };
};
