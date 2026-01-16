"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

type BitcoinAlert = {
  type: 'rise' | 'fall';
  percentage: number;
  price: number;
  currency: 'USD' | 'BRL';
  timestamp: Date;
};

interface BitcoinAlertCardProps {
  alert: BitcoinAlert;
  onDismiss: () => void;
}

export function BitcoinAlertCard({ alert, onDismiss }: BitcoinAlertCardProps) {
  const isRise = alert.type === 'rise';
  const bgColor = isRise ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30';
  const textColor = isRise ? 'text-green-200' : 'text-red-200';
  const accentColor = isRise ? 'text-green-300' : 'text-red-300';
  const icon = isRise ? '📈' : '📉';
  const action = isRise ? 'subiu' : 'caiu';
  const emoji = isRise ? '🚀' : '⚠️';

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const timeAgo = () => {
    const now = new Date();
    const diff = Math.floor((now.getTime() - alert.timestamp.getTime()) / 1000);
    
    if (diff < 60) return 'agora';
    if (diff < 3600) return `${Math.floor(diff / 60)} min atrás`;
    return `${Math.floor(diff / 3600)}h atrás`;
  };

  return (
    <div className={`${bgColor} border rounded-lg p-4 relative animate-in slide-in-from-top-2 duration-500`}>
      <Button
        onClick={onDismiss}
        size="sm"
        variant="ghost"
        className="absolute top-2 right-2 h-6 w-6 p-0 text-gray-400 hover:text-white"
      >
        <X className="h-4 w-4" />
      </Button>
      
      <div className="flex items-start gap-3 pr-8">
        <div className="flex-shrink-0">
          <div className={`w-8 h-8 ${isRise ? 'bg-green-500' : 'bg-red-500'} rounded-sm flex items-center justify-center`}>
            <span className="text-white text-lg">{emoji}</span>
          </div>
        </div>
        
        <div className="flex-1">
          <p className={`${textColor} text-sm leading-relaxed`}>
            <span className="font-semibold">Atenção:</span> Variação do Bitcoin em{" "}
            <span className={`font-bold ${accentColor}`}>
              {isRise ? '+' : ''}{alert.percentage.toFixed(2)}%
            </span>{" "}
            nas últimas 24 horas {icon}
          </p>
          
          <div className="flex items-center justify-between mt-2">
            <p className={`text-xs ${textColor} opacity-80`}>
              Preço atual: <span className="font-medium">{formatPrice(alert.price)}</span>
            </p>
            <div className="flex items-center gap-2">
              <p className={`text-xs ${textColor} opacity-60`}>
                {timeAgo()}
              </p>
              <div className={`w-2 h-2 rounded-full ${isRise ? 'bg-green-400' : 'bg-red-400'} animate-pulse`}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
