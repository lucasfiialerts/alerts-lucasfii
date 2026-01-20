"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";

import { BottomNavigation } from "../../app/home/components/bottom-navigation";
import { PageHeader } from "./page-header";
import { CustomSidebar } from "./custom-sidebar";
import { Navbar } from "./navbar";
import { useSidebar } from "@/contexts/sidebar-context";
import { useDevMode } from "@/contexts/dev-mode-context";

interface PageLayoutProps {
  title: string;
  activeMenuItem: string;
  session?: {
    user?: {
      name?: string;
      email?: string;
      image?: string;
    };
  };
  children: React.ReactNode;
  onMenuItemClick?: (itemId: string) => void;
}

export function PageLayout({ 
  title, 
  activeMenuItem, 
  session, 
  children, 
  onMenuItemClick
}: PageLayoutProps) {
  const router = useRouter();
  const { isExpanded } = useSidebar();
  const { isDevMode } = useDevMode();

  const handleBottomNavigation = (tab: string) => {
    if (onMenuItemClick) {
      onMenuItemClick(tab);
    } else {
      // Navegação padrão
      if (tab === "home") {
        router.push("/home");
      } else if (tab === "my-follow") {
        router.push("/my-follow");
      } else if (tab === "configuracao") {
        router.push("/configuration");
      } else if (tab === "como-funciona") {
        router.push("/step-by-step");
      } else {
        router.push("/home");
      }
    }
  };

  return (
    <div className={`min-h-screen text-white relative transition-all duration-300 ${
      isDevMode ? 'pt-28 lg:pt-28' : 'pt-16'
    }`}>
      {/* Background Image */}
      <div className="fixed inset-0 z-0">
        <Image
          src="/fundogra.png"
          alt="Background"
          fill
          className="object-cover"
          priority
        />
        {/* Dark overlay para melhor legibilidade */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/80"></div>
      </div>

      {/* Navbar - Visível em todos os tamanhos */}
      <Navbar 
        activeMenuItem={activeMenuItem}
        onMenuItemClick={onMenuItemClick}
      />

      {/* Sidebar - Desktop only */}
      <div className="hidden lg:block">
        <CustomSidebar 
          activeMenuItem={activeMenuItem} 
          onMenuItemClick={onMenuItemClick}
        />
      </div>

      {/* Main Content */}
      <div className={`min-h-screen relative z-10 transition-all duration-300 ${
        isExpanded ? 'lg:ml-64' : 'lg:ml-20'
      }`}>
        {children}
      </div>

      {/* === Bottom Navigation - Mobile only === */}

      {/* <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50">
        <BottomNavigation
          activeTab={activeMenuItem}
          onTabChange={handleBottomNavigation}
        />
      </div> */}
    </div>
  );
}
