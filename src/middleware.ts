import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Adicionar headers para endpoints de cron
  if (request.nextUrl.pathname.startsWith('/api/cron')) {
    const response = NextResponse.next();
    
    // Headers para evitar cache em cron jobs
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    
    return response;
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: '/api/cron/:path*'
};
