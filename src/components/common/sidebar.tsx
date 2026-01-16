"use client";

import { CrownIcon, HelpCircle, Home, Settings, TrendingUp, ChevronLeft, ChevronRight, User, LogOut, CreditCard } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useSidebar } from "@/contexts/sidebar-context";
import { useWhatsAppStatus } from "@/hooks/use-whatsapp-status";
import { authClient } from "@/lib/auth-client";
import { createBillingPortalSession } from "@/actions/create-billing-portal-session";

interface SidebarProps {
  activeMenuItem: string;
  onMenuItemClick?: (itemId: string) => void;
}

export function Sidebar({ activeMenuItem, onMenuItemClick }: SidebarProps) {
  const router = useRouter();
  const { isExpanded, setIsExpanded } = useSidebar();
  const { isConnected: isWhatsAppConnected, isLoading } = useWhatsAppStatus();
  const { data: session } = authClient.useSession();

  const menuItems = [
    { id: "home", label: "Home", icon: Home },
    { id: "my-follow", label: "Acompanhamento", icon: TrendingUp },
    { id: "configuracao", label: "Configuração", icon: Settings },
    { id: "planos", label: "Planos", icon: CrownIcon },
    { id: "como-funciona", label: "Como funciona", icon: HelpCircle },
  ];

  // Função de logout
  const handleLogout = async () => {
    try {
      await authClient.signOut();
      window.location.href = '/';
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  // Componente Avatar do Usuário
  const UserAvatar = ({ size = "w-6 h-6" }: { size?: string }) => {
    const userName = session?.user?.name || session?.user?.email || "Usuário";
    const userImage = session?.user?.image;
    const initials = userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

    // Debug completo da sessão
    console.log('🔍 Debug completo da sessão:', {
      session: session,
      user: session?.user,
      userName,
      userImage,
      hasImage: !!userImage,
      imageType: typeof userImage
    });

    if (userImage) {
      console.log('✅ Renderizando imagem:', userImage);
      return (
        <img
          src={userImage}
          alt={userName}
          className={`${size} rounded-full object-cover border-2 border-blue-400 shadow-lg`}
          onLoad={() => console.log('✅ Imagem carregada com sucesso!')}
          onError={(e) => {
            console.error('❌ Erro ao carregar imagem:', userImage);
            // Forçar fallback removendo a imagem
            e.currentTarget.style.display = 'none';
          }}
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
        />
      );
    }

    console.log('🎨 Renderizando iniciais:', initials, 'para usuário:', userName);
    return (
      <div className={`${size} bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0 border-2 border-blue-400 shadow-lg`}>
        <span className="text-white text-sm font-bold">{initials}</span>
      </div>
    );
  };

  const handleMenuItemClick = (itemId: string) => {
    if (onMenuItemClick) {
      onMenuItemClick(itemId);
    } else {
      // Navegação padrão
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
    <>
      {/* Desktop Sidebar */}
      <aside className={`fixed top-0 left-0 h-screen bg-slate-900/80 backdrop-blur-xl border-r border-gray-700/50 transition-all duration-300 ease-in-out z-20 hidden lg:block ${isExpanded ? "w-64" : "w-20"
        }`}>
        {/* === Toggle Button - Desktop === */}

        {/* <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`absolute ${isExpanded ? "-right-3" : "-right-3"} top-8 bg-[#1a1a35] border border-gray-800 text-gray-300 p-1.5 rounded-full hover:bg-gray-700 hover:text-white transition-all duration-200 z-10 shadow-lg hover:shadow-xl`}
        >
          {isExpanded ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button> */}

        {/* Logo Section */}
        <div className={`border-b border-gray-800 flex items-center ${isExpanded ? "p-6" : "p-4 justify-center"}`}>
          <div className={`flex items-center ${isExpanded ? "space-x-3" : "justify-center"}`}>
            
            {/* <div className={`bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-xl transition-all duration-300 hover:scale-110 hover:shadow-2xl ${isExpanded ? "w-10 h-10" : "w-12 h-12"}`}>
              <span className={`${isExpanded ? "text-lg" : "text-xl"}`}>🚀</span>
            </div> */}

            <div className={`bg-gradient-to-br from-black-400 via-black-500 to-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-xl transition-all duration-300 hover:scale-110 hover:shadow-2xl ${isExpanded ? "w-10 h-10" : "w-12 h-12"}`}>
              <span className="font-space-grotesk text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400 font-bold tracking-wider"> 🚀</span>
            </div>

            {/* <span className="font-space-grotesk text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400 font-bold tracking-wider"> 🚀</span>
             */}
            {isExpanded && (
              <div>
                <h2 className="text-white font-bold text-xl bg-gradient-to-r from-cyan-300 via-blue-400 to-indigo-500 bg-clip-text text-transparent tracking-wide font-orbitron drop-shadow-lg">
                  Lucas FII
                </h2>
                <p className="text-blue-300 text-xs font-medium tracking-wider uppercase font-mono">
                  Alerts
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className={`space-y-1 ${isExpanded ? "p-3" : "p-2"}`}>
          {menuItems.map((item, index) => (
            <button
              key={item.id}
              onClick={() => {
                // Clicar nos ícones apenas navega, não expande o menu
                // Para expandir, use apenas o botão de seta
                handleMenuItemClick(item.id);
              }}
              className={`w-full flex items-center ${isExpanded ? "space-x-3 px-3" : "justify-center px-0"} py-3 rounded-lg text-left transition-all duration-200 cursor-pointer group relative ${activeMenuItem === item.id
                  ? "bg-blue-600 text-white shadow-lg"
                  : "text-gray-300 hover:bg-gray-700 hover:text-white"
                } ${!isExpanded ? "mx-2" : ""}`}
              title={!isExpanded ? item.label : undefined}
            >
              <item.icon className={`transition-all duration-200 flex-shrink-0 ${isExpanded ? "w-5 h-5" : "w-6 h-6"} ${activeMenuItem === item.id ? "text-white" : "text-gray-400 group-hover:text-white"
                }`} />
              {isExpanded && (
                <span className="text-sm font-medium transition-all duration-200 truncate">{item.label}</span>
              )}

              {/* Tooltip for collapsed state */}
              {!isExpanded && (
                <div className="absolute left-full ml-4 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-30 shadow-xl border border-gray-700">
                  {item.label}
                  <div className="absolute left-0 top-1/2 transform -translate-x-1 -translate-y-1/2 w-2 h-2 bg-gray-900 rotate-45 border-l border-b border-gray-700"></div>
                </div>
              )}

              {/* Active indicator for collapsed state */}
              {!isExpanded && activeMenuItem === item.id && (
                <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-blue-400 rounded-r-full"></div>
              )}
            </button>
          ))}
        </nav>

        {/* Footer quando contraído - REMOVIDO para dar espaço aos botões WhatsApp */}

        {/* User Section - Desktop */}
        <div className={`absolute left-0 right-0 px-3 ${isExpanded ? "bottom-20" : "bottom-44"} ${!isLoading ? (isExpanded ? "bottom-36" : "bottom-56") : ""}`}>
          {isExpanded ? (
            <div className="border-t border-gray-800 pt-3 space-y-3">
              {/* Seção do usuário */}
              <div className="flex items-center space-x-2 px-2 py-1.5 rounded-lg hover:bg-gray-700 transition-colors duration-200">
                <UserAvatar />
                <div className="flex-1 min-w-0">
                  <p className="text-white text-xs font-medium truncate">
                    {session?.user?.name || session?.user?.email || "Usuário"}
                  </p>
                  <p className="text-gray-400 text-xs truncate">{session?.user?.email || "email@example.com"}</p>
                </div>
              </div>

              {/* Botões de ação */}
              <div className="space-y-1 px-2">
                {/* Gerenciar Assinatura */}
                
                {/* <button
                  onClick={() => createBillingPortalSession()}
                  className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-all duration-200 cursor-pointer text-green-300 hover:bg-green-600/20 hover:text-green-200"
                >
                  <CreditCard className="w-4 h-4" />
                  <span className="text-sm font-medium">Gerenciar Assinatura</span>
                </button> */}

                {/* Logout */}
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center space-x-2 px-2 py-1.5 rounded-lg text-left transition-all duration-200 cursor-pointer text-red-300 hover:bg-red-600/20 hover:text-red-200"
                >
                  <LogOut className="w-3 h-3" />
                  <span className="text-xs font-medium">Sair da Conta</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-2">
              {/* Avatar do usuário (contraído) */}
              <div className="flex flex-col items-center">
                <UserAvatar />
              </div>

              {/* Gerenciar Assinatura */}
              {/* <button
                onClick={() => createBillingPortalSession()}
                className="bg-gray-700 p-2.5 rounded-lg shadow-lg hover:bg-green-600 transition-colors duration-200 group relative cursor-pointer"
                title="Gerenciar Assinatura"
              >
                <CreditCard className="w-4 h-4 text-gray-400 group-hover:text-white" />
                
                <div className="absolute left-full ml-4 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-30 shadow-xl border border-gray-700">
                  Gerenciar Assinatura
                  <div className="absolute left-0 top-1/2 transform -translate-x-1 -translate-y-1/2 w-2 h-2 bg-gray-900 rotate-45 border-l border-b border-gray-700"></div>
                </div>
              </button> */}

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="bg-gray-700 p-2 rounded-lg shadow-lg hover:bg-red-600 transition-colors duration-200 group relative cursor-pointer"
                title="Sair"
              >
                <LogOut className="w-3 h-3 text-gray-400 group-hover:text-white" />
                {/* Tooltip para versão contraída */}
                <div className="absolute left-full ml-4 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-30 shadow-xl border border-gray-700">
                  Sair da conta
                  <div className="absolute left-0 top-1/2 transform -translate-x-1 -translate-y-1/2 w-2 h-2 bg-gray-900 rotate-45 border-l border-b border-gray-700"></div>
                </div>
              </button>
            </div>
          )}
        </div>

        {/* WhatsApp Status - Desktop */}
        {!isLoading && (
          <div className={`absolute left-0 right-0 px-3 ${isExpanded ? "bottom-20" : "bottom-28"}`}>
            {isExpanded ? (
              <div className={`px-2 py-1.5 rounded-lg text-xs shadow-lg ${isWhatsAppConnected ? "bg-green-600" : "bg-red-600"
                }`}>
                <div className="flex items-center space-x-1.5">
                  <div className={`w-1.5 h-1.5 bg-white rounded-full ${isWhatsAppConnected ? "animate-pulse" : ""
                    }`}></div>
                  <span className="text-white font-medium">
                    {isWhatsAppConnected ? "WhatsApp conectado" : "WhatsApp desconectado"}
                  </span>
                </div>
                <p className={`text-xs mt-0.5 ${isWhatsAppConnected ? "text-green-100" : "text-red-100"
                  }`}>
                  {isWhatsAppConnected
                    ? "Você está recebendo atualizações"
                    : "Configure sua conta para receber alertas"
                  }
                </p>
              </div>
            ) : (
              <div className="flex justify-center">
                <div className={`p-2 rounded-lg shadow-lg group relative ${isWhatsAppConnected ? "bg-green-600" : "bg-red-600"
                  }`}>
                  <div className={`w-2.5 h-2.5 bg-white rounded-full ${isWhatsAppConnected ? "animate-pulse" : ""
                    }`}></div>
                  {/* Tooltip para versão contraída */}
                  <div className="absolute left-full ml-4 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-30 shadow-xl border border-gray-700">
                    {isWhatsAppConnected ? "WhatsApp conectado" : "WhatsApp desconectado"}
                    <div className="absolute left-0 top-1/2 transform -translate-x-1 -translate-y-1/2 w-2 h-2 bg-gray-900 rotate-45 border-l border-b border-gray-700"></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* === Footer com versão e créditos === */}
        <div className={`absolute bottom-2 left-0 right-0 text-center ${isExpanded ? "px-3" : "px-1"}`}>
          {isExpanded ? (
            <div className="text-gray-500 text-xs space-y-1">
              <p className="font-mono">v1.0.0</p>
              <p className="truncate">Desenvolvido por <a href="https://www.devrocha.com.br" target="_blank" rel="noopener noreferrer" className="text-blue-400 font-medium hover:text-blue-300 transition-colors duration-200 cursor-pointer">DevRocha</a></p>
            </div>
          ) : (
            <div className="text-gray-500 text-xs">
              <p className="font-mono text-[10px]">v1.0.0</p>
              <a href="https://www.devrocha.com.br" target="_blank" rel="noopener noreferrer" className="text-[8px] text-blue-400 hover:text-blue-300 transition-colors duration-200 cursor-pointer block">DevRocha</a>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
