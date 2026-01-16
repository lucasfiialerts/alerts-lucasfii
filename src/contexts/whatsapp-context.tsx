"use client";

import { createContext, ReactNode,useCallback, useContext, useEffect, useState } from "react";

import { getUserWhatsAppData } from "@/actions/get-user-whatsapp-data";

interface WhatsAppContextType {
  isConnected: boolean;
  isLoading: boolean;
  refreshStatus: () => Promise<void>;
}

const WhatsAppContext = createContext<WhatsAppContextType | undefined>(undefined);

interface WhatsAppProviderProps {
  children: ReactNode;
}

export function WhatsAppProvider({ children }: WhatsAppProviderProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const refreshStatus = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getUserWhatsAppData();
      
      // Se houve erro na action, trata como desconectado
      if ('error' in data && data.error) {
        console.warn("Aviso ao verificar status do WhatsApp:", data.error);
        setIsConnected(false);
        return;
      }
      
      // WhatsApp está conectado se há um número E está verificado
      setIsConnected(!!(data.whatsappNumber && data.whatsappVerified));
    } catch (error) {
      console.error("Erro ao verificar status do WhatsApp:", error);
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  const value: WhatsAppContextType = {
    isConnected,
    isLoading,
    refreshStatus,
  };

  return (
    <WhatsAppContext.Provider value={value}>
      {children}
    </WhatsAppContext.Provider>
  );
}

export function useWhatsAppContext() {
  const context = useContext(WhatsAppContext);
  if (context === undefined) {
    throw new Error("useWhatsAppContext must be used within a WhatsAppProvider");
  }
  return context;
}