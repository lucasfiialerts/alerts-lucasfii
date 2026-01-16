/**
 * 🔄 Endpoint de Cron para Processamento de PDFs
 * 
 * Este endpoint pode ser chamado pelo EasyCron ou qualquer serviço de cron
 * para processar automaticamente PDFs e gerar resumos
 */

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutos timeout

export async function POST(request: Request) {
    try {
        // Verificar autenticação (opcional mas recomendado)
        const authHeader = request.headers.get('authorization');
        const cronSecret = process.env.CRON_SECRET;

        if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
            return NextResponse.json(
                { error: 'Não autorizado' },
                { status: 401 }
            );
        }

        console.log('🤖 Cron iniciado:', new Date().toISOString());

        // Importar e executar o script
        const { main } = require('@/../../scripts/pdf-summary-cron');
        const result = await main();

        return NextResponse.json({
            success: true,
            message: 'PDFs processados com sucesso',
            timestamp: new Date().toISOString(),
            result
        });

    } catch (error: any) {
        console.error('❌ Erro no cron:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Erro ao processar PDFs',
                details: error?.message
            },
            { status: 500 }
        );
    }
}

export async function GET() {
    return NextResponse.json({
        message: 'Endpoint de processamento de PDFs',
        method: 'POST',
        authentication: 'Bearer token (opcional)',
        description: 'Processa PDFs da pasta configurada e gera resumos com IA'
    });
}
