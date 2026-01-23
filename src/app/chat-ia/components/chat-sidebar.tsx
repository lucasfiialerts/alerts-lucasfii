"use client";

import { Home, TrendingUp, Settings, CrownIcon, MessageCircle, HelpCircle, X } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

interface ChatSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeMenuItem?: string;
}

export function ChatSidebar({ isOpen, onClose, activeMenuItem = "chat-ia" }: ChatSidebarProps) {
  const router = useRouter();

  const menuItems = [
    { id: "home", label: "Home", icon: Home, route: "/home" },
    // { id: "my-follow", label: "Acompanhamento", icon: TrendingUp, route: "/my-follow" },
    // { id: "configuracao", label: "Configuração", icon: Settings, route: "/configuration" },
    // { id: "planos", label: "Planos", icon: CrownIcon, route: "/planos" },
    { id: "chat-ia", label: "Research.IA", icon: MessageCircle, route: "/chat-ia" },
    // { id: "como-funciona", label: "Como funciona", icon: HelpCircle, route: "/step-by-step" },
  ];

  const handleMenuClick = (route: string) => {
    router.push(route);
    onClose();
  };

  return (
    <>
      {/* Sidebar */}
      <div
        className={`fixed left-0 top-0 z-50 h-screen w-64 border-r border-white/5 transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ backgroundColor: '#141414' }}
      >
        <div className="flex h-full flex-col">
          {/* Sidebar Header */}
          <div className="flex items-center justify-between border-b border-white/5 px-4 py-4">
            <h2 className="text-lg font-semibold text-white/90">Menu</h2>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-white/60 hover:bg-white/[0.08] hover:text-white/90"
              onClick={onClose}
            >
              <X className="size-5" />
            </Button>
          </div>

          {/* Menu Items */}
          <nav className="flex-1 space-y-1 px-3 py-4">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.id === activeMenuItem;
              return (
                <button
                  key={item.id}
                  onClick={() => handleMenuClick(item.route)}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                    isActive
                      ? "bg-white/[0.08] text-white/95 font-medium"
                      : "text-white/70 hover:bg-white/[0.05] hover:text-white/90"
                  }`}
                >
                  <Icon className="size-5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
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
