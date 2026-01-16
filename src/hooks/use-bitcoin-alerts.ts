"use client";

import { useEffect, useState, useCallback, useRef } from "react";

type BitcoinAlert = {
  type: 'rise' | 'fall';
  percentage: number;
  price: number;
  currency: 'USD' | 'BRL';
  timestamp: Date;
};

export function useBitcoinAlerts() {
  const [currentAlert, setCurrentAlert] = useState<BitcoinAlert | null>(null);
  const [lastPrice, setLastPrice] = useState<number | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastCheckRef = useRef<number>(0);

  const checkBitcoinPrice = useCallback(async () => {
    // Evita requisições muito frequentes (mínimo de 30 segundos entre checks)
    const now = Date.now();
    if (now - lastCheckRef.current < 30000) {
      return;
    }
    lastCheckRef.current = now;

    try {
      console.log('🔍 Verificando preço do Bitcoin...');
      
      const response = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd,brl&include_24hr_change=true',
        { 
          signal: AbortSignal.timeout(10000), // 10 segundos timeout
          headers: {
            'Accept': 'application/json',
            'Cache-Control': 'no-cache',
          }
        }
      );
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      const bitcoinData = data.bitcoin;
      
      if (!bitcoinData) {
        throw new Error('Dados do Bitcoin não encontrados');
      }
      
      const currentPriceUSD = bitcoinData.usd;
      const change24h = bitcoinData.usd_24h_change || 0;
      
      console.log(`💰 Bitcoin: $${currentPriceUSD}, Variação 24h: ${change24h.toFixed(2)}%`);
      
      // Se a variação for significativa (mais que 4%), mostra alerta
      if (Math.abs(change24h) >= 4) {
        const alertType = change24h >= 0 ? 'rise' : 'fall';
        const percentage = Math.abs(change24h);
        
        const newAlert: BitcoinAlert = {
          type: alertType,
          percentage,
          price: currentPriceUSD,
          currency: 'USD',
          timestamp: new Date(),
        };
        
        setCurrentAlert(newAlert);
        console.log(`🚨 Alerta Bitcoin: ${alertType} ${percentage.toFixed(2)}%`);
      }
      
      setLastPrice(currentPriceUSD);
      
    } catch (error) {
      console.warn('⚠️ Erro ao verificar Bitcoin:', error);
      
      // Para demonstração, vamos mostrar um alerta simulado apenas uma vez
      if (!currentAlert) {
        const simulatedAlert: BitcoinAlert = {
          type: 'fall',
          percentage: 10.59,
          price: 82003,
          currency: 'USD',
          timestamp: new Date(),
        };
        setCurrentAlert(simulatedAlert);
        console.log('🎭 Mostrando alerta simulado para demonstração');
      }
    }
  }, [currentAlert]);

  const startMonitoring = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    // ⚠️ DESATIVADO: Monitoramento automático movido para cron job oficial
    // O monitoramento agora é feito apenas pelo /api/cron/bitcoin-alerts
    console.log('⚠️ Monitoramento automático desativado - usando apenas cron job oficial');
    
    // Apenas verifica uma vez para mostrar dados atuais (sem alertas)
    checkBitcoinPrice();
    setIsMonitoring(false);
  }, [checkBitcoinPrice]);

  const stopMonitoring = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsMonitoring(false);
    console.log('⏹️ Monitoramento Bitcoin parado');
  }, []);

  const dismissAlert = useCallback(() => {
    setCurrentAlert(null);
    console.log('✖️ Alerta Bitcoin dispensado');
  }, []);

  // Cleanup na desmontagem do componente
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    currentAlert,
    isMonitoring,
    startMonitoring,
    stopMonitoring,
    dismissAlert,
  };
}
