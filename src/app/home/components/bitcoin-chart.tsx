"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

type BitcoinPrice = {
  current_price: number;
  price_change_24h: number;
  price_change_percentage_24h: number;
  market_cap: number;
  volume_24h: number;
};

type PricePoint = {
  time: string;
  price: number;
};

export default function BitcoinChart() {
  const [bitcoinData, setBitcoinData] = useState<BitcoinPrice | null>(null);
  const [priceHistory, setPriceHistory] = useState<PricePoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [currency, setCurrency] = useState<'usd' | 'brl'>('usd');
  const [dataSource, setDataSource] = useState<'api' | 'simulated'>('api');

  const loadBitcoinData = async () => {
    setLoading(true);
    console.log(`🔄 Carregando dados Bitcoin em ${currency.toUpperCase()}...`);
    
    try {
      let currentDataLoaded = false;
      let historyDataLoaded = false;

      // Tenta buscar dados atuais com timeout e retry
      try {
        console.log('📊 Buscando preço atual...');
        const currentResponse = await fetch(
          `https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=${currency}&include_24hr_change=true&include_market_cap=true&include_24hr_vol=true`,
          { 
            signal: AbortSignal.timeout(10000), // 10 segundos timeout
            headers: {
              'Accept': 'application/json',
              'Cache-Control': 'no-cache',
            }
          }
        );
        
        if (currentResponse.ok) {
          const currentData = await currentResponse.json();
          const btcData = currentData.bitcoin;
          
          if (btcData && btcData[currency]) {
            setBitcoinData({
              current_price: btcData[currency],
              price_change_24h: btcData[`${currency}_24h_change`] || 0,
              price_change_percentage_24h: btcData[`${currency}_24h_change`] || 0,
              market_cap: btcData[`${currency}_market_cap`] || 0,
              volume_24h: btcData[`${currency}_24h_vol`] || 0,
            });
            currentDataLoaded = true;
            console.log(`✅ Preço atual: ${btcData[currency]} ${currency.toUpperCase()}`);
          }
        } else {
          throw new Error(`HTTP ${currentResponse.status}`);
        }
      } catch (currentError) {
        console.warn('⚠️ Falha ao buscar preço atual:', currentError);
      }

      // Tenta buscar histórico com timeout e retry
      try {
        console.log('📈 Buscando histórico...');
        const historyResponse = await fetch(
          `https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=${currency}&days=7&interval=daily`,
          { 
            signal: AbortSignal.timeout(10000), // 10 segundos timeout
            headers: {
              'Accept': 'application/json',
              'Cache-Control': 'no-cache',
            }
          }
        );
        
        if (historyResponse.ok) {
          const historyData = await historyResponse.json();
          const prices = historyData.prices || [];
          
          if (prices.length > 0) {
            const formattedHistory = prices.slice(-7).map((item: [number, number]) => ({
              time: new Date(item[0]).toLocaleDateString('pt-BR', { 
                day: '2-digit', 
                month: 'short' 
              }),
              price: Math.round(item[1] * 100) / 100,
            }));
            
            setPriceHistory(formattedHistory);
            historyDataLoaded = true;
            console.log(`✅ Histórico carregado: ${formattedHistory.length} pontos`);
          }
        } else {
          throw new Error(`HTTP ${historyResponse.status}`);
        }
      } catch (historyError) {
        console.warn('⚠️ Falha ao buscar histórico:', historyError);
      }

      // Se conseguiu carregar pelo menos um tipo de dado, atualiza timestamp
      if (currentDataLoaded || historyDataLoaded) {
        setLastUpdate(new Date());
        setDataSource('api');
        console.log('✅ Dados Bitcoin carregados com sucesso');
        setLoading(false);
        return;
      }

      // Se chegou aqui, ambas as APIs falharam
      throw new Error('Todas as APIs falharam');
      
    } catch (error) {
      console.warn('🎭 API indisponível, usando dados simulados:', error);
      
      // Dados simulados realistas baseados na data atual
      const basePrice = currency === 'usd' ? 82000 : 400000;
      const variation = -10.59; // Baseado na imagem do usuário
      
      setBitcoinData({
        current_price: basePrice,
        price_change_24h: basePrice * (variation / 100),
        price_change_percentage_24h: variation,
        market_cap: basePrice * 19500000,
        volume_24h: 130070000000, // 130.07B baseado na imagem
      });
      
      // Histórico simulado realista
      const simulatedHistory = [
        { time: '15 Nov', price: basePrice * 1.12 },
        { time: '16 Nov', price: basePrice * 1.10 },
        { time: '17 Nov', price: basePrice * 1.08 },
        { time: '18 Nov', price: basePrice * 1.05 },
        { time: '19 Nov', price: basePrice * 1.03 },
        { time: '20 Nov', price: basePrice * 1.02 },
        { time: '21 Nov', price: basePrice },
      ];
      setPriceHistory(simulatedHistory);
      setLastUpdate(new Date());
      setDataSource('simulated');
      console.log('🎭 Dados simulados aplicados');
    }
    
    setLoading(false);
  };

  useEffect(() => {
    loadBitcoinData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currency]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency === 'usd' ? 'USD' : 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  };

  const CustomTooltip: React.FC<TooltipProps<number, string>> = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-semibold">{label}</p>
          <p className="text-orange-600">
            Bitcoin: {formatPrice(payload[0].value as number)}
          </p>
        </div>
      );
    }
    return null;
  };

  const isPositive = (bitcoinData?.price_change_percentage_24h || 0) >= 0;

  return (
    <Card className="bg-[#1a1a35] border-gray-700/50 shadow-xl">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
            <span className="text-2xl">₿</span>
            Bitcoin
          </CardTitle>
          <div className="flex items-center gap-2">
            {lastUpdate && (
              <span className="text-xs text-gray-400">
                {lastUpdate.toLocaleTimeString('pt-BR', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </span>
            )}
            <div className="flex bg-gray-700 rounded-md p-1">
              <Button
                size="sm"
                variant={currency === 'usd' ? 'default' : 'ghost'}
                onClick={() => setCurrency('usd')}
                className="h-7 px-2 text-xs"
              >
                USD
              </Button>
              <Button
                size="sm"
                variant={currency === 'brl' ? 'default' : 'ghost'}
                onClick={() => setCurrency('brl')}
                className="h-7 px-2 text-xs"
              >
                BRL
              </Button>
            </div>
            <Button
              onClick={loadBitcoinData}
              disabled={loading}
              size="sm"
              className="bg-orange-600 hover:bg-orange-700 text-white h-7 px-3"
            >
              {loading ? "..." : "↻"}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Indicador da fonte dos dados */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${dataSource === 'api' ? 'bg-green-500' : 'bg-orange-500'}`}></div>
            <span className="text-sm text-gray-400">
              {dataSource === 'api' ? 'Dados reais (CoinGecko)' : 'Dados simulados (API indisponível)'}
            </span>
          </div>
          {loading && (
            <span className="text-xs text-orange-400 animate-pulse">
              Carregando...
            </span>
          )}
        </div>

        {bitcoinData && (
          <>
            {/* Preço atual e variação */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-white">
                  {formatPrice(bitcoinData.current_price)}
                </p>
                <p className="text-sm text-gray-400">Preço atual</p>
              </div>
              <div className={`text-right ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                <p className="text-lg font-semibold">
                  {isPositive ? '+' : ''}{bitcoinData.price_change_percentage_24h.toFixed(2)}%
                </p>
                <p className="text-sm">
                  {isPositive ? '+' : ''}{formatPrice(bitcoinData.price_change_24h)}
                </p>
              </div>
            </div>
          </>
        )}

        {/* Gráfico de Histórico de Preços */}
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={priceHistory} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
              <defs>
                <linearGradient id="bitcoinGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F97316" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#F97316" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="time" 
                stroke="#9CA3AF"
                fontSize={11}
                tick={{ fill: '#9CA3AF' }}
              />
              <YAxis 
                stroke="#9CA3AF"
                fontSize={11}
                tick={{ fill: '#9CA3AF' }}
                tickFormatter={(value) => {
                  if (value >= 1000000) return `${(value / 1000000).toFixed(0)}M`;
                  if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
                  return value.toFixed(0);
                }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="price"
                stroke="#F97316"
                strokeWidth={2.5}
                fill="url(#bitcoinGradient)"
                dot={{ fill: "#F97316", r: 4 }}
                activeDot={{ r: 5, fill: "#EA580C" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {loading && (
          <div className="text-center text-gray-400 text-sm py-2">
            Carregando dados do Bitcoin...
          </div>
        )}
      </CardContent>
    </Card>
  );
}