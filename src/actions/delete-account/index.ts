"use server";

import { eq } from "drizzle-orm";
import { cookies } from "next/headers";

import { db } from "@/db";
import { accountTable,sessionTable, userTable } from "@/db/schema";
import { auth } from "@/lib/auth";

export async function deleteAccount() {
  const session = await auth.api.getSession({
    headers: new Headers({
      cookie: (await cookies()).toString(),
    }),
  });

  if (!session?.user?.id) {
    throw new Error("Usuário não autenticado");
  }

  const userId = session.user.id;

  try {
    // Excluir todas as sessões do usuário
    await db.delete(sessionTable).where(eq(sessionTable.userId, userId));
    
    // Excluir todas as contas vinculadas (Google, etc.)
    await db.delete(accountTable).where(eq(accountTable.userId, userId));
    
    // Excluir o usuário
    await db.delete(userTable).where(eq(userTable.id, userId));

    return { success: true };
  } catch (error) {
    console.error("Erro ao excluir conta:", error);
    throw new Error("Erro ao excluir conta");
  }
}
