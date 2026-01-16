import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { db } from "@/db";
import { fiiFundTable, userFiiFollowTable } from "@/db/schema";
import { auth } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { fundId, ticker, name } = await request.json();

    if (!fundId) {
      return NextResponse.json({ error: "ID do fundo é obrigatório" }, { status: 400 });
    }

    let actualFundId = fundId;

    // Se for um ID temporário do site (site-xxx), criar o fundo no banco primeiro
    if (fundId.startsWith('site-')) {
      if (!ticker || !name) {
        return NextResponse.json({ error: "Ticker e nome são obrigatórios para novos fundos" }, { status: 400 });
      }

      console.log(`🆕 Criando novo fundo: ${ticker} - ${name}`);

      // Verificar se já existe por ticker
      const existingByTicker = await db
        .select()
        .from(fiiFundTable)
        .where(eq(fiiFundTable.ticker, ticker.toUpperCase()))
        .limit(1);

      if (existingByTicker.length > 0) {
        actualFundId = existingByTicker[0].id;
        console.log(`✅ Fundo já existe: ${ticker} -> ${actualFundId}`);
      } else {
        // Criar novo fundo
        const newFund = await db
          .insert(fiiFundTable)
          .values({
            ticker: ticker.toUpperCase(),
            name: name.trim(),
          })
          .returning();

        actualFundId = newFund[0].id;
        console.log(`✅ Novo fundo criado: ${ticker} -> ${actualFundId}`);
      }
    } else {
      // Verificar se o fundo existe (para IDs normais)
      const fund = await db
        .select()
        .from(fiiFundTable)
        .where(eq(fiiFundTable.id, fundId))
        .limit(1);

      if (fund.length === 0) {
        return NextResponse.json({ error: "Fundo não encontrado" }, { status: 404 });
      }
    }

    // Verificar se já está seguindo
    const existingFollow = await db
      .select()
      .from(userFiiFollowTable)
      .where(
        and(
          eq(userFiiFollowTable.userId, session.user.id),
          eq(userFiiFollowTable.fundId, actualFundId)
        )
      )
      .limit(1);

    if (existingFollow.length > 0) {
      return NextResponse.json({ error: "Você já segue este fundo" }, { status: 400 });
    }

    // Adicionar follow
    const newFollow = await db
      .insert(userFiiFollowTable)
      .values({
        userId: session.user.id,
        fundId: actualFundId,
        notificationsEnabled: true,
      })
      .returning();

    return NextResponse.json({
      message: "Fundo adicionado ao acompanhamento",
      follow: newFollow[0],
    });

  } catch (error) {
    console.error("❌ Erro ao seguir fundo:", error);
    
    // Log detalhado do erro
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    
    return NextResponse.json(
      { error: "Erro ao adicionar fundo ao acompanhamento", details: error instanceof Error ? error.message : "Erro desconhecido" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Buscar fundos seguidos pelo usuário
    const follows = await db
      .select({
        id: userFiiFollowTable.id,
        notificationsEnabled: userFiiFollowTable.notificationsEnabled,
        createdAt: userFiiFollowTable.createdAt,
        fund: {
          id: fiiFundTable.id,
          ticker: fiiFundTable.ticker,
          name: fiiFundTable.name,
        },
      })
      .from(userFiiFollowTable)
      .innerJoin(fiiFundTable, eq(userFiiFollowTable.fundId, fiiFundTable.id))
      .where(eq(userFiiFollowTable.userId, session.user.id));

    return NextResponse.json({
      follows,
      total: follows.length,
    });

  } catch (error) {
    console.error("Erro ao buscar fundos seguidos:", error);
    return NextResponse.json(
      { error: "Erro ao buscar fundos seguidos" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { followId } = await request.json();

    if (!followId) {
      return NextResponse.json({ error: "ID do follow é obrigatório" }, { status: 400 });
    }

    // Verificar se o follow pertence ao usuário
    const follow = await db
      .select()
      .from(userFiiFollowTable)
      .where(
        and(
          eq(userFiiFollowTable.id, followId),
          eq(userFiiFollowTable.userId, session.user.id)
        )
      )
      .limit(1);

    if (follow.length === 0) {
      return NextResponse.json({ error: "Follow não encontrado" }, { status: 404 });
    }

    // Deletar follow
    await db
      .delete(userFiiFollowTable)
      .where(eq(userFiiFollowTable.id, followId));

    return NextResponse.json({
      message: "Fundo removido do acompanhamento",
    });

  } catch (error) {
    console.error("Erro ao deixar de seguir fundo:", error);
    return NextResponse.json(
      { error: "Erro ao remover fundo do acompanhamento" },
      { status: 500 }
    );
  }
}
