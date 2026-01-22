import { NextRequest, NextResponse } from 'next/server';

/**
 * Endpoint temporário para ver o formato exato do payload do UltraMsg
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const timestamp = new Date().toISOString();
    
    console.log('=== ULTRAMSG PAYLOAD DEBUG ===');
    console.log('Timestamp:', timestamp);
    console.log('Headers:', Object.fromEntries(request.headers.entries()));
    console.log('Body:', JSON.stringify(body, null, 2));
    console.log('===========================');
    
    // Retorna com timestamp para confirmar que foi recebido AGORA
    return NextResponse.json({ 
      received: true,
      timestamp,
      payload: body,
      headers: Object.fromEntries(request.headers.entries())
    });
  } catch (error) {
    console.error('Erro no debug:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ message: 'Debug endpoint ativo' });
}
