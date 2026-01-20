"use server";

import { eq } from "drizzle-orm";
import { headers } from "next/headers";

import { db } from "@/db";
import { userTable } from "@/db/schema";
import { auth } from "@/lib/auth";

export const activateBetaTester = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return {
      success: false,
      message: "Usuário não autenticado",
    };
  }

  try {
    // Verificar se o usuário já tem um plano ativo
    const user = await db.query.userTable.findFirst({
      where: eq(userTable.id, session.user.id),
      columns: {
        activePlan: true,
        planExpiresAt: true,
      },
    });

    if (user?.activePlan && user?.planExpiresAt && new Date(user.planExpiresAt) > new Date()) {
      return {
        success: false,
        message: "Você já possui um plano ativo",
      };
    }

    // Ativar plano Beta Tester por 30 dias
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 dias

    await db
      .update(userTable)
      .set({
        activePlan: "beta_tester",
        planExpiresAt: expiresAt,
        stripeSubscriptionId: null, // Plano gratuito não tem subscription do Stripe
        updatedAt: new Date(),
      })
      .where(eq(userTable.id, session.user.id));

    console.log(`✅ Plano Beta Tester ativado para o usuário ${session.user.id} até ${expiresAt.toISOString()}`);

    return {
      success: true,
      message: "Plano Beta Tester ativado com sucesso! Válido por 30 dias.",
      expiresAt: expiresAt.toISOString(),
    };
  } catch (error) {
    console.error("❌ Erro ao ativar plano Beta Tester:", error);
    return {
      success: false,
      message: "Erro ao ativar plano Beta Tester. Tente novamente.",
    };
  }
};
