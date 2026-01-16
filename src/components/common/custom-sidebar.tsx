"use client";

import {
  CrownIcon,
  HelpCircle,
  Home,
  Settings,
  TrendingUp,
  LogOut,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { useWhatsAppStatus } from "@/hooks/use-whatsapp-status";

interface CustomSidebarProps {
  activeMenuItem: string;
  onMenuItemClick?: (itemId: string) => void;
}

export function CustomSidebar({ activeMenuItem, onMenuItemClick }: CustomSidebarProps) {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const { isConnected: isWhatsAppConnected, isLoading } = useWhatsAppStatus();

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
    <aside className="fixed top-0 left-0 h-screen w-64 bg-slate-900/90 backdrop-blur-xl border-r border-gray-700/50 shadow-2xl flex flex-col z-50 custom-sidebar-scroll">
      {/* Header */}
      <div className="border-b border-gray-800 py-5 px-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 rounded-xl flex items-center justify-center flex-shrink-0 shadow-xl transition-all duration-300 hover:scale-110 hover:shadow-blue-500/50 w-11 h-11 border border-blue-500/30">
            <span className="text-2xl">🚀</span>
          </div>
          <div>
            <h2 className="text-white font-bold text-xl bg-gradient-to-r from-cyan-300 via-blue-400 to-indigo-500 bg-clip-text text-transparent tracking-wide font-orbitron drop-shadow-lg">
              Lucas FII
            </h2>
            <p className="text-blue-300 text-xs font-medium tracking-wider uppercase font-mono">
              Alerts
            </p>
          </div>
        </div>
      </div>

      {/* Menu */}
      <div className="flex-1 overflow-y-auto py-4 px-3 custom-sidebar-scroll">
        <div className="mb-3">
          <p className="text-gray-400 uppercase text-[10px] font-bold tracking-widest px-3 mb-3">
            Menu Principal
          </p>
          <nav className="space-y-1">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleMenuItemClick(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-300 group ${
                  activeMenuItem === item.id
                    ? "bg-blue-600/30 border border-blue-500/40 shadow-md shadow-blue-500/20 text-blue-400"
                    : "text-gray-300 hover:bg-gray-700/70 hover:text-white hover:shadow-md"
                }`}
              >
                <item.icon
                  className={`w-5 h-5 transition-transform duration-300 ${
                    activeMenuItem === item.id ? "scale-110" : "group-hover:scale-110"
                  }`}
                />
                <span className="font-semibold">{item.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-800 flex-shrink-0">
        {/* WhatsApp Status */}
        {!isLoading && (
          <div className="px-3 py-3">
            <div
              className={`px-4 py-3 rounded-xl shadow-lg transition-all duration-300 ${
                isWhatsAppConnected
                  ? "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                  : "bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700"
              }`}
            >
              <div className="flex items-center space-x-2">
                <div
                  className={`w-2.5 h-2.5 bg-white rounded-full shadow-lg ${
                    isWhatsAppConnected ? "animate-pulse" : ""
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

        {/* User Section */}
        <div className="px-3 pb-3">
          <div className="space-y-2">
            <button
              onClick={() => router.push("/configuration")}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-700/70 transition-all duration-300 cursor-pointer"
            >
              <UserAvatar />
              <div className="flex-1 min-w-0 text-left">
                <p className="text-white text-sm font-bold truncate">
                  {session?.user?.name || session?.user?.email || "Usuário"}
                </p>
                <p className="text-gray-400 text-xs truncate">
                  {session?.user?.email || "email@example.com"}
                </p>
              </div>
            </button>

            {/* Botão de Logout - Desabilitado temporariamente */}
            {/* <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-300 bg-red-600/20 text-red-300 hover:bg-red-600/30 hover:text-red-200 border border-red-500/30 hover:border-red-500/50"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm font-bold">Sair da Conta</span>
            </button> */}
          </div>
        </div>

        {/* Footer com versão */}
        <div className="px-3 pb-3 text-center border-t border-gray-800 pt-3">
          <div className="text-gray-500 text-xs space-y-1">
            <p className="font-mono font-bold">v1.0.0</p>
            <p className="truncate">
              Desenvolvido por{" "}
              <a
                href="https://www.devrocha.com.br"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 font-bold hover:text-blue-300 transition-colors duration-200"
              >
                DevRocha
              </a>
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
