"use server";

import { eq } from "drizzle-orm";
import { cookies } from "next/headers";

import { db } from "@/db";
import { userTable } from "@/db/schema";
import { auth } from "@/lib/auth";

export async function getUserWhatsAppData() {
  try {
    const session = await auth.api.getSession({
      headers: new Headers({
        cookie: (await cookies()).toString(),
      }),
    });

    if (!session?.user?.id) {
      return {
        whatsappNumber: null,
        whatsappVerified: false,
        error: "Usuário não autenticado"
      };
    }

    const user = await db
      .select({
        whatsappNumber: userTable.whatsappNumber,
        whatsappVerified: userTable.whatsappVerified,
      })
      .from(userTable)
      .where(eq(userTable.id, session.user.id))
      .limit(1);

    if (!user[0]) {
      return {
        whatsappNumber: null,
        whatsappVerified: false,
        error: "Usuário não encontrado"
      };
    }

    return user[0];
  } catch (error) {
    console.error("Erro ao buscar dados do WhatsApp:", error);
    
    // Retorna dados padrão em caso de erro de conexão
    return {
      whatsappNumber: null,
      whatsappVerified: false,
      error: "Erro de conexão com o banco de dados"
    };
  }
}
