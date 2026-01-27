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
    id: 'gemini-flash',
    name: 'Gemini Flash',
    defaultLabel: 'Agente 1',
    description: 'Rápido e eficiente',
    subtitle: 'Respostas rápidas',
    icon: '⚡',
  },
  {
    id: 'groq-llama',
    name: 'Groq Llama 3.3',
    defaultLabel: 'Agente 2',
    description: 'Ultra rápido',
    subtitle: 'Velocidade extrema de processamento',
    icon: '🚀',
  },
];

interface AiProviderSelectorProps {
  onProviderChange?: () => void;
}

export function AiProviderSelector({ onProviderChange }: AiProviderSelectorProps) {
  const [selectedProvider, setSelectedProvider] = useState('gemini-flash');
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
            onClick={() => handleSelectProvider(provider.id)}
            disabled={isLoading}
            className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
              selectedProvider === provider.id
                ? 'bg-blue-600/15 text-white'
                : 'hover:bg-blue-600/[0.02] text-blue/90'
            }`}
          >
            <span className="text-2xl mt-0.5">{provider.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm">{provider.name}</span>
                {selectedProvider === provider.id && (
                  <Check className="size-4 text-blue-400" />
                )}
              </div>
              <p className="text-xs text-white/60 mt-0.5">
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
