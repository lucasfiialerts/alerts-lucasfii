import { db } from "@/db";
import { userTable } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return Response.json({ error: "Não autenticado" }, { status: 401 });
    }

    const [userData] = await db
      .select({
        selectedAiProvider: userTable.selectedAiProvider,
        aiProviderCustomName: userTable.aiProviderCustomName,
      })
      .from(userTable)
      .where(eq(userTable.id, session.user.id))
      .limit(1);

    return Response.json({
      success: true,
      selectedProvider: userData?.selectedAiProvider || 'gemini-flash',
      customName: userData?.aiProviderCustomName,
    });
  } catch (error) {
    console.error("Erro ao buscar preferências de IA:", error);
    return Response.json(
      { error: "Erro ao buscar preferências de IA" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return Response.json({ error: "Não autenticado" }, { status: 401 });
    }

    const { provider, customName } = await request.json();

    // Validar provider
    const validProviders = [
      'gemini-flash',
      'gemini-pro',
      'groq-llama',
      'groq-mixtral',
    ];

    if (!validProviders.includes(provider)) {
      return Response.json(
        { error: "Provedor de IA inválido" },
        { status: 400 }
      );
    }

    await db
      .update(userTable)
      .set({
        selectedAiProvider: provider,
        aiProviderCustomName: customName || null,
      })
      .where(eq(userTable.id, session.user.id));

    return Response.json({
      success: true,
      message: "Preferências de IA atualizadas com sucesso",
    });
  } catch (error) {
    console.error("Erro ao atualizar preferências de IA:", error);
    return Response.json(
      { error: "Erro ao atualizar preferências de IA" },
      { status: 500 }
    );
  }
}
