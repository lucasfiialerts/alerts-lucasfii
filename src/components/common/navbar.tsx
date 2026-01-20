'use client';

import { PanelLeftClose, PanelLeft, Info } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { useSidebar } from '@/contexts/sidebar-context';
import { useDevMode } from '@/contexts/dev-mode-context';
import { MobileMenu } from './mobile-menu';

interface NavbarProps {
  activeMenuItem?: string;
  onMenuItemClick?: (itemId: string) => void;
}

export function Navbar({ activeMenuItem = '', onMenuItemClick }: NavbarProps) {
  const { isExpanded, setIsExpanded } = useSidebar();
  const { isDevMode } = useDevMode();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <>
      <nav className={`fixed left-0 right-0 z-[9998] bg-[#131824]/90 backdrop-blur-md border-b border-gray-700/50 shadow-lg h-16 transition-all duration-300 ${
        isDevMode ? 'top-12' : 'top-0'
      }`}>
        <div className="flex items-center justify-center h-full px-4 relative">
          {/* Menu Toggle Button - Desktop */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="absolute left-4 p-2 rounded-lg hover:bg-gray-700/50 transition-colors text-white hidden lg:flex"
            aria-label="Toggle sidebar"
          >
            {isExpanded ? (
              <PanelLeftClose className="w-6 h-6" />
            ) : (
              <PanelLeft className="w-6 h-6" />
            )}
          </button>

          {/* Menu Toggle Button - Mobile */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="absolute left-4 p-2 rounded-lg hover:bg-gray-700/50 transition-colors text-white lg:hidden"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? (
              <PanelLeftClose className="w-6 h-6" />
            ) : (
              <PanelLeft className="w-6 h-6" />
            )}
          </button>

          {/* Logo - Centralizado */}
          <div className="flex items-center">
            <h1 className="text-white text-xl sm:text-2xl font-bold font-boogaloo tracking-wide">
              Lucas FII <span className="font-space-grotesk text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400 font-bold tracking-wider">Alerts 🔔</span>
            </h1>
          </div>

          {/* Credits/Version Button */}
          <Link
            href="/version-credits"
            className="absolute right-4 p-2 rounded-lg hover:bg-gray-700/50 transition-colors text-white"
            aria-label="Versão e Créditos"
          >
            <Info className="w-6 h-6" />
          </Link>
        </div>
      </nav>

      {/* Mobile Menu */}
      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        activeMenuItem={activeMenuItem}
        onMenuItemClick={onMenuItemClick}
      />
    </>
  );
}
