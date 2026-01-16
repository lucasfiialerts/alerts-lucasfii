import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { userFiiFollowTable } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Teste: Diminuindo threshold temporariamente...');
    
    // Temporariamente diminuir o threshold para 0.1% para testar
    await db
      .update(userFiiFollowTable)
      .set({ minVariationPercent: "0.1" })
      .execute();
    
    console.log('✅ Threshold alterado para 0.1% para teste');
    
    // Aguardar alguns segundos e depois processar alertas
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Chamar o endpoint de cron
    const cronResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/cron/fii-alerts`, {
      method: 'POST',
      headers: {
        'x-webhook-secret': process.env.WEBHOOK_SECRET || 'sua-chave-secreta'
      }
    });
    
    const cronResult = await cronResponse.json();
    
    // Restaurar threshold original
    await db
      .update(userFiiFollowTable)
      .set({ minVariationPercent: "1.0" })
      .execute();
    
    console.log('✅ Threshold restaurado para 1.0%');
    
    return NextResponse.json({
      success: true,
      message: 'Teste de threshold concluído',
      cronResult,
      thresholdUsed: '0.1%'
    });
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}