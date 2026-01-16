import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { Resend } from "resend";

import { db } from "@/db";
import * as schema from "@/db/schema";

let resend: Resend | null = null;

if (process.env.RESEND_API_KEY) {
  resend = new Resend(process.env.RESEND_API_KEY);
}

export const auth = betterAuth({
  emailAndPassword: {
    enabled: true,
    sendResetPassword: async (data) => {
      if (!resend) {
        console.error('Resend não configurado - email de reset não enviado');
        return;
      }
      
      const { user, token } = data;
      const resetLink = `${process.env.NEXT_PUBLIC_APP_URL}/authentication/reset-password?token=${token}`;
      
      try {
        await resend.emails.send({
          from: 'noreply@devrocha.com.br',
          to: [user.email],
          subject: 'Redefinição de Senha - DevRocha',
          html: `
            <h1>Redefinição de Senha</h1>
            <p>Olá,</p>
            <p>Você solicitou a redefinição de sua senha. Clique no link abaixo para criar uma nova senha:</p>
            <p><a href="${resetLink}">Redefinir Senha</a></p>
            <p>Se você não solicitou esta redefinição, ignore este email.</p>
            <p>O link expira em 1 hora.</p>
            <p>Atenciosamente,<br>Equipe DevRocha</p>
          `
        });
      } catch (error) {
        console.error('Erro ao enviar email de reset:', error);
      }
    },
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  user: {
    modelName: "userTable",
  },
  session: {
    modelName: "sessionTable",
  },
  account: {
    modelName: "accountTable",
  },
  verification: {
    modelName: "verificationTable",
  },
});
