import { NextRequest, NextResponse } from "next/server";

import { db } from "@/db";
import { userFiiFollowTable } from "@/db/schema";
import { auth } from "@/lib/auth";
import { eq, and } from "drizzle-orm";

export async function PUT(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { followId, notificationsEnabled } = await request.json();

    if (!followId || typeof notificationsEnabled !== "boolean") {
      return NextResponse.json(
        { error: "followId e notificationsEnabled são obrigatórios" }, 
        { status: 400 }
      );
    }

    // Atualizar o status de notificações
    const result = await db
      .update(userFiiFollowTable)
      .set({ 
        notificationsEnabled
      })
      .where(
        and(
          eq(userFiiFollowTable.id, followId),
          eq(userFiiFollowTable.userId, session.user.id)
        )
      )
      .returning();

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Follow não encontrado ou não autorizado" }, 
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      follow: result[0],
      message: `Notificações ${notificationsEnabled ? 'ativadas' : 'desativadas'} com sucesso`
    });

  } catch (error) {
    console.error("❌ Erro ao atualizar notificações:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" }, 
      { status: 500 }
    );
  }
}