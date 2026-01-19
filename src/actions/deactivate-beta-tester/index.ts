"use server";

import { auth } from "@/lib/auth";
import { db } from "@/db";
import { userTable } from "@/db/schema";
import { eq } from "drizzle-orm";

export const deactivateBetaTester = async () => {
  try {
    const session = await auth.api.getSession({
      headers: await import("next/headers").then((mod) => mod.headers()),
    });

    if (!session?.user?.id) {
      return {
        success: false,
        message: "Usuário não autenticado.",
      };
    }

    // Desativar plano Beta Tester
    await db
      .update(userTable)
      .set({
        activePlan: null,
        planExpiresAt: null,
        stripeSubscriptionId: null,
      })
      .where(eq(userTable.id, session.user.id));

    console.log(`✅ Plano Beta Tester desativado para o usuário ${session.user.id}`);

    return {
      success: true,
      message: "Plano Beta Tester desativado com sucesso!",
    };
  } catch (error) {
    console.error("❌ Erro ao desativar plano Beta Tester:", error);

    return {
      success: false,
      message: "Erro ao desativar plano Beta Tester. Tente novamente.",
    };
  }
};
