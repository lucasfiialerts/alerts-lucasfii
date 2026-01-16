"use server";

import { eq } from "drizzle-orm";
import { cookies } from "next/headers";

import { db } from "@/db";
import { userTable } from "@/db/schema";
import { auth } from "@/lib/auth";

export async function saveWhatsAppNumber(phoneNumber: string) {
  const session = await auth.api.getSession({
    headers: new Headers({
      cookie: (await cookies()).toString(),
    }),
  });

  if (!session?.user?.id) {
    throw new Error("Usuário não autenticado");
  }

  // Validar formato do número (simples validação)
  const cleanNumber = phoneNumber.replace(/\D/g, '');
  if (cleanNumber.length < 10 || cleanNumber.length > 15) {
    throw new Error("Número de telefone inválido");
  }

  try {
    // Gerar código de verificação de 6 dígitos
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Salvar o número e o código de verificação
    await db
      .update(userTable)
      .set({
        whatsappNumber: cleanNumber,
        whatsappVerified: false,
        whatsappVerificationCode: verificationCode,
        updatedAt: new Date(),
      })
      .where(eq(userTable.id, session.user.id));

    // Enviar código via WhatsApp usando a API route
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/whatsapp/send-verification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phoneNumber: cleanNumber,
        verificationCode: verificationCode,
      }),
    });

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Erro ao enviar WhatsApp');
    }

    console.log(`✅ WhatsApp enviado via ${result.provider}:`, result.message);

    return { 
      success: true, 
      verificationCode, 
      phoneNumber: cleanNumber,
      provider: result.provider 
    };
  } catch (error) {
    console.error("Erro ao salvar número do WhatsApp:", error);
    throw new Error("Erro ao salvar número do WhatsApp");
  }
}
