"use client";

import {
  CrownIcon,
  HelpCircle,
  Home,
  Settings,
  TrendingUp,
  LogOut,
  MoreVertical,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { useWhatsAppStatus } from "@/hooks/use-whatsapp-status";
import { useSidebar } from "@/contexts/sidebar-context";

interface CustomSidebarProps {
  activeMenuItem: string;
  onMenuItemClick?: (itemId: string) => void;
}

export function CustomSidebar({ activeMenuItem, onMenuItemClick }: CustomSidebarProps) {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const { isConnected: isWhatsAppConnected, isLoading } = useWhatsAppStatus();
  const { isExpanded } = useSidebar();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const menuItems = [
    { id: "home", label: "Home", icon: Home },
    { id: "my-follow", label: "Acompanhamento", icon: TrendingUp },
    { id: "configuracao", label: "Configuração", icon: Settings },
    { id: "planos", label: "Planos", icon: CrownIcon },
    { id: "como-funciona", label: "Como funciona", icon: HelpCircle },
  ];

  const handleLogout = async () => {
    try {
      await authClient.signOut();
      window.location.href = "/";
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    }
  };

  const UserAvatar = ({ size = "w-8 h-8" }: { size?: string }) => {
    const userName = session?.user?.name || session?.user?.email || "Usuário";
    const userImage = session?.user?.image;
    const initials = userName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

    if (userImage) {
      return (
        <img
          src={userImage}
          alt={userName}
          className={`${size} rounded-full object-cover border-2 border-blue-400 shadow-lg`}
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
        />
      );
    }

    return (
      <div
        className={`${size} bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0 border-2 border-blue-400 shadow-lg`}
      >
        <span className="text-white text-sm font-bold">{initials}</span>
      </div>
    );
  };

  const handleMenuItemClick = (itemId: string) => {
    if (onMenuItemClick) {
      onMenuItemClick(itemId);
    } else {
      if (itemId === "home") {
        router.push("/home");
      } else if (itemId === "my-follow") {
        router.push("/my-follow");
      } else if (itemId === "configuracao") {
        router.push("/configuration");
      } else if (itemId === "planos") {
        router.push("/planos");
      } else if (itemId === "como-funciona") {
        router.push("/step-by-step");
      } else {
        router.push("/home");
      }
    }
  };

  return (
    <aside
      className={`fixed top-28 left-0 h-[calc(100vh-7rem)] backdrop-blur-xl border-r border-gray-700/50 shadow-2xl flex flex-col z-50 custom-sidebar-scroll transition-all duration-300 ${isExpanded ? 'w-64 translate-x-0' : 'w-64 -translate-x-full'
        }`}
      style={{ backgroundColor: '#131824' }}
    >
      {/* === Header === */}

      {/* <div className="border-b border-gray-800 py-4 px-4 flex-shrink-0">
        <div className="flex items-center justify-center">
          <Image
            src="/logo2.png"
            alt="Lucas FII Alerts"
            width={200}
            height={168}
            className="object-contain"
          />
        </div>
      </div> */}

      {/* === Menu === */}

      <div className="flex-1 overflow-y-auto py-4 px-3 custom-sidebar-scroll">
        <div className="mb-3 mt-6">
          <p className="text-gray-400 uppercase text-[10px] font-bold tracking-widest px-3 mb-3">
            Menu
          </p>
          <nav className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeMenuItem === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => handleMenuItemClick(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-300 group ${
                    isActive
                      ? "text-blue-400"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  <motion.div
                    whileHover={{ 
                      scale: 1.2,
                      rotate: [0, -10, 10, -10, 0],
                      transition: { duration: 0.5 }
                    }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Icon className="w-5 h-5" />
                  </motion.div>
                  <span className="font-semibold">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Footer - WhatsApp Status e Versão */}
      <div className="border-t border-gray-800 flex-shrink-0">
        {/* User Profile Section */}
        <div className="px-3 py-3 border-b border-gray-800">
          <div className="flex items-center gap-3 px-2 py-2 rounded-lg bg-gray-800/30 hover:bg-gray-700/40 transition-colors relative">
            <UserAvatar size="w-10 h-10" />
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-semibold truncate">
                {session?.user?.name || "Usuário"}
              </p>
              <p className="text-gray-400 text-xs truncate">
                {session?.user?.email}
              </p>
            </div>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="p-1 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <MoreVertical className="w-5 h-5 text-gray-400" />
            </button>

            {/* Dropdown Menu */}
            <AnimatePresence>
              {showUserMenu && (
                <>
                  {/* Overlay para fechar ao clicar fora */}
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowUserMenu(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-2 bottom-full mb-2 bg-gray-800 border border-gray-700 rounded-lg shadow-xl overflow-hidden z-50 w-48"
                  >
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        handleLogout();
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left text-red-400 hover:bg-gray-700/50 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span className="font-medium">Sair</span>
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* WhatsApp Status */}
        {!isLoading && (
          <div className="px-3 py-3">
            <div
              className={`px-4 py-3 rounded-xl shadow-lg transition-all duration-300 ${isWhatsAppConnected
                ? "bg-gradient-to-r from-green-600/80 to-emerald-600/80 hover:from-green-700/90 hover:to-emerald-700/90"
                : "bg-gradient-to-r from-red-600/80 to-rose-600/80 hover:from-red-700/90 hover:to-rose-700/90"
                }`}
            >
              <div className="flex items-center space-x-2">
                <div
                  className={`w-2.5 h-2.5 bg-white rounded-full shadow-lg ${isWhatsAppConnected ? "animate-pulse" : ""
                    }`}
                ></div>
                <span className="text-white font-bold text-xs">
                  {isWhatsAppConnected ? "WhatsApp Conectado" : "WhatsApp Desconectado"}
                </span>
              </div>
              <p className="text-xs mt-1.5 text-white/90 font-medium">
                {isWhatsAppConnected
                  ? "✓ Recebendo atualizações"
                  : "⚠ Configure para receber alertas"}
              </p>
            </div>
          </div>
        )}

        {/* === Versão === */}

        {/* <div className="px-3 pb-3">
          <div className="text-gray-500 text-[10px] space-y-0.5 text-center py-2">
            <p className="font-mono">v1.0.0-beta</p>
            <p className="truncate">
              Desenvolvido por{" "}
              <a
                href="https://www.devrocha.com.br"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-100 transition-colors duration-200"
              >
                DevRocha
              </a>
            </p>
          </div>
        </div> */}

      </div>
    </aside>
  );
}
