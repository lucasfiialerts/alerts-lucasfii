import { NextRequest } from 'next/server';

export const POST = async (request: NextRequest) => {
  try {
    const { text } = await request.json();

    if (!text || typeof text !== 'string') {
      return Response.json({ error: 'Texto é obrigatório' }, { status: 400 });
    }

    // Retornar apenas sucesso - o áudio será gerado no cliente usando Web Speech API
    return Response.json({ 
      success: true,
      message: 'Use Web Speech API no cliente para gerar o áudio'
    });
  } catch (error: any) {
    console.error('Erro na API de TTS:', error);
    return Response.json({ 
      error: 'Erro ao processar solicitação de TTS' 
    }, { status: 500 });
  }
};
