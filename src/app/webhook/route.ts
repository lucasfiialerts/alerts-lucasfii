import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import Stripe from "stripe";

import { db } from "@/db";
import { orderTable, userTable } from "@/db/schema";

export const POST = async (request: Request) => {
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    console.error("Stripe keys not configured");
    return NextResponse.json({ error: "Stripe keys not configured" }, { status: 500 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    console.error("No stripe signature found");
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  try {
    const text = await request.text();
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const event = stripe.webhooks.constructEvent(
      text,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET,
    );

    console.log("Webhook event received:", event.type);

    if (event.type === "checkout.session.completed") {
      console.log("Checkout session completed");
      const session = event.data.object as Stripe.Checkout.Session;

      // Verificar se é um order (tem orderId) ou uma subscription (tem userId + planType)
      const orderId = session.metadata?.orderId;
      const userId = session.metadata?.userId;
      const planType = session.metadata?.planType;

      if (orderId) {
        // Processar como order
        console.log("Processing order:", orderId);
        await db
          .update(orderTable)
          .set({
            status: "paid",
          })
          .where(eq(orderTable.id, orderId));

        console.log("Order status updated to paid:", orderId);

      } else if (userId && planType && session.subscription) {
        // Processar como subscription
        console.log("Processing subscription:", { userId, planType, subscription: session.subscription });

        const subscriptionId = session.subscription as string;
        const now = new Date();
        let expiresAt: Date;

        // Determinar data de expiração baseada no plano
        if (planType === "iniciante" || planType === "investidor") {
          // Planos mensais - 30 dias
          expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        } else if (planType === "iniciante_anual" || planType === "investidor_anual") {
          // Planos anuais - 365 dias
          expiresAt = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
        } else {
          console.error("Tipo de plano inválido:", planType);
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

      } else {
        console.error("Metadata inválido - sem orderId nem userId/planType");
        console.error("Metadata recebido:", session.metadata);
        return NextResponse.json({ error: "Metadata inválido" }, { status: 400 });
      }
    }

    // Tratar cancelamento de assinatura
    else if (event.type === "customer.subscription.deleted") {
      console.log("Subscription cancelled/deleted");
      const subscription = event.data.object as Stripe.Subscription;
      const subscriptionId = subscription.id;

      console.log("Cancelando assinatura:", subscriptionId);

      // Buscar usuário com esta assinatura
      const userWithSubscription = await db.query.userTable.findFirst({
        where: eq(userTable.stripeSubscriptionId, subscriptionId),
        columns: {
          id: true,
          email: true,
          activePlan: true,
        },
      });

      if (userWithSubscription) {
        // Remover assinatura do banco
        await db
          .update(userTable)
          .set({
            activePlan: null,
            planExpiresAt: null,
            stripeSubscriptionId: null,
            updatedAt: new Date(),
          })
          .where(eq(userTable.stripeSubscriptionId, subscriptionId));

        console.log(`✅ Assinatura ${subscriptionId} cancelada para usuário ${userWithSubscription.email}`);
      } else {
        console.log(`⚠️ Nenhum usuário encontrado com assinatura ${subscriptionId}`);
      }
    }

    // Tratar atualização de assinatura (cancelamento, pausa, mudança de plano, etc)
    else if (event.type === "customer.subscription.updated") {
      console.log("Subscription updated");
      const subscription = event.data.object as Stripe.Subscription;
      const subscriptionId = subscription.id;

      console.log("Status da assinatura:", subscription.status);
      console.log("Items da assinatura:", subscription.items.data);

      // Se a assinatura está ativa, verificar se houve mudança de plano
      if (subscription.status === "active") {
        // Buscar usuário com esta assinatura
        const userWithSubscription = await db.query.userTable.findFirst({
          where: eq(userTable.stripeSubscriptionId, subscriptionId),
          columns: {
            id: true,
            email: true,
            activePlan: true,
            planExpiresAt: true,
          },
        });

        if (userWithSubscription && subscription.items.data.length > 0) {
          // Obter o price ID do item atual da assinatura
          const currentPriceId = subscription.items.data[0].price.id;
          console.log("Current price ID:", currentPriceId);

          // Mapear price IDs para tipos de plano
          let newPlanType: string | null = null;

          // Mapear os price IDs do Stripe para os tipos de plano
          const priceIdToPlanMap: Record<string, string> = {
            // Price IDs dos novos planos
            [process.env.STRIPE_BASICA_PRICE_ID!]: "basica",
            [process.env.STRIPE_STANDARD_PRICE_ID!]: "standard",
            [process.env.STRIPE_PREMIUM_PRICE_ID!]: "premium",
            // Price IDs dos planos antigos (se existirem)
            [process.env.STRIPE_BASICO_PRICE_ID!]: "basico",
            [process.env.STRIPE_ANNUAL_PRICE_ID!]: "annualbasico",
          };

          newPlanType = priceIdToPlanMap[currentPriceId];

          if (newPlanType) {
            // Sempre usar a data de expiração do Stripe (current_period_end)
            const stripeExpirationDate = new Date((subscription as any).current_period_end * 1000);

            // Verificar se houve mudança de plano OU se a data de expiração mudou
            const currentExpirationDate = userWithSubscription.planExpiresAt ? new Date(userWithSubscription.planExpiresAt) : null;
            const planChanged = newPlanType !== userWithSubscription.activePlan;
            const dateChanged = !currentExpirationDate || Math.abs(stripeExpirationDate.getTime() - currentExpirationDate.getTime()) > 60000; // Diferença maior que 1 minuto

            if (planChanged || dateChanged) {
              console.log(`Atualizando assinatura - Plano: ${userWithSubscription.activePlan} → ${newPlanType}, Data: ${currentExpirationDate?.toISOString()} → ${stripeExpirationDate.toISOString()}`);

              // Atualizar plano e data no banco usando sempre os dados do Stripe
              await db
                .update(userTable)
                .set({
                  activePlan: newPlanType,
                  planExpiresAt: stripeExpirationDate,
                  updatedAt: new Date(),
                })
                .where(eq(userTable.id, userWithSubscription.id));

              console.log(`✅ Assinatura atualizada - Plano: ${newPlanType}, Expira em: ${stripeExpirationDate.toLocaleDateString('pt-BR')}`);
            } else {
              console.log("Nenhuma mudança detectada na assinatura");
            }
          } else {
            console.log("Price ID não mapeado:", currentPriceId);
          }
        }
      }

      // Se a assinatura foi cancelada, pausada ou tem problema de pagamento
      else if (subscription.status === "canceled" ||
        subscription.status === "unpaid" ||
        subscription.status === "past_due" ||
        subscription.status === "paused") {

        console.log(`Assinatura ${subscriptionId} com status ${subscription.status} - removendo do banco`);

        await db
          .update(userTable)
          .set({
            activePlan: null,
            planExpiresAt: null,
            stripeSubscriptionId: null,
            updatedAt: new Date(),
          })
          .where(eq(userTable.stripeSubscriptionId, subscriptionId));

        console.log(`✅ Assinatura ${subscriptionId} removida do banco devido ao status: ${subscription.status}`);
      }
    }

    // Tratar falha no pagamento
    else if (event.type === "invoice.payment_failed") {
      console.log("Invoice payment failed");
      const invoice = event.data.object as any; // Usar any para acessar subscription

      if (invoice.subscription) {
        const subscriptionId = typeof invoice.subscription === 'string'
          ? invoice.subscription
          : invoice.subscription.id;

        console.log(`Falha no pagamento da assinatura ${subscriptionId}`);

        await db
          .update(userTable)
          .set({
            activePlan: null,
            planExpiresAt: null,
            stripeSubscriptionId: null,
            updatedAt: new Date(),
          })
          .where(eq(userTable.stripeSubscriptionId, subscriptionId));

        console.log(`✅ Assinatura ${subscriptionId} removida do banco por falha no pagamento`);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Webhook error" }, { status: 400 });
  }
};
