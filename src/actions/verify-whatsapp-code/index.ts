"use server";

import { eq } from "drizzle-orm";
import { cookies } from "next/headers";

import { db } from "@/db";
import { userTable } from "@/db/schema";
import { auth } from "@/lib/auth";

export async function verifyWhatsAppCode(code: string) {
  const session = await auth.api.getSession({
    headers: new Headers({
      cookie: (await cookies()).toString(),
    }),
  });

  if (!session?.user?.id) {
    throw new Error("Usuário não autenticado");
  }

  try {
    // Buscar o usuário e verificar o código
    const user = await db
      .select()
      .from(userTable)
      .where(eq(userTable.id, session.user.id))
      .limit(1);

    if (!user[0]) {
      throw new Error("Usuário não encontrado");
    }

    if (!user[0].whatsappVerificationCode) {
      throw new Error("Nenhum código de verificação pendente");
    }

    if (user[0].whatsappVerificationCode !== code) {
      throw new Error("Código de verificação inválido");
    }

    // Marcar como verificado e limpar o código
    await db
      .update(userTable)
      .set({
        whatsappVerified: true,
        whatsappVerificationCode: null,
        updatedAt: new Date(),
      })
      .where(eq(userTable.id, session.user.id));

    return { success: true };
  } catch (error) {
    console.error("Erro ao verificar código do WhatsApp:", error);
    throw new Error(error instanceof Error ? error.message : "Erro ao verificar código");
  }
}
