"use client";

import { Settings } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";

interface PageHeaderProps {
  title: string;
  session?: {
    user?: {
      name?: string;
      email?: string;
      image?: string;
    };
  };
}

export function PageHeader({ title, session }: PageHeaderProps) {
  const router = useRouter();
  const [imageError, setImageError] = useState(false);
  // Componente Avatar customizado para mobile (mais robusto - trata erro de carregamento e usa crossOrigin/referrerPolicy)
  const MobileUserAvatar = () => {
    const [imgError, setImgError] = useState(false);
    const userName = session?.user?.name || session?.user?.email || "Usuário";
    const userImage = session?.user?.image;
    const initials = userName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

    if (userImage && !imgError) {
      return (
        <img
          src={userImage}
          alt={userName}
          title={userName}
          className="w-8 h-8 rounded-full object-cover border-2 border-blue-400 shadow-lg"
          onLoad={() => {
            /* imagem carregou com sucesso */
          }}
          onError={(e) => {
            // Esconder a imagem e marcar erro para renderizar as iniciais
            try {
              (e.currentTarget as HTMLImageElement).style.display = 'none';
            } catch {
              /* ignore */
            }
            setImgError(true);
          }}
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
          loading="lazy"
        />
      );
    }

    return (
      <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0 border-2 border-blue-400 shadow-lg">
        <span className="text-white text-sm font-bold">{initials}</span>
      </div>
    );
  };

  return (
    <header className="bg-[#1a1a35] border-b border-gray-800 px-4 py-3 relative z-10">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-gradient-to-br from-black-400 via-black-500 to-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-xl transition-all duration-300 hover:scale-110 hover:shadow-2xl w-12 h-12">
            <span className="font-space-grotesk text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400 font-bold tracking-wider"> 🚀</span>
          </div>
          <div>
            <h1 className="text-white font-bold text-lg bg-gradient-to-r from-cyan-300 via-blue-400 to-indigo-500 bg-clip-text text-transparent tracking-wide font-orbitron">
              Lucas FII
            </h1>
            <p className="text-blue-300 text-xs font-medium tracking-wider uppercase font-mono">
              Alerts
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/configuration")}
            className="text-white hover:bg-gray-700 cursor-pointer"
          >
            <Settings className="w-5 h-5" />
          </Button>
          <MobileUserAvatar />
        </div>
      </div>
    </header>
  );
}
