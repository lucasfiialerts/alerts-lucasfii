import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { userFiiFollowTable, fiiFundTable, userTable } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { fiiAlertService } from '@/lib/fii-alerts';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Debug FII Alerts - Verificando sistema...');
    
    const now = new Date();
    const hour = now.getHours();
    const dayOfWeek = now.getDay();
    const isMarketHours = dayOfWeek >= 1 && dayOfWeek <= 5 && hour >= 9 && hour <= 17;
    
    console.log(`⏰ Horário atual: ${now.toLocaleString('pt-BR')}`);
    console.log(`📅 Dia da semana: ${dayOfWeek} (1=seg, 2=ter, etc.)`);
    console.log(`🕐 Hora: ${hour}h`);
    console.log(`📊 Horário de pregão: ${isMarketHours ? 'SIM' : 'NÃO'}`);
    
    // 1. Verificar usuários seguindo FIIs
    const follows = await db
      .select({
        userId: userFiiFollowTable.userId,
        ticker: fiiFundTable.ticker,
        name: fiiFundTable.name,
        notificationsEnabled: userFiiFollowTable.notificationsEnabled,
        priceAlertEnabled: userFiiFollowTable.priceAlertEnabled
      })
      .from(userFiiFollowTable)
      .innerJoin(fiiFundTable, eq(userFiiFollowTable.fundId, fiiFundTable.id));
    
    console.log(`👥 Total de follows: ${follows.length}`);
    
    // 2. Processar alertas (só se estiver em horário de pregão)
    let alerts = [];
    if (isMarketHours) {
      alerts = await fiiAlertService.processAllAlerts();
      console.log(`🚨 Alertas gerados: ${alerts.length}`);
    }
    
    // 3. Verificar usuários com WhatsApp configurado
    const users = await db.select().from(userTable);
    const usersWithWhatsapp = users.filter(u => u.whatsappNumber && u.whatsappVerified);
    
    const debug = {
      timestamp: now.toISOString(),
      localTime: now.toLocaleString('pt-BR'),
      hour,
      dayOfWeek,
      isMarketHours,
      totalUsers: users.length,
      usersWithWhatsapp: usersWithWhatsapp.length,
      totalFollows: follows.length,
      alertsGenerated: alerts.length,
      followDetails: follows.map(f => ({
        userId: f.userId,
        ticker: f.ticker,
        name: f.name,
        notificationsEnabled: f.notificationsEnabled,
        priceAlertEnabled: f.priceAlertEnabled
      })),
      whatsappUsers: usersWithWhatsapp.map(u => ({
        id: u.id,
        email: u.email,
        whatsappNumber: u.whatsappNumber,
        whatsappVerified: u.whatsappVerified
      }))
    };
    
    return NextResponse.json({
      success: true,
      debug,
      message: 'Debug completo do sistema de alertas'
    });
    
  } catch (error) {
    console.error('❌ Erro no debug:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}