"use client";

import { Paperclip, Send, Mic, MicOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ReactNode, useState, useRef } from "react";

interface ChatInputProps {
  input: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading?: boolean;
  onImageUpload?: (file: File) => void;
  pdfAttached?: { fileName: string; pages: number } | null;
  aiProviderSelector?: ReactNode;
  onVoiceInput?: (text: string) => void;
}

export const ChatInput = ({
  input,
  onChange,
  onSubmit,
  isLoading,
  onImageUpload,
  pdfAttached,
  aiProviderSelector,
  onVoiceInput,
}: ChatInputProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSubmit(e);
    }
    // Shift+Enter permite quebra de linha naturalmente
  };

  const handleImageClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,application/pdf';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file && onImageUpload) {
        onImageUpload(file);
      }
    };
    input.click();
  };

  const toggleVoiceRecording = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Seu navegador não suporta reconhecimento de voz. Use Chrome ou Edge.');
      return;
    }

    if (isRecording) {
      // Para a gravação
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsRecording(false);
    } else {
      // Inicia a gravação
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.lang = 'pt-BR';
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }

        if (finalTranscript && onVoiceInput) {
          onVoiceInput(input + finalTranscript);
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Erro no reconhecimento de voz:', event.error);
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
      setIsRecording(true);
    }
  };

  return (
    <div className="flex w-full flex-col gap-3">
      {pdfAttached && (
        <div className="flex items-center gap-2 rounded-lg bg-blue-500/10 px-3 py-2 text-sm text-blue-400">
          <span>📄 {pdfAttached.fileName} ({pdfAttached.pages} páginas extraídas)</span>
        </div>
      )}
      
      {/* Card único estilo Gemini com todos os controles integrados */}
      <div className="flex w-full items-end gap-2 rounded-3xl border border-white/10 bg-[#2f2f2f] pl-4 pr-3 py-3 transition-all hover:bg-[#343434] focus-within:border-white/20">
        {/* Botão de anexar */}
        <Button
          size="icon"
          type="button"
          variant="ghost"
          className="size-10 shrink-0 rounded-xl text-white/60 hover:bg-white/[0.08] hover:text-white/90"
          onClick={handleImageClick}
          disabled={isLoading}
          title="Anexar arquivo"
        >
          <Paperclip className="size-5" />
        </Button>
        
        {/* Seletor de IA (se fornecido) */}
        {aiProviderSelector && (
          <div className="shrink-0">
            {aiProviderSelector}
          </div>
        )}
        
        {/* Input de texto - com padding para separar dos botões */}
        <div className="flex-1 px-2 py-1">
          <textarea
            value={input}
            onChange={onChange}
            onKeyDown={handleKeyDown}
            placeholder="Pergunte ao Research.IA"
            rows={1}
            className="w-full resize-none bg-transparent text-[15px] text-white/95 placeholder:text-white/50 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 max-h-[160px] overflow-y-auto leading-6 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent"
            disabled={isLoading}
            style={{
              minHeight: '32px',
              height: 'auto',
            }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = Math.min(target.scrollHeight, 160) + 'px';
            }}
          />
        </div>
        
        {/* Botão de voz */}
        <Button
          size="icon"
          type="button"
          variant="ghost"
          className={`size-10 shrink-0 rounded-xl transition-all ${
            isRecording 
              ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 animate-pulse' 
              : 'text-white/60 hover:bg-white/[0.08] hover:text-white/90'
          }`}
          onClick={toggleVoiceRecording}
          disabled={isLoading}
          title={isRecording ? "Parar gravação" : "Gravar áudio"}
        >
          {isRecording ? <MicOff className="size-5" /> : <Mic className="size-5" />}
        </Button>
        
        {/* Botão de enviar */}
        <Button
          size="icon"
          type="button"
          className="size-10 shrink-0 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-white/[0.08] disabled:text-white/30 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95"
          onClick={onSubmit}
          disabled={isLoading || !input.trim()}
          title="Enviar mensagem"
        >
          <Send className="size-4 text-white" />
        </Button>
      </div>
    </div>
  );
};
