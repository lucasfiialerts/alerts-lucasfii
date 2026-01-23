"use server";

import { db } from "@/db";
import { chatConversationTable, chatMessageTable } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function getUserConversations() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return { success: false, error: "Não autenticado" };
    }

    const conversations = await db
      .select({
        id: chatConversationTable.id,
        title: chatConversationTable.title,
        isPinned: chatConversationTable.isPinned,
        updatedAt: chatConversationTable.updatedAt,
        createdAt: chatConversationTable.createdAt,
      })
      .from(chatConversationTable)
      .where(eq(chatConversationTable.userId, session.user.id))
      .orderBy(desc(chatConversationTable.updatedAt));

    // Get last message for each conversation
    const conversationsWithLastMessage = await Promise.all(
      conversations.map(async (conv) => {
        const lastMessage = await db
          .select({
            content: chatMessageTable.content,
            role: chatMessageTable.role,
          })
          .from(chatMessageTable)
          .where(eq(chatMessageTable.conversationId, conv.id))
          .orderBy(desc(chatMessageTable.createdAt))
          .limit(1);

        return {
          id: conv.id,
          title: conv.title,
          isPinned: conv.isPinned,
          lastMessage: lastMessage[0]?.content || "",
          updatedAt: new Date(conv.updatedAt),
        };
      })
    );

    return { success: true, conversations: conversationsWithLastMessage };
  } catch (error) {
    console.error("Error fetching conversations:", error);
    return { success: false, error: "Erro ao carregar conversas" };
  }
}

export async function createConversation(title: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return { success: false, error: "Não autenticado" };
    }

    const [conversation] = await db
      .insert(chatConversationTable)
      .values({
        userId: session.user.id,
        title: title || "Nova conversa",
        isPinned: false,
      })
      .returning();

    return { success: true, conversation };
  } catch (error) {
    console.error("Error creating conversation:", error);
    return { success: false, error: "Erro ao criar conversa" };
  }
}

export async function getConversationMessages(conversationId: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return { success: false, error: "Não autenticado" };
    }

    // Verify conversation belongs to user
    const [conversation] = await db
      .select()
      .from(chatConversationTable)
      .where(
        and(
          eq(chatConversationTable.id, conversationId),
          eq(chatConversationTable.userId, session.user.id)
        )
      )
      .limit(1);

    if (!conversation) {
      return { success: false, error: "Conversa não encontrada" };
    }

    const messages = await db
      .select({
        id: chatMessageTable.id,
        role: chatMessageTable.role,
        content: chatMessageTable.content,
        createdAt: chatMessageTable.createdAt,
      })
      .from(chatMessageTable)
      .where(eq(chatMessageTable.conversationId, conversationId))
      .orderBy(chatMessageTable.createdAt);

    return { success: true, messages };
  } catch (error) {
    console.error("Error fetching messages:", error);
    return { success: false, error: "Erro ao carregar mensagens" };
  }
}

export async function saveMessage(
  conversationId: string,
  role: "user" | "assistant" | "system",
  content: string
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return { success: false, error: "Não autenticado" };
    }

    // Verify conversation belongs to user
    const [conversation] = await db
      .select()
      .from(chatConversationTable)
      .where(
        and(
          eq(chatConversationTable.id, conversationId),
          eq(chatConversationTable.userId, session.user.id)
        )
      )
      .limit(1);

    if (!conversation) {
      return { success: false, error: "Conversa não encontrada" };
    }

    const [message] = await db
      .insert(chatMessageTable)
      .values({
        conversationId,
        role,
        content,
      })
      .returning();

    // Update conversation updatedAt
    await db
      .update(chatConversationTable)
      .set({ updatedAt: new Date() })
      .where(eq(chatConversationTable.id, conversationId));

    return { success: true, message };
  } catch (error) {
    console.error("Error saving message:", error);
    return { success: false, error: "Erro ao salvar mensagem" };
  }
}

export async function renameConversation(conversationId: string, newTitle: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return { success: false, error: "Não autenticado" };
    }

    await db
      .update(chatConversationTable)
      .set({ 
        title: newTitle,
        updatedAt: new Date()
      })
      .where(
        and(
          eq(chatConversationTable.id, conversationId),
          eq(chatConversationTable.userId, session.user.id)
        )
      );

    return { success: true };
  } catch (error) {
    console.error("Error renaming conversation:", error);
    return { success: false, error: "Erro ao renomear conversa" };
  }
}

export async function deleteConversation(conversationId: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return { success: false, error: "Não autenticado" };
    }

    await db
      .delete(chatConversationTable)
      .where(
        and(
          eq(chatConversationTable.id, conversationId),
          eq(chatConversationTable.userId, session.user.id)
        )
      );

    return { success: true };
  } catch (error) {
    console.error("Error deleting conversation:", error);
    return { success: false, error: "Erro ao deletar conversa" };
  }
}

export async function togglePinConversation(conversationId: string, isPinned: boolean) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return { success: false, error: "Não autenticado" };
    }

    await db
      .update(chatConversationTable)
      .set({ 
        isPinned,
        updatedAt: new Date()
      })
      .where(
        and(
          eq(chatConversationTable.id, conversationId),
          eq(chatConversationTable.userId, session.user.id)
        )
      );

    return { success: true };
  } catch (error) {
    console.error("Error toggling pin:", error);
    return { success: false, error: "Erro ao fixar/desafixar conversa" };
  }
}
