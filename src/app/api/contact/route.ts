import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, subject, message } = body;

    // Validar dados obrigatórios
    if (!name || !email || !phone || !subject || !message) {
      return NextResponse.json(
        { error: "Todos os campos são obrigatórios" },
        { status: 400 }
      );
    }

    // Enviar email usando Resend
    const isDevelopment = process.env.NODE_ENV === 'development';
    const recipientEmail = isDevelopment ? "devrochapj@gmail.com" : "contato@devrocha.com.br";
    
    console.log(`Enviando email para: ${recipientEmail} (desenvolvimento: ${isDevelopment})`);
    
    const { data, error } = await resend.emails.send({
      from: "DevRocha <onboarding@resend.dev>",
      to: [recipientEmail],
      subject: `Nova mensagem de contato: ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background-color: #01030d; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">Nova Mensagem de Contato</h1>
            <p style="margin: 5px 0 0 0; color: #ccc;">Formulário do site DevRocha</p>
          </div>
          
          <div style="background-color: white; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="margin-bottom: 20px;">
              <h3 style="color: #333; margin: 0 0 10px 0; font-size: 18px;">Informações do Cliente</h3>
              <p style="margin: 5px 0; color: #666;"><strong>Nome:</strong> ${name}</p>
              <p style="margin: 5px 0; color: #666;"><strong>Email:</strong> ${email}</p>
              <p style="margin: 5px 0; color: #666;"><strong>Telefone:</strong> ${phone}</p>
              <p style="margin: 5px 0; color: #666;"><strong>Assunto:</strong> ${subject}</p>
            </div>
            
            <div style="margin-bottom: 20px;">
              <h3 style="color: #333; margin: 0 0 10px 0; font-size: 18px;">Mensagem</h3>
              <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; border-left: 4px solid #01030d;">
                <p style="margin: 0; color: #333; line-height: 1.6;">${message.replace(/\n/g, '<br>')}</p>
              </div>
            </div>
            
            <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 20px;">
              <p style="margin: 0; color: #666; font-size: 14px;">
                Esta mensagem foi enviada através do formulário de contato do site DevRocha.
              </p>
              <p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">
                Data: ${new Date().toLocaleString('pt-BR')}
              </p>
            </div>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error("Erro ao enviar email:", error);
      return NextResponse.json(
        { error: "Erro interno do servidor" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "Mensagem enviada com sucesso", id: data?.id },
      { status: 200 }
    );

  } catch (error) {
    console.error("Erro na API de contato:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
