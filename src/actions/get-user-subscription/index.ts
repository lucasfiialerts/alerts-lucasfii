"use server";

import { eq } from "drizzle-orm";
import { headers } from "next/headers";

import { db } from "@/db";
import { userTable } from "@/db/schema";
import { auth } from "@/lib/auth";

export const getUserSubscription = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return null;
  }

  const user = await db.query.userTable.findFirst({
    where: eq(userTable.id, session.user.id),
    columns: {
      activePlan: true,
      planExpiresAt: true,
      stripeSubscriptionId: true,
    },
  });

  if (!user || !user.activePlan) {
    return null;
  }

  const now = new Date();
  const expiresAt = user.planExpiresAt ? new Date(user.planExpiresAt) : null;

  // O Stripe gerencia a expiração via webhooks, então só retornamos os dados
  return {
    plan: user.activePlan,
    expiresAt: user.planExpiresAt,
    isActive: true,
    stripeSubscriptionId: user.stripeSubscriptionId,
    daysRemaining: expiresAt ? Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null,
  };
};
