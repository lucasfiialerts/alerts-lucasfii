"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface PlanRequiredProps {
  message?: string;
  description?: string;
}

export function PlanRequired({ 
  message = "Plano Necessário",
  description = "Para acessar esta funcionalidade, você precisa de um plano ativo." 
}: PlanRequiredProps) {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#0c1117' }}>
      <Card className="w-full max-w-md border-gray-700 shadow-2xl" style={{ backgroundColor: '#1a1a34' }}>
        <CardHeader className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-orange-500/20 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <CardTitle className="text-xl font-bold text-white">
            {message}
          </CardTitle>
          <CardDescription className="text-gray-300">
            {description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-lg">
            <h3 className="font-medium text-blue-300 mb-3 flex items-center gap-2">
              <span className="text-lg">🚀</span>
              Benefícios do plano ativo:
            </h3>
            <ul className="text-sm text-blue-200 space-y-2">
              <li className="flex items-center gap-2">
                <span className="w-1 h-1 bg-blue-400 rounded-full"></span>
                Alertas personalizados para FIIs
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1 h-1 bg-blue-400 rounded-full"></span>
                Monitoramento em tempo real
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1 h-1 bg-blue-400 rounded-full"></span>
                Relatórios detalhados
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1 h-1 bg-blue-400 rounded-full"></span>
                Suporte
              </li>
            </ul>
          </div>
          <div className="space-y-3">
            <Button 
              onClick={() => router.push("/planos")}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 cursor-pointer hover:shadow-lg"
            >
              Ver Planos Disponíveis
            </Button>
            <Button 
              onClick={() => router.push("/home")}
              variant="outline"
              className="w-full border-gray-600 text-black-300 hover:text-white hover:bg-gray-700 hover:border-black-500 font-medium py-3 px-6 rounded-lg transition-all duration-200 cursor-pointer"
            >
              Voltar ao Início
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
