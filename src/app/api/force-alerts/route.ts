import { NextResponse } from 'next/server';
import { fiiAlertService } from '@/lib/fii-alerts';
import { brapiService } from '@/lib/brapi';
import { db } from '@/db';
import { userFiiFollowTable, fiiFundTable, userTable } from '@/db/schema';
import { and, eq } from 'drizzle-orm';

/**
 * Força alertas ignorando proteção anti-spam - só para testes
 */
export async function POST() {
  try {
    console.log('🚨 FORÇANDO ALERTAS REAIS - Ignorando proteção anti-spam...');
    
    // Buscar usuários com alertas habilitados
    const usersWithAlerts = await db
      .select({
        userId: userFiiFollowTable.userId,
        fundId: userFiiFollowTable.fundId,
        ticker: fiiFundTable.ticker,
        name: fiiFundTable.name,
        minVariationPercent: userFiiFollowTable.minVariationPercent,
        userEmail: userTable.email,
        userPhone: userTable.whatsappNumber,
        userWhatsappVerified: userTable.whatsappVerified,
      })
      .from(userFiiFollowTable)
      .innerJoin(fiiFundTable, eq(userFiiFollowTable.fundId, fiiFundTable.id))
      .innerJoin(userTable, eq(userFiiFollowTable.userId, userTable.id))
      .where(
        and(
          eq(userFiiFollowTable.notificationsEnabled, true),
          eq(userFiiFollowTable.priceAlertEnabled, true),
          eq(userTable.whatsappVerified, true)
        )
      );

    if (usersWithAlerts.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'Nenhum usuário com alertas habilitados encontrado'
      });
    }

    // Buscar cotações únicas
    const uniqueTickers = [...new Set(usersWithAlerts.map(u => u.ticker))];
    console.log(`📊 Buscando cotações para: ${uniqueTickers.join(', ')}`);
    
    const fiiDataList = await brapiService.getFiiData(uniqueTickers);
    
    const alertsToSend = [];
    
    // Processar cada usuário (SEM verificar último alerta)
    for (const userAlert of usersWithAlerts) {
      const fiiData = fiiDataList.find(data => data.symbol === userAlert.ticker);
      
      if (!fiiData) continue;
      
      // Verificar se deve gerar alerta (SEM verificar tempo)
      const threshold = parseFloat(userAlert.minVariationPercent || "0.1");
      const shouldAlert = Math.abs(fiiData.regularMarketChangePercent) >= threshold;
      
      if (shouldAlert) {
        const message = fiiAlertService.createAlertMessage(userAlert.ticker, userAlert.name, fiiData);
        
        alertsToSend.push({
          userId: userAlert.userId,
          userEmail: userAlert.userEmail,
          userPhone: userAlert.userPhone,
          ticker: userAlert.ticker,
          name: userAlert.name,
          price: fiiData.regularMarketPrice,
          variation: fiiData.regularMarketChangePercent,
          message,
        });
      }
    }
    
    console.log(`🚨 ${alertsToSend.length} alertas forçados gerados`);
    
    if (alertsToSend.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Nenhuma variação suficiente para gerar alertas no momento',
        alertsGenerated: 0
      });
    }
    
    // Enviar alertas via WhatsApp
    const results = [];
    for (const alert of alertsToSend) {
      try {
        const whatsappResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/whatsapp/send-alert`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phoneNumber: alert.userPhone,
            message: alert.message,
            userId: alert.userId,
            ticker: alert.ticker,
          }),
        });
        
        if (whatsappResponse.ok) {
          // Registrar no log
          await fiiAlertService.logAlert({
            userId: alert.userId,
            fundId: '', // Será preenchido pelo service
            ticker: alert.ticker,
            name: alert.name,
            price: alert.price,
            variation: alert.variation,
            message: alert.message,
            alertType: 'price_variation'
          });
          
          console.log(`✅ Alerta forçado enviado: ${alert.ticker} para ${alert.userEmail}`);
          results.push({
            ticker: alert.ticker,
            userEmail: alert.userEmail,
            variation: alert.variation,
            status: 'success'
          });
        }
      } catch (error) {
        console.error(`❌ Erro ao enviar alerta forçado para ${alert.userEmail}:`, error);
        results.push({
          ticker: alert.ticker,
          userEmail: alert.userEmail,
          status: 'error'
        });
      }
      
      // Delay entre envios
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    return NextResponse.json({
      success: true,
      message: `Alertas forçados processados: ${results.filter(r => r.status === 'success').length} enviados`,
      alertsGenerated: alertsToSend.length,
      alertsSent: results.filter(r => r.status === 'success').length,
      results
    });
    
  } catch (error) {
    console.error('❌ Erro ao forçar alertas:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}