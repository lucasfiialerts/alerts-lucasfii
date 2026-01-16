"use server";

import { eq } from "drizzle-orm";
import { headers } from "next/headers";

import { db } from "@/db";
import { userTable } from "@/db/schema";
import { auth } from "@/lib/auth";

export const checkActivePlan = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return {
      hasActivePlan: false,
      user: null,
    };
  }

  const user = await db.query.userTable.findFirst({
    where: eq(userTable.id, session.user.id),
    columns: {
      id: true,
      activePlan: true,
      planExpiresAt: true,
    },
  });

  if (!user) {
    return {
      hasActivePlan: false,
      user: null,
    };
  }

  // Verificar apenas se tem plano ativo
  // O Stripe gerencia a expiração/cancelamento via webhooks
  const hasActivePlan = !!(user.activePlan);

  return {
    hasActivePlan,
    user: {
      id: user.id,
      activePlan: user.activePlan,
      planExpiresAt: user.planExpiresAt,
    },
  };
};
