"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Send, Trash2, TrendingUp } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { MyFollowStatsCardsSkeletonGrid } from "./my-follow-stats-skeleton";
import { LoadingSpinner } from "@/components/common/loading-spinner";

interface Fund {
  id: string;
  ticker: string;
  name: string;
}

interface Follow {
  id: string;
  notificationsEnabled: boolean;
  createdAt: string;
  fund: Fund;
}

interface SearchFund {
  id: string;
  ticker: string;
  name: string;
}

interface Session {
  user?: {
    name?: string;
    email?: string;
    image?: string;
  };
}

interface MyFollowContentProps {
  session: Session;
}

export function MyFollowContent({ session }: MyFollowContentProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTerm, setFilterTerm] = useState(""); // Para filtrar ativos seguidos
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all"); // Filtro de status
  const queryClient = useQueryClient();

  // Query para buscar fundos seguidos
  const { data: follows, isLoading: isLoadingFollows } = useQuery({
    queryKey: ['fii-follows'],
    queryFn: async () => {
      const response = await fetch('/api/fii/follow');
      if (!response.ok) throw new Error('Erro ao carregar fundos seguidos');
      const data = await response.json();
      return data.follows as Follow[];
    }
  });

  // Query para buscar fundos disponíveis
  const { data: searchResults, isLoading: isSearching } = useQuery({
    queryKey: ['fii-search', searchTerm],
    queryFn: async () => {
      if (!searchTerm.trim()) return [];
      const response = await fetch(`/api/fii/funds?search=${encodeURIComponent(searchTerm)}&limit=20`);
      if (!response.ok) throw new Error('Erro ao buscar fundos');
      const data = await response.json();
      return data.funds as SearchFund[];
    },
    enabled: searchTerm.length >= 2
  });

  // Mutation para seguir um fundo
  const followFundMutation = useMutation({
    mutationFn: async ({ fundId, ticker, name }: { fundId: string; ticker?: string; name?: string }) => {
      const response = await fetch('/api/fii/follow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fundId, ticker, name })
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao seguir fundo');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fii-follows'] });
      setIsDialogOpen(false);
      setSearchTerm("");
      toast.success('Fundo adicionado ao acompanhamento!');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  // Mutation para seguir múltiplos fundos
  const followMultipleFundsMutation = useMutation({
    mutationFn: async (tickers: string[]) => {
      const results = [];
      const errors = [];
      
      for (const ticker of tickers) {
        try {
          // Buscar o fundo pelo ticker
          const searchResponse = await fetch(`/api/fii/funds?search=${encodeURIComponent(ticker)}&limit=1`);
          if (!searchResponse.ok) {
            errors.push(`${ticker}: Erro ao buscar`);
            continue;
          }
          
          const searchData = await searchResponse.json();
          const fund = searchData.funds?.[0];
          
          if (!fund) {
            errors.push(`${ticker}: Não encontrado`);
            continue;
          }
          
          // Seguir o fundo
          const followResponse = await fetch('/api/fii/follow', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fundId: fund.id, ticker: fund.ticker, name: fund.name })
          });
          
          if (!followResponse.ok) {
            const error = await followResponse.json();
            errors.push(`${ticker}: ${error.error || 'Erro ao seguir'}`);
            continue;
          }
          
          results.push(ticker);
        } catch (error) {
          errors.push(`${ticker}: Erro desconhecido`);
        }
      }
      
      return { results, errors };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['fii-follows'] });
      setIsDialogOpen(false);
      setSearchTerm("");
      
      if (data.results.length > 0) {
        toast.success(`${data.results.length} ${data.results.length === 1 ? 'fundo adicionado' : 'fundos adicionados'} com sucesso!`);
      }
      
      if (data.errors.length > 0) {
        toast.error(`Erros: ${data.errors.join(', ')}`);
      }
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  // Mutation para toggle de notificações
  const toggleNotificationMutation = useMutation({
    mutationFn: async ({ followId, enabled }: { followId: string; enabled: boolean }) => {
      const response = await fetch('/api/fii/follow/toggle', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ followId, notificationsEnabled: enabled })
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao atualizar notificações');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fii-follows'] });
      toast.success('Notificações atualizadas!');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  // Mutation para deixar de seguir um fundo
  const unfollowFundMutation = useMutation({
    mutationFn: async (followId: string) => {
      const response = await fetch('/api/fii/follow', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ followId })
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao deixar de seguir fundo');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fii-follows'] });
      toast.success('Fundo removido do acompanhamento!');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  // Mutation para sincronizar fundos
  const syncFundsMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/fii/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao sincronizar fundos');
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['fii-search'] });
      toast.success(`${data.synced || 0} fundos sincronizados com sucesso!`);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  // Mutation para enviar relatório de teste
  const sendTestReportMutation = useMutation({
    mutationFn: async (fundId: string) => {
      const response = await fetch('/api/fii/notify', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fundId })
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao enviar relatório');
      }
      return response.json();
    },
    onSuccess: () => {
      toast.success('Relatório de teste enviado via WhatsApp!');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  // Handlers
  const handleFollowFund = (fund: { id: string; ticker: string; name: string }) => {
    followFundMutation.mutate({
      fundId: fund.id,
      ticker: fund.ticker,
      name: fund.name
    });
  };

  const handleFollowMultipleFunds = () => {
    // Separar por vírgula e limpar espaços
    const tickers = searchTerm
      .split(',')
      .map(t => t.trim().toUpperCase())
      .filter(t => t.length > 0);
    
    if (tickers.length === 0) {
      toast.error('Digite pelo menos um ticker');
      return;
    }
    
    if (tickers.length === 1) {
      // Se for apenas um, usa a busca normal
      return;
    }
    
    followMultipleFundsMutation.mutate(tickers);
  };

  const handleSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const tickers = searchTerm
        .split(',')
        .map(t => t.trim().toUpperCase())
        .filter(t => t.length > 0);
      
      if (tickers.length > 1) {
        e.preventDefault();
        handleFollowMultipleFunds();
      }
    }
  };

  const handleToggleNotifications = (followId: string, enabled: boolean) => {
    toggleNotificationMutation.mutate({ followId, enabled });
  };

  const handleUnfollowFund = (followId: string) => {
    unfollowFundMutation.mutate(followId);
  };

  const handleSyncFunds = () => {
    syncFundsMutation.mutate();
  };

  const handleSendTestReport = (ticker: string) => {
    // Encontrar o fund id pelo ticker
    const fund = follows?.find(f => f.fund.ticker === ticker)?.fund;
    if (fund) {
      sendTestReportMutation.mutate(fund.id);
    }
  };

  // Filtrar fundos já seguidos dos resultados da busca
  const followedFundIds = follows?.map(f => f.fund.id) || [];
  const availableFunds = searchResults?.filter(fund => !followedFundIds.includes(fund.id)) || [];

  // Filtrar ativos seguidos pela pesquisa e status
  const filteredFollows = follows?.filter(follow => {
    // Filtro por texto (ticker ou nome)
    let matchesText = true;
    if (filterTerm.trim()) {
      const searchLower = filterTerm.toLowerCase();
      matchesText = (
        follow.fund.ticker.toLowerCase().includes(searchLower) ||
        follow.fund.name.toLowerCase().includes(searchLower)
      );
    }

    // Filtro por status de notificação
    let matchesStatus = true;
    if (statusFilter === "active") {
      matchesStatus = follow.notificationsEnabled;
    } else if (statusFilter === "inactive") {
      matchesStatus = !follow.notificationsEnabled;
    }
    // Se statusFilter === "all", não filtra por status

    return matchesText && matchesStatus;
  }) || [];

  if (isLoadingFollows) {
    return (
      <main className="flex-1 p-3 sm:p-4 md:p-6 pb-24 md:pb-6 min-h-screen overflow-hidden">
        <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
          <LoadingSpinner />
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 p-3 sm:p-4 md:p-6 pb-24 md:pb-6 min-h-screen overflow-hidden">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Page Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl">Ativos para acompanhamento</h1>
          <br />
        </div>

        {/* Stats Cards */}
        {isLoadingFollows ? (
          <MyFollowStatsCardsSkeletonGrid />
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
            <Card className="bg-slate-900/70 backdrop-blur-xl border-slate-600/30 shadow-2xl hover:bg-slate-900/80 transition-all duration-300 hover:border-blue-500/40">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 sm:p-5">
                <CardTitle className="text-sm sm:text-base font-semibold text-gray-300 tracking-wide">
                  Total de Fundos
                </CardTitle>
                <TrendingUp className="w-5 h-5 text-blue-400" />
              </CardHeader>
              <CardContent className="p-4 sm:p-5 pt-0">
                <div className="text-2xl sm:text-3xl font-bold text-white mb-1">
                  {filterTerm ? filteredFollows.length : (follows?.length || 0)}
                </div>
                <p className="text-sm text-gray-400 font-medium">
                  {filterTerm ? "Encontrados" : "Acompanhados"}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/70 backdrop-blur-xl border-slate-600/30 shadow-2xl hover:bg-slate-900/80 transition-all duration-300 hover:border-blue-500/40">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 sm:p-5">
                <CardTitle className="text-sm sm:text-base font-semibold text-gray-300 tracking-wide">
                  Notificações Ativas
                </CardTitle>
                <Send className="w-5 h-5 text-green-400" />
              </CardHeader>
              <CardContent className="p-4 sm:p-5 pt-0">
                <div className="text-2xl sm:text-3xl font-bold text-white mb-1">
                  {filterTerm
                    ? filteredFollows.filter(f => f.notificationsEnabled).length
                    : (follows?.filter(f => f.notificationsEnabled).length || 0)
                  }
                </div>
                <p className="text-sm text-gray-400 font-medium">
                  Habilitadas
                </p>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/70 backdrop-blur-xl border-slate-600/30 shadow-2xl hover:bg-slate-900/80 transition-all duration-300 hover:border-blue-500/40 col-span-2 lg:col-span-1">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 sm:p-5">
                <CardTitle className="text-sm sm:text-base font-semibold text-gray-300 tracking-wide">
                  Último Adicionado
                </CardTitle>
                <Plus className="w-5 h-5 text-purple-400" />
              </CardHeader>
              <CardContent className="p-4 sm:p-5 pt-0">
                <div className="text-xl sm:text-2xl font-bold text-white mb-1">
                  {follows && follows.length > 0
                    ? follows.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]?.fund?.ticker || 'Recente'
                    : '--'
                  }
                </div>
                <p className="text-sm text-gray-400 font-medium">
                  {follows && follows.length > 0
                    ? new Date(follows.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]?.createdAt).toLocaleDateString('pt-BR')
                    : 'Nenhum'
                  }
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Barra de Ações e Filtros */}
        {follows && follows.length > 0 && (
          <div className="space-y-4">
            {/* Linha 1: Input de busca + Botão Adicionar */}
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
              {/* Input de pesquisa */}
              <div className="relative flex-1 max-w-lg">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por ticker..."
                  value={filterTerm}
                  onChange={(e) => setFilterTerm(e.target.value)}
                  className="pl-10 h-10 bg-[#1a1a35] border-gray-600 text-white placeholder:text-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg"
                />
              </div>

              {/* Botão Adicionar Fundo */}
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full lg:w-auto bg-blue-600 hover:bg-blue-700 text-white h-10 px-4 rounded-lg font-medium">
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Fundo
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg max-w-[95vw] bg-[#1a1a34] border-gray-600 [&>button]:text-gray-300 [&>button]:hover:text-white [&>button]:hover:bg-gray-700">
                  <DialogHeader>
                    <DialogTitle className="text-lg text-white">Adicionar Fundo ao Acompanhamento</DialogTitle>
                    <DialogDescription className="text-sm text-gray-400">
                      Busque por um ticker (ex: VTLT11) ou adicione vários de uma vez separados por vírgula (ex: HGLG11, MXRF11, VISC11) e pressione Enter
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Digite o ticker ou vários separados por vírgula..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyPress={handleSearchKeyPress}
                        className="pl-10 bg-[#2a2a44] border-gray-600 text-white placeholder:text-gray-400 focus:border-blue-500"
                      />
                      {searchTerm.includes(',') && (
                        <div className="mt-2 p-2 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                          <p className="text-xs text-blue-300">
                            💡 Pressione <kbd className="px-1.5 py-0.5 bg-gray-700 rounded text-white">Enter</kbd> para adicionar {searchTerm.split(',').filter(t => t.trim()).length} ativos de uma vez
                          </p>
                        </div>
                      )}
                    </div>

                    {followMultipleFundsMutation.isPending && (
                      <div className="text-center py-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
                        <p className="text-gray-400 mt-2">Adicionando múltiplos fundos...</p>
                      </div>
                    )}

                    {isSearching && !searchTerm.includes(',') && (
                      <div className="text-center py-4">
                        <p className="text-gray-400">Buscando fundos...</p>
                      </div>
                    )}

                    {searchTerm.length >= 2 && !isSearching && !searchTerm.includes(',') && (
                      <div className="max-h-60 overflow-y-auto space-y-2">
                        {availableFunds.length === 0 ? (
                          <div className="text-center py-4">
                            <p className="text-gray-400">Nenhum fundo encontrado</p>
                            <Button
                              variant="outline"
                              size="sm"
                              className="mt-2 bg-[#2a2a44] border-gray-600 text-white hover:bg-[#3a3a54]"
                              onClick={handleSyncFunds}
                              disabled={syncFundsMutation.isPending}
                            >
                              Sincronizar para buscar mais fundos
                            </Button>
                          </div>
                        ) : (
                          availableFunds.map((fund) => (
                            <div
                              key={fund.id}
                              className="flex items-center justify-between p-3 border border-gray-600 rounded-lg hover:bg-[#2a2a44] bg-[#1e1e38]"
                            >
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-base text-white">{fund.ticker}</p>
                              </div>
                              <Button
                                size="sm"
                                onClick={() => handleFollowFund({
                                  id: fund.id,
                                  ticker: fund.ticker,
                                  name: fund.name
                                })}
                                disabled={followFundMutation.isPending}
                                className="shrink-0 bg-blue-600 hover:bg-blue-700"
                              >
                                Seguir
                              </Button>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Linha 2: Filtros de Status */}
            <div className="flex flex-wrap gap-3">
              <Button
                variant={statusFilter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("all")}
                className={`h-9 px-4 rounded-lg font-medium transition-all ${statusFilter === "all"
                  ? "bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
                  : "bg-[#1a1a35] border-gray-600 text-gray-300 hover:bg-[#2a2a45] hover:border-gray-500 hover:text-white"
                  }`}
              >
                Todos
                {follows && (
                  <Badge variant="secondary" className="ml-2 bg-gray-700 text-gray-200 text-xs font-medium">
                    {follows.length}
                  </Badge>
                )}
              </Button>

              <Button
                variant={statusFilter === "active" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("active")}
                className={`h-9 px-4 rounded-lg font-medium transition-all ${statusFilter === "active"
                  ? "bg-green-600 hover:bg-green-700 text-white border-green-600"
                  : "bg-[#1a1a35] border-gray-600 text-gray-300 hover:bg-[#2a2a45] hover:border-gray-500 hover:text-white"
                  }`}
              >
                Ativos
                {follows && (
                  <Badge variant="secondary" className="ml-2 bg-gray-700 text-gray-200 text-xs font-medium">
                    {follows.filter(f => f.notificationsEnabled).length}
                  </Badge>
                )}
              </Button>

              <Button
                variant={statusFilter === "inactive" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("inactive")}
                className={`h-9 px-4 rounded-lg font-medium transition-all ${statusFilter === "inactive"
                  ? "bg-gray-600 hover:bg-gray-700 text-white border-gray-600"
                  : "bg-[#1a1a35] border-gray-600 text-gray-300 hover:bg-[#2a2a45] hover:border-gray-500 hover:text-white"
                  }`}
              >
                Inativos
                {follows && (
                  <Badge variant="secondary" className="ml-2 bg-gray-700 text-gray-200 text-xs font-medium">
                    {follows.filter(f => !f.notificationsEnabled).length}
                  </Badge>
                )}
              </Button>
            </div>

            {/* Contador de resultados */}
            {(filterTerm || statusFilter !== "all") && (
              <div className="px-1">
                <p className="text-sm text-gray-400 font-medium">
                  Mostrando <span className="text-white">{filteredFollows.length}</span> de <span className="text-white">{follows.length}</span> ativos
                  {filterTerm && (
                    <span className="text-gray-500"> • Busca: <span className="text-blue-400 font-medium">&quot;{filterTerm}&quot;</span></span>
                  )}
                  {statusFilter !== "all" && (
                    <span className="text-gray-500"> • Status: <span className="text-green-400 font-medium">{statusFilter === "active" ? "Ativos" : "Inativos"}</span></span>
                  )}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Content Area */}
        {isLoadingFollows ? (
          <Card className="bg-slate-900/70 backdrop-blur-xl border-slate-600/30 shadow-2xl">
            <CardContent className="p-6 sm:p-8">
              <div className="text-center py-10">
                <p className="text-gray-300 text-lg font-medium">Carregando fundos acompanhados...</p>
              </div>
            </CardContent>
          </Card>
        ) : follows && follows.length === 0 ? (
          <Card className="bg-slate-900/70 backdrop-blur-xl border-slate-600/30 shadow-2xl">
            <CardContent className="p-6 sm:p-8">
              <div className="text-center py-10 sm:py-16">
                <TrendingUp className="w-16 sm:w-20 h-16 sm:h-20 text-blue-400 mx-auto mb-6" />
                <h3 className="text-xl sm:text-2xl font-black text-white mb-3">
                  Nenhum fundo em acompanhamento
                </h3>
                <p className="text-base sm:text-lg text-gray-300 mb-8 max-w-md mx-auto font-medium">
                  Adicione fundos para receber relatórios gerenciais via WhatsApp
                </p>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                      <Plus className="w-4 h-4 mr-2" />
                      Adicionar Primeiro Fundo
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-[#1a1a35] border-gray-700 text-white max-w-lg">
                    <DialogHeader>
                      <DialogTitle>Adicionar Fundo</DialogTitle>
                      <DialogDescription className="text-gray-400">
                        Busque e adicione fundos imobiliários para acompanhar
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="relative">
                        <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                        <Input
                          placeholder="Digite o código do fundo (ex: XPML11)"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10 bg-[#2a2a45] border-gray-600 text-white placeholder-gray-400"
                        />
                      </div>
                      {isSearching && (
                        <div className="text-center py-4">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
                          <p className="text-gray-400 mt-2 text-sm">Buscando fundos...</p>
                        </div>
                      )}
                      {searchResults && searchResults.length > 0 && (
                        <div className="max-h-64 overflow-y-auto space-y-2">
                          {searchResults.map((fund) => (
                            <div
                              key={fund.id}
                              className="flex items-center justify-between p-3 bg-[#2a2a45] rounded-lg hover:bg-[#3a3a55] transition-colors"
                            >
                              <div>
                                <p className="font-medium text-white">{fund.ticker}</p>
                                <p className="text-sm text-gray-400">{fund.name}</p>
                              </div>
                              <Button
                                size="sm"
                                onClick={() => {
                                  followFundMutation.mutate({
                                    fundId: fund.id,
                                    ticker: fund.ticker,
                                    name: fund.name
                                  });
                                  setIsDialogOpen(false);
                                }}
                                disabled={followFundMutation.isPending}
                                className="bg-blue-600 hover:bg-blue-700"
                              >
                                <Plus className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                      {searchTerm && !isSearching && searchResults && searchResults.length === 0 && (
                        <div className="text-center py-8 text-gray-400">
                          <Search className="w-8 h-8 mx-auto mb-2 text-gray-500" />
                          <p>Nenhum fundo encontrado</p>
                          <p className="text-sm">Tente buscar pelo código do fundo</p>
                        </div>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Exibir mensagem quando a busca/filtros não retornam resultados */}
            {(filterTerm || statusFilter !== "all") && filteredFollows.length === 0 ? (
              <Card className="bg-slate-900/70 backdrop-blur-xl border-slate-600/30 shadow-2xl">
                <CardContent className="p-6 sm:p-8">
                  <div className="text-center py-10">
                    <Search className="w-16 sm:w-20 h-16 sm:h-20 text-blue-400 mx-auto mb-6" />
                    <h3 className="text-xl sm:text-2xl font-black text-white mb-3">
                      Nenhum ativo encontrado
                    </h3>
                    <p className="text-base sm:text-lg text-gray-300 mb-6 max-w-md mx-auto font-medium">
                      {filterTerm && statusFilter !== "all"
                        ? `Nenhum ativo ${statusFilter === "active" ? "ativo" : "inativo"} corresponde à sua busca por "${filterTerm}"`
                        : filterTerm
                          ? `Nenhum ativo corresponde à sua busca por "${filterTerm}"`
                          : `Nenhum ativo ${statusFilter === "active" ? "ativo" : "inativo"} encontrado`
                      }
                    </p>
                    <div className="flex flex-wrap gap-3 justify-center">
                      {filterTerm && (
                        <Button
                          variant="outline"
                          onClick={() => setFilterTerm("")}
                          className="bg-slate-900/70 backdrop-blur-xl border-slate-600/30 text-white hover:bg-blue-600/20 hover:border-blue-500/60 rounded-lg px-5 py-2.5 font-semibold transition-all"
                        >
                          Limpar busca
                        </Button>
                      )}
                      {statusFilter !== "all" && (
                        <Button
                          variant="outline"
                          onClick={() => setStatusFilter("all")}
                          className="bg-slate-900/70 backdrop-blur-xl border-slate-600/30 text-white hover:bg-blue-600/20 hover:border-blue-500/60 rounded-lg px-5 py-2.5 font-semibold transition-all"
                        >
                          Ver todos
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 sm:gap-5 lg:gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                {filteredFollows.map((follow) => (
                  <Card key={follow.id} className="bg-slate-900/70 backdrop-blur-xl border-slate-600/30 hover:bg-slate-900/80 hover:border-blue-500/50 transition-all duration-300 shadow-2xl hover:shadow-blue-500/20 rounded-2xl transform hover:scale-[1.02]">
                    <CardContent className="p-6 sm:p-7">
                      <div className="space-y-4">
                        {/* Header do card */}
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0 pr-3">
                            <h3 className="text-lg sm:text-xl font-bold text-white truncate">
                              {follow.fund.ticker}
                            </h3>
                          </div>
                          <Badge
                            variant={follow.notificationsEnabled ? "default" : "secondary"}
                            className={`shrink-0 ${follow.notificationsEnabled
                              ? "bg-green-600 hover:bg-green-700 text-white border-green-500"
                              : "bg-gray-600 hover:bg-gray-700 text-white border-gray-500"
                              } rounded-lg px-3 py-1 font-medium`}
                          >
                            {follow.notificationsEnabled ? "Ativo" : "Inativo"}
                          </Badge>
                        </div>

                        {/* Data de adição */}
                        <div className="text-sm text-gray-400 border-t border-gray-700/50 pt-3">
                          <span className="text-gray-500">Adicionado em</span> {new Date(follow.createdAt).toLocaleDateString('pt-BR')}
                        </div>

                        {/* Controles */}
                        <div className="flex items-center justify-between pt-3 border-t border-gray-700/50">
                          <div className="flex items-center gap-3">
                            <Switch
                              checked={follow.notificationsEnabled}
                              onCheckedChange={(enabled) => handleToggleNotifications(follow.id, enabled)}
                              disabled={toggleNotificationMutation.isPending}
                              className="data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-gray-600"
                            />
                            <span className="text-sm text-gray-300 font-medium">
                              {follow.notificationsEnabled ? "Alertas Ligados" : "Alertas Desligados"}
                            </span>
                          </div>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleUnfollowFund(follow.id)}
                            disabled={unfollowFundMutation.isPending}
                            className="text-red-400 hover:text-red-300 hover:bg-red-950/30 p-2 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <br />
      <br />
      <br />
      
    </main>
  );
}
