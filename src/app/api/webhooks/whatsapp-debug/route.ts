import { NextRequest, NextResponse } from 'next/server';

/**
 * Endpoint temporário para ver o formato exato do payload do UltraMsg
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('=== ULTRAMSG PAYLOAD DEBUG ===');
    console.log('Headers:', Object.fromEntries(request.headers.entries()));
    console.log('Body:', JSON.stringify(body, null, 2));
    console.log('===========================');
    
    return NextResponse.json({ 
      received: true, 
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
