/**
 * 🔄 Endpoint de Cron para Resumos Automáticos de FIIs com IA
 * 
 * Este endpoint é chamado pelo EasyCron para gerar resumos diários
 * Combina dados de BRAPI + FNET + Status Invest e usa IA para análise
 */

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutos

export async function POST(request: Request) {
    try {
        // Verificar autenticação
        const authHeader = request.headers.get('authorization');
        const cronSecret = process.env.CRON_SECRET;

        if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
            return NextResponse.json(
                { error: 'Não autorizado' },
                { status: 401 }
            );
        }

        console.log('🤖 Iniciando cron de resumos FII:', new Date().toISOString());

        // Executar script de resumos
        const { executarCronResumos } = require('@/../../scripts/cron-resumos-diarios');
        const resultado = await executarCronResumos();

        return NextResponse.json({
            success: resultado.success,
            message: 'Resumos processados',
            timestamp: new Date().toISOString(),
            ...resultado
        });

    } catch (error: any) {
        console.error('❌ Erro no cron de resumos:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Erro ao processar resumos',
                details: error?.message
            },
            { status: 500 }
        );
    }
}

export async function GET() {
    return NextResponse.json({
        message: 'Endpoint de resumos automáticos de FIIs',
        method: 'POST',
        authentication: 'Bearer token (opcional)',
        description: 'Gera resumos inteligentes com IA para FIIs mais seguidos',
        sources: ['BRAPI', 'FNET B3', 'Status Invest'],
        ai: 'Google Gemini 2.0'
    });
}
