"use client";

import { Home, TrendingUp, Settings, CrownIcon, MessageCircle, HelpCircle, X, PlusCircle, MoreVertical, Share2, Pin, Edit2, Trash2, Search, SquarePen, Maximize2, Menu } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useDevMode } from "@/contexts/dev-mode-context";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { 
  getUserConversations, 
  renameConversation, 
  deleteConversation, 
  togglePinConversation 
} from "@/actions/chat-conversations";
import { toast } from "sonner";

interface Conversation {
  id: string;
  title: string;
  isPinned: boolean;
  lastMessage: string;
  updatedAt: Date;
}

interface ChatSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeMenuItem?: string;
  currentConversationId?: string;
  onNewConversation?: () => void;
  onSelectConversation?: (id: string) => void;
  onOpenSettings?: () => void;
}

export function ChatSidebar({ 
  isOpen, 
  onClose, 
  activeMenuItem = "chat-ia",
  currentConversationId,
  onNewConversation,
  onSelectConversation,
  onOpenSettings
}: ChatSidebarProps) {
  const router = useRouter();
  const { isDevMode } = useDevMode();
  const [searchQuery, setSearchQuery] = useState("");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showSearchPage, setShowSearchPage] = useState(false);

  // Load conversations from backend
  useEffect(() => {
    loadConversations();
  }, []);

  // Reload conversations when sidebar opens
  useEffect(() => {
    if (isOpen) {
      loadConversations();
    }
  }, [isOpen]);

  const loadConversations = async () => {
    setIsLoading(true);
    const result = await getUserConversations();
    if (result.success && result.conversations) {
      setConversations(result.conversations);
    }
    setIsLoading(false);
  };

  const menuItems = [
    { id: "home", label: "Home", icon: Home, route: "/home" },
    { id: "my-follow", label: "Acompanhamento", icon: TrendingUp, route: "/my-follow" },
    { id: "configuracao", label: "Configuração", icon: Settings, route: "/configuration" },
    { id: "planos", label: "Planos", icon: CrownIcon, route: "/planos" },
    { id: "como-funciona", label: "Como funciona", icon: HelpCircle, route: "/step-by-step" },
  ];

  const handleMenuClick = (route: string) => {
    router.push(route);
    onClose();
  };

  const handleNewConversation = () => {
    onNewConversation?.();
    onClose();
  };

  const handleSelectConversation = (id: string) => {
    onSelectConversation?.(id);
    onClose();
  };

  const handleRenameConversation = async (id: string) => {
    const conversation = conversations.find(c => c.id === id);
    const newTitle = prompt("Novo nome da conversa:", conversation?.title);
    if (newTitle && newTitle.trim()) {
      const result = await renameConversation(id, newTitle.trim());
      if (result.success) {
        setConversations(prev =>
          prev.map(conv => conv.id === id ? { ...conv, title: newTitle.trim() } : conv)
        );
        toast.success("Conversa renomeada com sucesso");
      } else {
        toast.error(result.error || "Erro ao renomear conversa");
      }
    }
  };

  const handlePinConversation = async (id: string) => {
    const conversation = conversations.find(c => c.id === id);
    if (!conversation) return;

    const newPinnedState = !conversation.isPinned;
    const result = await togglePinConversation(id, newPinnedState);
    
    if (result.success) {
      setConversations(prev =>
        prev.map(conv => conv.id === id ? { ...conv, isPinned: newPinnedState } : conv)
      );
      toast.success(newPinnedState ? "Conversa fixada" : "Conversa desafixada");
    } else {
      toast.error(result.error || "Erro ao fixar/desafixar conversa");
    }
  };

  const handleDeleteConversation = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir esta conversa?")) {
      const result = await deleteConversation(id);
      if (result.success) {
        setConversations(prev => prev.filter(conv => conv.id !== id));
        toast.success("Conversa excluída com sucesso");
        
        // If deleting current conversation, reset to new
        if (currentConversationId === id) {
          onNewConversation?.();
        }
      } else {
        toast.error(result.error || "Erro ao excluir conversa");
      }
    }
  };

  const handleShareConversation = (id: string) => {
    alert("Funcionalidade de compartilhamento em desenvolvimento");
  };

  const filteredConversations = conversations
    .filter(conv => conv.title.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return b.updatedAt.getTime() - a.updatedAt.getTime();
    });

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 1000 / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 60) return `${minutes}m atrás`;
    if (hours < 24) return `${hours}h atrás`;
    if (days === 1) return "Ontem";
    if (days < 7) return `${days}d atrás`;
    return date.toLocaleDateString();
  };

  // Calcular posição do sidebar baseado no dev mode
  const sidebarTop = isDevMode ? 'top-12' : 'top-0';
  const sidebarHeight = isDevMode ? 'h-[calc(100vh-3rem)]' : 'h-screen';

  return (
    <>
      {/* Sidebar */}
      <div
        className={`fixed left-0 z-50 w-72 border-r border-white/5 transition-transform duration-300 ease-in-out ${sidebarTop} ${sidebarHeight} ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ backgroundColor: '#141414' }}
      >
        <div className="flex h-full flex-col">
          {/* Sidebar Header - Menu e Pesquisa */}
          <div className="flex items-center justify-between border-b border-white/5 px-3 py-3">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-xl text-white/60 hover:bg-white/[0.08] hover:text-white/90"
              onClick={() => {
                setShowSearchPage(false);
                onClose();
              }}
            >
              <Menu className="size-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-xl text-white/60 hover:bg-white/[0.08] hover:text-white/90"
              onClick={() => setShowSearchPage(true)}
              title="Pesquisar"
            >
              <Search className="size-5" />
            </Button>
          </div>

          {/* Tela de Pesquisa */}
          {showSearchPage ? (
            <div className="flex h-full flex-col">
              {/* Título Pesquisa */}
              <div className="px-6 py-6 border-b border-white/5">
                <h2 className="text-2xl font-normal text-white/95">Pesquisa</h2>
              </div>

              {/* Campo de busca grande */}
              <div className="px-6 py-6">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-white/40" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Pesquise conversas"
                    className="h-12 rounded-full border-white/10 bg-white/[0.03] pl-12 text-[15px] text-white/90 placeholder:text-white/40 focus:border-white/20 focus:bg-white/[0.05]"
                    autoFocus
                  />
                </div>
              </div>

              {/* Lista de conversas recentes */}
              <div className="flex-1 overflow-y-auto px-3 chat-messages-scroll">
                <div className="mb-3 px-3">
                  <h3 className="text-sm font-medium text-white/60">Recentes</h3>
                </div>
                <div className="space-y-1">
                  {filteredConversations.map((conversation) => (
                    <div
                      key={conversation.id}
                      onClick={() => {
                        handleSelectConversation(conversation.id);
                        setShowSearchPage(false);
                      }}
                      className="group flex items-center justify-between rounded-xl px-4 py-3 transition-all duration-200 cursor-pointer hover:bg-white/[0.06]"
                    >
                      <div className="flex min-w-0 flex-1 flex-col gap-1">
                        <span className="truncate text-[15px] font-normal text-white/95">
                          {conversation.title}
                        </span>
                      </div>
                      <span className="text-xs text-white/40 shrink-0 ml-4">
                        {formatDate(conversation.updatedAt)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <>
          {/* Botão Nova conversa com ícone e texto */}
          <div className="border-b border-white/5 px-3 py-3 space-y-2">
            <Button
              variant="ghost"
              className="w-full h-auto justify-start gap-3 rounded-xl px-4 py-3 text-white/80 hover:bg-white/[0.08] hover:text-white/95"
              onClick={handleNewConversation}
            >
              <SquarePen className="size-5" />
              <span className="text-[15px] font-normal">Nova conversa</span>
            </Button>
            
            {onOpenSettings && (
              <Button
                variant="ghost"
                className="w-full h-auto justify-start gap-3 rounded-xl px-4 py-3 text-white/80 hover:bg-white/[0.08] hover:text-white/95"
                onClick={() => {
                  onClose();
                  onOpenSettings();
                }}
              >
                <Settings className="size-5" />
                <span className="text-[15px] font-normal">Configurações</span>
              </Button>
            )}
          </div>

          {/* Search */}
          <div className="border-b border-white/5 px-3 py-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/40" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Pesquise conversas"
                className="h-9 rounded-lg border-white/10 bg-white/[0.03] pl-9 text-sm text-white/90 placeholder:text-white/40 focus:border-white/20 focus:bg-white/[0.05]"
              />
            </div>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto px-2 py-2 chat-messages-scroll">
            <div className="space-y-1">
              {filteredConversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className={`group relative flex items-start gap-2 rounded-xl px-3 py-3 transition-all duration-200 cursor-pointer ${
                    currentConversationId === conversation.id
                      ? "bg-white/[0.1] shadow-md ring-1 ring-white/10"
                      : "hover:bg-white/[0.06] hover:shadow-sm"
                  }`}
                >
                  <button
                    onClick={() => handleSelectConversation(conversation.id)}
                    className="flex min-w-0 flex-1 flex-col items-start gap-1.5 text-left"
                  >
                    <div className="flex w-full items-center gap-2">
                      {conversation.isPinned && (
                        <Pin className="size-3.5 shrink-0 text-blue-400 fill-blue-400/20" />
                      )}
                      <span className="truncate text-[15px] font-semibold text-white/95 leading-tight">
                        {conversation.title}
                      </span>
                    </div>
                    <span className="line-clamp-2 text-xs leading-relaxed text-white/50">
                      {conversation.lastMessage}
                    </span>
                    <span className="text-[11px] text-white/35 font-medium">
                      {formatDate(conversation.updatedAt)}
                    </span>
                  </button>

                  {/* Context Menu */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-white/[0.06] hover:text-white/80"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="size-4 text-white/60" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="w-48 border-white/10 bg-[#1a1a1a]"
                    >
                      {/* TODO: Implementar compartilhamento de conversa */}
                      {/* <DropdownMenuItem
                        onClick={() => handleShareConversation(conversation.id)}
                        className="gap-2 text-white/80 focus:bg-white/[0.08] focus:text-white/90"
                      >
                        <Share2 className="size-4" />
                        <span>Compartilhar conversa</span>
                      </DropdownMenuItem> */}
                      <DropdownMenuItem
                        onClick={() => handlePinConversation(conversation.id)}
                        className="gap-2 text-white/80 focus:bg-white/[0.08] focus:text-white/90"
                      >
                        <Pin className="size-4" />
                        <span>{conversation.isPinned ? "Desafixar" : "Fixar"}</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleRenameConversation(conversation.id)}
                        className="gap-2 text-white/80 focus:bg-white/[0.08] focus:text-white/90"
                      >
                        <Edit2 className="size-4" />
                        <span>Renomear</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDeleteConversation(conversation.id)}
                        className="gap-2 text-red-400 focus:bg-red-500/10 focus:text-red-400"
                      >
                        <Trash2 className="size-4" />
                        <span>Excluir</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}

              {filteredConversations.length === 0 && !isLoading && (
                <div className="py-8 text-center">
                  <p className="text-sm text-white/50">
                    {searchQuery ? "Nenhuma conversa encontrada" : "Nenhuma conversa ainda"}
                  </p>
                </div>
              )}

              {isLoading && (
                <div className="py-8 text-center">
                  <p className="text-sm text-white/50">Carregando conversas...</p>
                </div>
              )}
            </div>
          </div>
          </>
          )}

          {/* Bottom Navigation */}
          <div className="border-t border-white/5 px-2 py-2">
            <div className="space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = item.id === activeMenuItem;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleMenuClick(item.route)}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-200 ${
                      isActive
                        ? "bg-white/[0.1] text-white/95 font-medium shadow-sm"
                        : "text-white/70 hover:bg-white/[0.08] hover:text-white/95 hover:translate-x-1"
                    }`}
                  >
                    <Icon className="size-4" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />
      )}
    </>
  );
}
