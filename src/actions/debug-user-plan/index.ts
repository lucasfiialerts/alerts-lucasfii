"use server";

import { eq } from "drizzle-orm";
import { headers } from "next/headers";

import { db } from "@/db";
import { userTable } from "@/db/schema";
import { auth } from "@/lib/auth";

export const debugUserPlan = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return { error: "Usuário não logado" };
  }

  const user = await db.query.userTable.findFirst({
    where: eq(userTable.id, session.user.id),
    columns: {
      id: true,
      email: true,
      activePlan: true,
      planExpiresAt: true,
      stripeSubscriptionId: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return {
    user: user,
    session: {
      userId: session.user.id,
      email: session.user.email,
    },
  };
};
