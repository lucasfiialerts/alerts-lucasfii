"use client";

import { CrownIcon, HelpCircle, Home, Settings,TrendingUp } from "lucide-react";

interface BottomNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function BottomNavigation({ activeTab, onTabChange }: BottomNavigationProps) {
  const navItems = [
    { id: "home", label: "Home", icon: Home },
    { id: "my-follow", label: "Ativos", icon: TrendingUp },
    { id: "planos", label: "Planos", icon: CrownIcon },
    { id: "configuracao", label: "Configs", icon: Settings },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-[#1a1a35] border-t border-gray-800 lg:hidden z-50">
      <div className="grid grid-cols-4">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`flex flex-col items-center justify-center py-2 px-3 transition-colors duration-200 cursor-pointer ${
              activeTab === item.id
                ? "text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <item.icon 
              className={`w-6 h-6 mb-1 ${
                activeTab === item.id ? "text-white" : "text-gray-400"
              }`} 
            />
            <span className="text-xs font-medium">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
