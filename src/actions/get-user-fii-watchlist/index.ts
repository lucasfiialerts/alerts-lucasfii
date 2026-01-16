"use server";

import { eq } from "drizzle-orm";
import { cookies } from "next/headers";

import { db } from "@/db";
import { fiiFundTable, userFiiFollowTable } from "@/db/schema";
import { auth } from "@/lib/auth";

export interface UserFii {
  id: string;
  ticker: string;
  name: string;
  notificationsEnabled: boolean;
  priceAlertEnabled: boolean;
  minVariationPercent: string;
  alertFrequency: string;
  createdAt: Date;
}

export async function getUserFiiWatchlist(): Promise<{
  success: boolean;
  fiis?: UserFii[];
  message?: string;
}> {
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
    const userFiis = await db
      .select({
        id: userFiiFollowTable.id,
        ticker: fiiFundTable.ticker,
        name: fiiFundTable.name,
        notificationsEnabled: userFiiFollowTable.notificationsEnabled,
        priceAlertEnabled: userFiiFollowTable.priceAlertEnabled,
        minVariationPercent: userFiiFollowTable.minVariationPercent,
        alertFrequency: userFiiFollowTable.alertFrequency,
        createdAt: userFiiFollowTable.createdAt,
      })
      .from(userFiiFollowTable)
      .innerJoin(fiiFundTable, eq(userFiiFollowTable.fundId, fiiFundTable.id))
      .where(eq(userFiiFollowTable.userId, session.user.id));

    return {
      success: true,
      fiis: userFiis.map(fii => ({
        ...fii,
        notificationsEnabled: fii.notificationsEnabled || false,
        priceAlertEnabled: fii.priceAlertEnabled || false,
        minVariationPercent: fii.minVariationPercent || "1.0",
        alertFrequency: fii.alertFrequency || "daily",
      })),
    };

  } catch (error) {
    console.error("❌ Erro ao buscar watchlist:", error);
    return {
      success: false,
      message: "Erro ao buscar sua lista de FIIs",
    };
  }
}
