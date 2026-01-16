"use client";

import { useState } from "react";

import { cancelBySubscriptionId } from "@/actions/cancel-by-subscription-id";
import { clearUserPlan } from "@/actions/clear-user-plan";
import { manualActivatePlan } from "@/actions/manual-activate-plan";

export const ManualActivateButtons = () => {
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const handleActivate = async (planType: "basico" | "annualbasico") => {
    setIsLoading(planType);
    setMessage("");
    
    try {
      const result = await manualActivatePlan(planType);
      setMessage(result.message);
      
      // Recarregar a página após 2 segundos
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      setMessage("Erro: " + (error as Error).message);
    } finally {
      setIsLoading(null);
    }
  };

  const handleClearPlan = async () => {
    setIsLoading("clear");
    setMessage("");
    
    try {
      const result = await clearUserPlan();
      setMessage(result.message);
      
      // Recarregar a página após 2 segundos
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      setMessage("Erro: " + (error as Error).message);
    } finally {
      setIsLoading(null);
    }
  };

  const handleCancelBySubscriptionId = async () => {
    setIsLoading("cancel-sub");
    setMessage("");
    
    try {
      // Usar o ID da assinatura atual dos logs
      const subscriptionId = "sub_1SEWIqGgYnQjfKBaIOO1EgRP";
      const result = await cancelBySubscriptionId(subscriptionId);
      setMessage(result.message);
      
      // Recarregar a página após 2 segundos
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      setMessage("Erro: " + (error as Error).message);
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-4 flex-wrap">
        <button
          onClick={() => handleActivate("basico")}
          disabled={isLoading === "basico"}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
        >
          {isLoading === "basico" ? "Ativando..." : "Ativar BÁSICO"}
        </button>
        
        <button
          onClick={() => handleActivate("annualbasico")}
          disabled={isLoading === "annualbasico"}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading === "annualbasico" ? "Ativando..." : "Ativar Anual BÁSICO"}
        </button>

        <button
          onClick={handleClearPlan}
          disabled={isLoading === "clear"}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
        >
          {isLoading === "clear" ? "Limpando..." : "Limpar Plano"}
        </button>

        <button
          onClick={handleCancelBySubscriptionId}
          disabled={isLoading === "cancel-sub"}
          className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50"
        >
          {isLoading === "cancel-sub" ? "Cancelando..." : "Cancelar por ID"}
        </button>
      </div>
      
      {message && (
        <div className="p-3 bg-green-100 text-green-800 rounded text-sm">
          {message}
        </div>
      )}
    </div>
  );
};
