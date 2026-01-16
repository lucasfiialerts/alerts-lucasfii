"use server";

import { and, eq } from "drizzle-orm";
import { cookies } from "next/headers";

import { db } from "@/db";
import { fiiFundTable, userFiiFollowTable, userTable } from "@/db/schema";
import { auth } from "@/lib/auth";
import { brapiService } from "@/lib/brapi";

export interface AddFiiResult {
  success: boolean;
  message: string;
  fii?: {
    id: string;
    ticker: string;
    name: string;
  };
}

export async function addFiiToWatchlist(ticker: string): Promise<AddFiiResult> {
  const session = await auth.api.getSession({
    headers: new Headers({
      cookie: (await cookies()).toString(),
    }),
  });

  if (!session?.user?.id) {
    return {
      success: false,
      message: "Usuário não autenticado",
    };
  }

  try {
    const cleanTicker = ticker.trim().toUpperCase();
    
    // Validar se é um ticker válido (formato básico)
    if (!/^[A-Z]{4}11$/.test(cleanTicker)) {
      return {
        success: false,
        message: "Ticker inválido. Use o formato correto (ex: VTLT11, SAPI11)",
      };
    }

    // Verificar se o FII existe na BRAPI
    console.log(`🔍 Verificando FII ${cleanTicker} na BRAPI...`);
    const fiiData = await brapiService.getSingleFiiData(cleanTicker);
    
    if (!fiiData) {
      return {
        success: false,
        message: `FII ${cleanTicker} não encontrado. Verifique se o código está correto.`,
      };
    }

    // Verificar se o FII já existe no banco
    let fiiFund = await db
      .select()
      .from(fiiFundTable)
      .where(eq(fiiFundTable.ticker, cleanTicker))
      .limit(1);

    // Se não existe, criar o FII
    if (fiiFund.length === 0) {
      console.log(`📝 Criando novo FII ${cleanTicker} no banco...`);
      
      const newFii = await db
        .insert(fiiFundTable)
        .values({
          ticker: cleanTicker,
          name: fiiData.longName || fiiData.shortName || cleanTicker,
        })
        .returning();

      fiiFund = newFii;
    }

    const fundId = fiiFund[0].id;

    // Verificar se o usuário já está seguindo este FII
    const existingFollow = await db
      .select()
      .from(userFiiFollowTable)
      .where(
        and(
          eq(userFiiFollowTable.userId, session.user.id),
          eq(userFiiFollowTable.fundId, fundId)
        )
      )
      .limit(1);

    if (existingFollow.length > 0) {
      return {
        success: false,
        message: `Você já está acompanhando o FII ${cleanTicker}`,
      };
    }

    // Adicionar o FII à watchlist do usuário
    await db.insert(userFiiFollowTable).values({
      userId: session.user.id,
      fundId: fundId,
      notificationsEnabled: true,
      priceAlertEnabled: true,
      minVariationPercent: "2.0", // 2% de variação por padrão
      alertFrequency: "daily",
    });

    console.log(`✅ FII ${cleanTicker} adicionado à watchlist do usuário ${session.user.id}`);

    return {
      success: true,
      message: `FII ${cleanTicker} adicionado com sucesso à sua watchlist!`,
      fii: {
        id: fundId,
        ticker: cleanTicker,
        name: fiiFund[0].name,
      },
    };

  } catch (error) {
    console.error("❌ Erro ao adicionar FII:", error);
    
    if (error instanceof Error && error.message.includes("Erro na BRAPI")) {
      return {
        success: false,
        message: "Erro ao buscar informações do FII. Tente novamente em alguns minutos.",
      };
    }

    return {
      success: false,
      message: "Erro interno do servidor. Tente novamente mais tarde.",
    };
  }
}
