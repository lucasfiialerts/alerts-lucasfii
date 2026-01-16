"use client";

import { useCallback, useEffect, useState } from 'react';
import { Bell, BellOff, Plus, TrendingDown, TrendingUp } from 'lucide-react';

import { addFiiToWatchlist } from '@/actions/add-fii-to-watchlist';
import { getUserFiiWatchlist } from '@/actions/get-user-fii-watchlist';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';

interface FiiQuote {
  ticker: string;
  name: string;
  price: number;
  variation: number;
  formattedPrice: string;
  formattedVariation: string;
  emoji: string;
}

interface UserFii {
  id: string;
  ticker: string;
  name: string;
  notificationsEnabled: boolean;
  priceAlertEnabled: boolean;
  minVariationPercent: string;
  alertFrequency: string;
  createdAt: Date;
}

export function FiiWatchlistManager() {
  const [fiis, setFiis] = useState<UserFii[]>([]);
  const [quotes, setQuotes] = useState<FiiQuote[]>([]);
  const [newTicker, setNewTicker] = useState('');
  const [loading, setLoading] = useState(false);
  const [addingFii, setAddingFii] = useState(false);

  // Carregar cotações
  const loadQuotes = useCallback(async (tickers: string[]) => {
    try {
      const response = await fetch(`/api/fii/quotes?tickers=${tickers.join(',')}`);
      const result = await response.json();
      
      if (result.success) {
        setQuotes(result.data);
      }
    } catch (error) {
      console.error('Erro ao carregar cotações:', error);
    }
  }, []);

  // Carregar watchlist do usuário
  const loadWatchlist = useCallback(async () => {
    try {
      setLoading(true);
      const result = await getUserFiiWatchlist();
      
      if (result.success && result.fiis) {
        setFiis(result.fiis);
        
        // Buscar cotações atuais
        if (result.fiis.length > 0) {
          await loadQuotes(result.fiis.map(f => f.ticker));
        }
      }
    } catch (error) {
      console.error('Erro ao carregar watchlist:', error);
    } finally {
      setLoading(false);
    }
  }, [loadQuotes]);

  // Adicionar FII à watchlist
  const handleAddFii = async () => {
    if (!newTicker.trim()) return;
    
    try {
      setAddingFii(true);
      const result = await addFiiToWatchlist(newTicker.trim());
      
      if (result.success) {
        setNewTicker('');
        await loadWatchlist(); // Recarregar lista
        alert(result.message);
      } else {
        console.error('❌ Erro ao adicionar FII:', result);
        alert(result.message || 'Erro ao adicionar FII');
      }
    } catch (error) {
      console.error('❌ Erro ao adicionar FII:', error);
      alert('Erro ao adicionar FII. Tente novamente.');
    } finally {
      setAddingFii(false);
    }
  };

  // Encontrar cotação de um FII
  const getQuoteForTicker = (ticker: string): FiiQuote | null => {
    return quotes.find(q => q.ticker === ticker) || null;
  };

  useEffect(() => {
    loadWatchlist();
  }, [loadWatchlist]);

  // Auto-refresh das cotações a cada 2 minutos
  useEffect(() => {
    if (fiis.length > 0) {
      const interval = setInterval(() => {
        loadQuotes(fiis.map(f => f.ticker));
      }, 2 * 60 * 1000);

      return () => clearInterval(interval);
    }
  }, [fiis, loadQuotes]);

  return (
    <div className="space-y-6">
      {/* Adicionar novo FII */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Adicionar FII
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Digite o código do FII (ex: KNIP11)"
              value={newTicker}
              onChange={(e) => setNewTicker(e.target.value.toUpperCase())}
              onKeyPress={(e) => e.key === 'Enter' && handleAddFii()}
              className="flex-1"
            />
            <Button 
              onClick={handleAddFii} 
              disabled={addingFii || !newTicker.trim()}
            >
              {addingFii ? 'Adicionando...' : 'Adicionar'}
            </Button>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Você receberá alertas no WhatsApp quando houver variações significativas no preço
          </p>
        </CardContent>
      </Card>

      {/* Lista de FIIs */}
      <div className="grid gap-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Seus FIIs ({fiis.length})</h2>
          <Button 
            onClick={loadWatchlist} 
            variant="outline" 
            size="sm"
            disabled={loading}
          >
            {loading ? 'Atualizando...' : 'Atualizar'}
          </Button>
        </div>

        {loading && fiis.length === 0 ? (
          <div className="text-center py-8">Carregando...</div>
        ) : fiis.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-gray-500 mb-4">
                Você ainda não adicionou nenhum FII para acompanhar
              </p>
              <p className="text-sm text-gray-400">
                Adicione alguns FIIs acima para começar a receber alertas
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {fiis.map((fii) => {
              const quote = getQuoteForTicker(fii.ticker);
              
              return (
                <Card key={fii.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-lg">{fii.ticker}</h3>
                          {quote && (
                            <span className="text-lg">
                              {quote.emoji}
                            </span>
                          )}
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-2 line-clamp-1">
                          {fii.name}
                        </p>

                        {quote ? (
                          <div className="flex items-center gap-4 text-sm">
                            <div>
                              <span className="font-semibold text-lg">
                                {quote.formattedPrice}
                              </span>
                            </div>
                            <div className={`flex items-center gap-1 ${
                              quote.variation >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {quote.variation >= 0 ? (
                                <TrendingUp className="w-4 h-4" />
                              ) : (
                                <TrendingDown className="w-4 h-4" />
                              )}
                              <span className="font-medium">
                                {quote.formattedVariation}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="text-sm text-gray-400">
                            Carregando cotação...
                          </div>
                        )}

                        <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
                          <span>
                            Alerta: ≥ {fii.minVariationPercent}%
                          </span>
                          <span>
                            Frequência: {fii.alertFrequency}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2 ml-4">
                        <div className="flex items-center gap-2">
                          {fii.notificationsEnabled ? (
                            <Bell className="w-4 h-4 text-blue-500" />
                          ) : (
                            <BellOff className="w-4 h-4 text-gray-400" />
                          )}
                          <Switch
                            checked={fii.notificationsEnabled}
                            // onCheckedChange={(checked) => updateNotifications(fii.id, checked)}
                            disabled // Por enquanto, desabilitado até implementar a atualização
                          />
                        </div>
                        
                        <span className="text-xs text-gray-400">
                          {fii.notificationsEnabled ? 'Ativo' : 'Pausado'}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {fiis.length > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="text-blue-500 mt-1">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-medium text-blue-900 mb-1">
                  Alertas Automáticos Ativos
                </h3>
                <p className="text-sm text-blue-700">
                  Você receberá mensagens no WhatsApp quando houver variações 
                  significativas nos preços dos seus FIIs. As cotações são 
                  verificadas automaticamente durante o horário de pregão.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
