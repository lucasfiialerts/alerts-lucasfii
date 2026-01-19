'use client';

import { PanelLeftClose, PanelLeft, Info } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useSidebar } from '@/contexts/sidebar-context';

export function Navbar() {
  const { isExpanded, setIsExpanded } = useSidebar();

  return (
    <nav className="fixed top-12 left-0 right-0 z-[9998] bg-[#131824]/90 backdrop-blur-md border-b border-gray-700/50 shadow-lg h-16">
      <div className="flex items-center justify-center h-full px-4 relative">
        {/* Menu Toggle Button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="absolute left-4 p-2 rounded-lg hover:bg-gray-700/50 transition-colors text-white"
          aria-label="Toggle sidebar"
        >
          {isExpanded ? (
            <PanelLeftClose className="w-6 h-6" />
          ) : (
            <PanelLeft className="w-6 h-6" />
          )}
        </button>

        {/* Logo - Centralizado */}
        <div className="flex items-center">
            <h1 className="text-white text-2xl font-bold font-boogaloo tracking-wide">Lucas FII <span className="font-space-grotesk text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400 font-bold tracking-wider">Alerts 🔔</span></h1>
          {/* <Image
            src="/logo2.png"
            alt="Lucas FII Alerts"
            width={150}
            height={40}
            className="object-contain"
          /> */}
        </div>

        {/* === Credits/Version Button === */}

        <Link
          href="/version-credits"
          className="absolute right-4 p-2 rounded-lg hover:bg-gray-700/50 transition-colors text-white"
          aria-label="Versão e Créditos"
        >
          <Info className="w-6 h-6" />
        </Link>
      </div>
    </nav>
  );
}
