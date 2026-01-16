"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  TooltipProps,
} from "recharts";

type Point = { date: string; value: number };

// API para dados financeiros reais
const YAHOO_API = "https://query1.finance.yahoo.com/v8/finance/chart";

// Símbolos corretos para Yahoo Finance
const SYMBOLS = {
  IBOV: "^BVSP",
  IFIX: "IFIX11.SA", 
  SP500: "^GSPC"
};

async function fetchYahooHistory(symbol: string): Promise<Point[] | null> {
  try {
    console.log(`[Yahoo] Fetching ${symbol} at ${new Date().toISOString()}`);
    const res = await fetch(`${YAHOO_API}/${encodeURIComponent(symbol)}?interval=1d&range=7d&timestamp=${Date.now()}`);
    if (!res.ok) {
      console.log(`[Yahoo] HTTP ${res.status} for ${symbol}`);
      return null;
    }
    const json = await res.json();
    
    const result = json?.chart?.result?.[0];
    if (!result) {
      console.log(`[Yahoo] No result data for ${symbol}`);
      return null;
    }
    
    const timestamps = result.timestamp;
    const closes = result.indicators?.quote?.[0]?.close;
    
    if (!timestamps || !closes) {
      console.log(`[Yahoo] Missing timestamps/closes for ${symbol}`);
      return null;
    }
    
    const points: Point[] = [];
    for (let i = 0; i < Math.min(timestamps.length, closes.length); i++) {
      if (closes[i] !== null && !isNaN(closes[i])) {
        const date = new Date(timestamps[i] * 1000).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
        points.push({ date, value: Number(closes[i].toFixed(2)) });
      }
    }
    
    console.log(`[Yahoo] Got ${points.length} points for ${symbol}, latest: ${points[points.length-1]?.value}`);
    return points.length > 0 ? points.slice(-7) : null;
  } catch (error) {
    console.log(`[Yahoo] Error for ${symbol}:`, error);
    return null;
  }
}

// Função para gerar dados realistas como fallback
function generateRealisticData(index: 'IBOV' | 'IFIX' | 'SP500'): Point[] {
  const baseValues = {
    IBOV: 120500, // Ibovespa atual
    IFIX: 3250,   // IFIX atual
    SP500: 4800   // S&P 500 atual
  };
  
  const base = baseValues[index];
  const days = ['18 Nov', '19 Nov', '20 Nov', '21 Nov', '22 Nov', '25 Nov', '26 Nov'];
  
  const points: Point[] = [];
  let currentValue = base;
  
  days.forEach((date, i) => {
    // Variação realista de -2% a +2%
    const change = (Math.random() - 0.5) * 0.04;
    currentValue = currentValue * (1 + change);
    points.push({ 
      date, 
      value: Math.round(currentValue * (index === 'IFIX' ? 100 : 1)) / (index === 'IFIX' ? 100 : 1)
    });
  });
  
  return points;
}

export default function IndicesChart() {
  const [selected, setSelected] = useState<'IBOV' | 'IFIX' | 'SP500'>('IBOV');
  const [data, setData] = useState<Record<string, Point[]>>({});
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [dataSource, setDataSource] = useState<'yahoo' | 'simulated'>('simulated');

  // Carrega dados ao mudar índice ou ao montar componente
  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  const loadData = async () => {
    console.log(`Loading data for ${selected} at ${new Date().toISOString()}`);
    setLoading(true);
    
    // Primeiro tenta Yahoo Finance
    const yahooData = await fetchYahooHistory(SYMBOLS[selected]);
    if (yahooData && yahooData.length > 0) {
      setData(prev => ({ ...prev, [selected]: yahooData }));
      setDataSource('yahoo');
      setLastUpdate(new Date());
      console.log(`✅ Yahoo data loaded for ${selected}:`, yahooData[yahooData.length - 1]);
    } else {
      // Fallback: dados simulados baseados em valores reais
      const simulatedData = generateRealisticData(selected);
      setData(prev => ({ ...prev, [selected]: simulatedData }));
      setDataSource('simulated');
      setLastUpdate(new Date());
      console.log(`⚠️ Using simulated data for ${selected}:`, simulatedData[simulatedData.length - 1]);
    }
    
    setLoading(false);
  };

  const handleRefresh = () => {
    // Força novo carregamento
    loadData();
  };

  const currentData = data[selected] || [];
  const currentPrice = currentData[currentData.length - 1]?.value || 0;
  const previousPrice = currentData[currentData.length - 2]?.value || currentPrice;
  const change = currentPrice - previousPrice;
  const changePercent = previousPrice > 0 ? (change / previousPrice) * 100 : 0;

  const CustomTooltip: React.FC<TooltipProps<number, string>> = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-semibold">{label}</p>
          <p className="text-blue-600">
            {selected}: {payload[0].value?.toLocaleString('pt-BR', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full space-y-4">
      {/* Header com título e botão de refresh */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Índices do Mercado</h3>
        <div className="flex items-center gap-2">
          {lastUpdate && (
            <span className="text-xs text-gray-500">
              Atualizado: {lastUpdate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <Button
            onClick={handleRefresh}
            disabled={loading}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {loading ? "Carregando..." : "Atualizar"}
          </Button>
        </div>
      </div>

      {/* Indicador da fonte dos dados */}
      <div className="flex items-center gap-2">
        <div className={`w-3 h-3 rounded-full ${dataSource === 'yahoo' ? 'bg-green-500' : 'bg-orange-500'}`}></div>
        <span className="text-sm text-gray-600">
          {dataSource === 'yahoo' ? 'Dados reais (Yahoo Finance)' : 'Dados simulados (APIs indisponíveis)'}
        </span>
      </div>

      {/* Botões de seleção */}
      <div className="flex gap-2 flex-wrap">
        {Object.keys(SYMBOLS).map((index) => (
          <Button
            key={index}
            variant={selected === index ? "default" : "outline"}
            onClick={() => setSelected(index as keyof typeof SYMBOLS)}
            className={selected === index 
              ? "bg-blue-600 hover:bg-blue-700 text-white" 
              : "border-blue-600 text-blue-600 hover:bg-blue-50"
            }
          >
            {index}
          </Button>
        ))}
      </div>

      {/* Informações do preço atual */}
      {currentData.length > 0 && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {currentPrice.toLocaleString('pt-BR', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}
              </p>
              <p className="text-sm text-gray-500">{selected}</p>
            </div>
            <div className={`text-right ${changePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              <p className="text-lg font-semibold">
                {changePercent >= 0 ? '+' : ''}{changePercent.toFixed(2)}%
              </p>
              <p className="text-sm">
                {change >= 0 ? '+' : ''}{change.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Gráfico */}
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={currentData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis 
              dataKey="date" 
              stroke="#6B7280"
              fontSize={12}
            />
            <YAxis 
              stroke="#6B7280"
              fontSize={12}
              tickFormatter={(value) => value.toLocaleString('pt-BR')}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#3B82F6"
              strokeWidth={2}
              fill="url(#colorValue)"
              dot={{ fill: "#3B82F6", r: 4 }}
              activeDot={{ r: 6, fill: "#1D4ED8" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      
      {loading && (
        <div className="text-center text-gray-500 text-sm">
          Carregando dados...
        </div>
      )}
    </div>
  );
}
