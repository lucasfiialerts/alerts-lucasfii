"use client";

import { Bot, Check, ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const AI_PROVIDERS = [


  {
    id: 'llama4-vision',
    name: 'Qwen IA',
    defaultLabel: 'Agente 3',
    description: 'Visão computacional com Qwen 2.5',
    subtitle: 'Análises de imagens e Respostas em textos',
    badge: 'BETA',
    icon: '🤖',
    disabled: false,
  },

  {
    id: 'groq-llama',
    name: 'Groq',
    defaultLabel: 'Agente 2',
    description: 'Ultra rápido',
    subtitle: '(Apenas texto)',
    badge: 'EM BREVE',
    // badge: 'BETA',
    // badge: 'NOVO',
    icon: '💬',
    disabled: true,
  },

  // {
  //   id: 'gemini-flash',
  //   name: 'Gemini',
  //   defaultLabel: 'Agente 1',
  //   description: 'Rápido e eficiente',
  //   subtitle: 'Análises de imagens e Respostas em textos',
  //   badge: 'EM BREVE',
  //   icon: '⚡',
  //   disabled: true,
  // },


];

interface AiProviderSelectorProps {
  onProviderChange?: () => void;
}

export function AiProviderSelector({ onProviderChange }: AiProviderSelectorProps) {
  const [selectedProvider, setSelectedProvider] = useState('llama4-vision'); // Qwen IA como padrão
  const [customNames, setCustomNames] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const response = await fetch('/api/ai-preferences');
      if (response.ok) {
        const data = await response.json();
        setSelectedProvider(data.selectedProvider);
        if (data.customName) {
          setCustomNames({ [data.selectedProvider]: data.customName });
        }
      }
    } catch (error) {
      console.error('Erro ao carregar preferências:', error);
    }
  };

  const handleSelectProvider = async (providerId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/ai-preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider: providerId,
          customName: customNames[providerId] || null,
        }),
      });

      if (response.ok) {
        setSelectedProvider(providerId);
        toast.success('IA alterada com sucesso!');
        setIsOpen(false);
        onProviderChange?.();
      } else {
        toast.error('Erro ao selecionar IA');
      }
    } catch (error) {
      console.error('Erro ao selecionar provedor:', error);
      toast.error('Erro ao selecionar IA');
    } finally {
      setIsLoading(false);
    }
  };

  const getCurrentProvider = () => {
    return AI_PROVIDERS.find(p => p.id === selectedProvider);
  };

  const getCurrentProviderLabel = () => {
    const provider = getCurrentProvider();
    if (!provider) return 'Selecionar IA';
    return customNames[selectedProvider] || provider.name;
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 border border-white/10 bg-white/[0.03] text-white/90 hover:bg-white/[0.06] hover:text-white h-9 px-3"
        >
          <span className="text-sm font-medium">{getCurrentProviderLabel()}</span>
          <ChevronDown className="size-4 text-white/60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-80 border-white/10 bg-[#1f1f1f] text-white p-2"
      >
        <DropdownMenuLabel className="text-xs text-white/60 font-normal px-2 pb-2">
          Escolher modelo
        </DropdownMenuLabel>

        {AI_PROVIDERS.map((provider) => (
          <DropdownMenuItem
            key={provider.id}
            onClick={() => !provider.disabled && handleSelectProvider(provider.id)}
            disabled={isLoading || provider.disabled}
            className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${provider.disabled
                ? 'opacity-50 cursor-not-allowed bg-white/[0.02]'
                : selectedProvider === provider.id
                  ? 'bg-blue-600/15 text-white cursor-pointer'
                  : 'hover:bg-blue-600/[0.02] text-blue/90 cursor-pointer'
              }`}
          >
            <span className={`text-2xl mt-0.5 ${provider.disabled ? 'grayscale opacity-60' : ''}`}>
              {provider.icon}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className={`font-semibold text-sm ${provider.disabled ? 'text-white/40' : ''}`}>
                  {provider.name}
                </span>
                {provider.badge && (
                  <span className={`px-1.5 py-0.5 text-[10px] font-semibold rounded ${provider.badge === 'EM BREVE'
                      ? 'bg-orange-600/30 text-orange-400 border border-orange-600/50'
                      : 'bg-blue-600/30 text-blue-400 border border-blue-600/50'
                    }`}>
                    {provider.badge}
                  </span>
                )}
                {selectedProvider === provider.id && !provider.disabled && (
                  <Check className="size-4 text-blue-400" />
                )}
              </div>
              <p className={`text-xs mt-0.5 ${provider.disabled ? 'text-white/30' : 'text-white/60'}`}>
                {provider.subtitle}
              </p>
            </div>
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator className="bg-white/10 my-2" />

        <div className="px-2 py-2">
          <p className="text-xs text-white/50">
            Troque de modelo a qualquer momento
          </p>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
