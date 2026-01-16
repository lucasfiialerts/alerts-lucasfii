import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import Stripe from "stripe";

import { db } from "@/db";
import { userTable } from "@/db/schema";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-07-30.basil",
});

export const POST = async (request: Request) => {
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.error();
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.error();
  }

  const text = await request.text();
  const event = stripe.webhooks.constructEvent(
    text,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET,
  );

  console.log("Webhook event type:", event.type);
  console.log("Webhook event data:", JSON.stringify(event.data.object, null, 2));

  try {
    console.log("=== PROCESSANDO WEBHOOK ===");
    console.log("Event type:", event.type);
    console.log("Full event object:", JSON.stringify(event, null, 2));

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        console.log("=== CHECKOUT SESSION COMPLETED ===");
        console.log("Checkout session mode:", session.mode);
        console.log("Session metadata:", JSON.stringify(session.metadata, null, 2));
        console.log("Session subscription:", session.subscription);
        console.log("Session customer:", session.customer);
        console.log("Session status:", session.status);
        console.log("Session payment_status:", session.payment_status);
        console.log("Full session object:", JSON.stringify(session, null, 2));

        // Processar tanto subscription quanto payment mode
        if (session.mode === "subscription" || session.subscription) {
          console.log("✅ Subscription checkout detected");
          const subscriptionId = session.subscription as string;
          const userId = session.metadata?.userId;
          const planType = session.metadata?.planType;

          console.log("=== METADATA VALIDATION ===");
          console.log("Subscription ID:", subscriptionId);
          console.log("User ID:", userId);
          console.log("Plan Type:", planType);
          console.log("Metadata exists:", !!session.metadata);
          console.log("Metadata keys:", session.metadata ? Object.keys(session.metadata) : "none");

          // Verificar se os metadados existem (pode estar em formato diferente)
          if (!session.metadata) {
            console.error("❌ ERRO: metadata object is null/undefined");
            return NextResponse.json({ error: "metadata object is null/undefined" }, { status: 400 });
          }

          if (!userId) {
            console.error("❌ ERRO: userId não encontrado no metadata");
            console.error("Available metadata keys:", Object.keys(session.metadata));
            console.error("Full metadata:", JSON.stringify(session.metadata, null, 2));
            return NextResponse.json({ error: "userId não encontrado no metadata" }, { status: 400 });
          }

          if (!planType) {
            console.error("❌ ERRO: planType não encontrado no metadata");
            console.error("Available metadata keys:", Object.keys(session.metadata));
            console.error("Full metadata:", JSON.stringify(session.metadata, null, 2));
            return NextResponse.json({ error: "planType não encontrado no metadata" }, { status: 400 });
          }

          if (!subscriptionId) {
            console.error("❌ ERRO: subscriptionId não encontrado");
            console.error("session.subscription:", session.subscription);
            console.error("session.mode:", session.mode);
            return NextResponse.json({ error: "subscriptionId não encontrado" }, { status: 400 });
          }

          try {
            // Ativar assinatura no banco
            const now = new Date();
            let expiresAt: Date;

            if (planType === "iniciante" || planType === "investidor") {
              // Planos mensais - expira em 30 dias
              expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
            } else if (planType === "iniciante_anual" || planType === "investidor_anual") {
              // Planos anuais - expira em 365 dias
              expiresAt = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
            } else {
              console.error("ERRO: Tipo de plano inválido:", planType);
              console.error("Planos válidos: iniciante, investidor, iniciante_anual, investidor_anual");
              return NextResponse.json({ error: `Tipo de plano inválido: ${planType}` }, { status: 400 });
            }

            await db
              .update(userTable)
              .set({
                activePlan: planType,
                planExpiresAt: expiresAt,
                stripeSubscriptionId: subscriptionId,
                updatedAt: new Date(),
              })
              .where(eq(userTable.id, userId));

            console.log(`✅ Plano ${planType} ativado para usuário ${userId}`);
          } catch (dbError) {
            console.error("ERRO ao atualizar banco de dados:", dbError);
            return NextResponse.json({ error: "Erro ao atualizar banco de dados" }, { status: 500 });
          }
        } else {
          console.log("Checkout session não é de subscription, ignorando");
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        console.log("Subscription updated:", subscription.id);
        console.log("Subscription status:", subscription.status);

        // Verificar se a assinatura foi cancelada ou expirou
        if (subscription.status === "canceled" || subscription.status === "unpaid" || subscription.status === "past_due") {
          console.log(`Assinatura ${subscription.id} cancelada/expirada - removendo do banco`);

          await db
            .update(userTable)
            .set({
              activePlan: null,
              planExpiresAt: null,
              stripeSubscriptionId: null,
              updatedAt: new Date(),
            })
            .where(eq(userTable.stripeSubscriptionId, subscription.id));

          console.log(`Assinatura ${subscription.id} removida do banco`);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        console.log("=== CUSTOMER.SUBSCRIPTION.DELETED ===");
        console.log("Subscription cancelled:", subscription.id);
        console.log("Full subscription object:", JSON.stringify(subscription, null, 2));

        // Buscar usuário com esta assinatura antes de cancelar
        const userWithSubscription = await db.query.userTable.findFirst({
          where: eq(userTable.stripeSubscriptionId, subscription.id),
          columns: {
            id: true,
            email: true,
            activePlan: true,
            stripeSubscriptionId: true,
          },
        });

        console.log("Usuário encontrado com esta assinatura:", userWithSubscription);

        if (userWithSubscription) {
          // Cancelar assinatura no banco
          await db
            .update(userTable)
            .set({
              activePlan: null,
              planExpiresAt: null,
              stripeSubscriptionId: null,
              updatedAt: new Date(),
            })
            .where(eq(userTable.stripeSubscriptionId, subscription.id));

          console.log(`Assinatura ${subscription.id} cancelada para usuário ${userWithSubscription.email}`);
        } else {
          console.log(`Nenhum usuário encontrado com assinatura ${subscription.id}`);
        }

        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        console.log("Invoice payment failed:", invoice.id);

        const subscriptionId = (invoice as Stripe.Invoice & { subscription?: string | { id: string } }).subscription;
        if (subscriptionId) {
          const subId = typeof subscriptionId === 'string'
            ? subscriptionId
            : subscriptionId.id;
          console.log(`Falha no pagamento da assinatura ${subId} - removendo do banco`);

          await db
            .update(userTable)
            .set({
              activePlan: null,
              planExpiresAt: null,
              stripeSubscriptionId: null,
              updatedAt: new Date(),
            })
            .where(eq(userTable.stripeSubscriptionId, subId));

          console.log(`Assinatura ${subId} removida do banco por falha no pagamento`);
        }
        break;
      }

      case "customer.subscription.paused": {
        const subscription = event.data.object as Stripe.Subscription;
        console.log("Subscription paused:", subscription.id);

        await db
          .update(userTable)
          .set({
            activePlan: null,
            planExpiresAt: null,
            stripeSubscriptionId: null,
            updatedAt: new Date(),
          })
          .where(eq(userTable.stripeSubscriptionId, subscription.id));

        console.log(`Assinatura ${subscription.id} pausada - removida do banco`);
        break;
      }

      default:
        console.log(`Evento não tratado: ${event.type}`);
    }

    console.log("=== WEBHOOK PROCESSADO COM SUCESSO ===");
  } catch (error) {
    console.error("=== ERRO NO WEBHOOK ===");
    console.error("Erro no webhook:", error);
    console.error("Stack trace:", (error as Error)?.stack);
    console.error("Event type:", event.type);
    console.error("Event data:", JSON.stringify(event.data.object, null, 2));

    return NextResponse.json({
      error: "Erro interno do servidor",
      details: error instanceof Error ? error.message : "Erro desconhecido",
      eventType: event.type
    }, { status: 500 });
  }

  console.log("=== RETORNANDO SUCESSO ===");
  return NextResponse.json({ received: true });
};
