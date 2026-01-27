"use client";

import { Paperclip, Send, Mic, MicOff, Maximize2, Minimize2, X, Plus, Image, FileText, HardDrive, Camera, Code, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ReactNode, useState, useRef } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
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

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    const file = files[0];

    if (file) {
      const isImage = file.type.startsWith('image/');
      const isPDF = file.type === 'application/pdf';

      if ((isImage || isPDF) && onImageUpload) {
        onImageUpload(file);
      }
    }
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
    <>
      {/* Modal de tela cheia */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-4xl h-[80vh] flex flex-col gap-3 rounded-3xl border border-white/10 bg-[#2f2f2f] p-6">
            {/* Header com botão fechar */}
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-white/90 font-medium">Escreva sua mensagem</h3>
              <Button
                size="icon"
                variant="ghost"
                className="size-8 rounded-lg text-white/60 hover:bg-white/[0.08] hover:text-white/90"
                onClick={() => setIsFullscreen(false)}
              >
                <X className="size-4" />
              </Button>
            </div>

            {/* Textarea expandido */}
            <div className="flex-1 overflow-hidden">
              <style jsx>{`
                textarea::-webkit-scrollbar {
                  width: 6px;
                }
                textarea::-webkit-scrollbar-track {
                  background: transparent;
                }
                textarea::-webkit-scrollbar-thumb {
                  background: #2e2e2e;
                  border-radius: 10px;
                }
                textarea::-webkit-scrollbar-thumb:hover {
                  background: #3e3e3e;
                }
              `}</style>
              <textarea
                value={input}
                onChange={onChange}
                onKeyDown={handleKeyDown}
                placeholder="Pergunte ao Research.IA"
                className="w-full h-full resize-none bg-transparent text-[15px] text-white/95 placeholder:text-white/50 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 overflow-y-auto leading-6 p-4 rounded-xl border border-white/5"
                disabled={isLoading}
                autoFocus
              />
            </div>

            {/* Botões de ação */}
            <div className="flex items-center gap-2 pt-2 border-t border-white/5">
              <Button
                size="icon"
                type="button"
                variant="ghost"
                className="size-9 shrink-0 rounded-xl text-white/60 hover:bg-white/[0.08] hover:text-white/90"
                onClick={handleImageClick}
                disabled={isLoading}
                title="Anexar arquivo"
              >
                <Paperclip className="size-4" />
              </Button>

              {aiProviderSelector && (
                <div className="shrink-0">
                  {aiProviderSelector}
                </div>
              )}

              <div className="flex-1" />

              <Button
                size="icon"
                type="button"
                variant="ghost"
                className={`size-9 shrink-0 rounded-xl transition-all ${isRecording
                    ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 animate-pulse'
                    : 'text-white/60 hover:bg-white/[0.08] hover:text-white/90'
                  }`}
                onClick={toggleVoiceRecording}
                disabled={isLoading}
                title={isRecording ? "Parar gravação" : "Gravar áudio"}
              >
                {isRecording ? <MicOff className="size-4" /> : <Mic className="size-4" />}
              </Button>

              <Button
                size="icon"
                type="button"
                className="size-9 shrink-0 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-white/[0.08] disabled:text-white/30 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95"
                onClick={onSubmit}
                disabled={isLoading || !input.trim()}
                title="Enviar mensagem"
              >
                <Send className="size-4 text-white" />
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="flex w-full flex-col gap-3">
        {pdfAttached && (
          <div className="flex items-center gap-2 rounded-lg bg-blue-500/10 px-3 py-2 text-sm text-blue-400">
            <span>📄 {pdfAttached.fileName} ({pdfAttached.pages} páginas extraídas)</span>
          </div>
        )}

        {/* Card único estilo Gemini com todos os controles integrados + Drag and Drop */}
        <div 
          className={`flex w-full flex-col gap-2 rounded-3xl border transition-all focus-within:border-white/20 relative ${
            isDragging 
              ? 'border-blue-500 bg-blue-500/10' 
              : 'border-white/10 bg-[#2f2f2f] hover:bg-[#343434]'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {/* Overlay de drag and drop */}
          {isDragging && (
            <div className="absolute inset-0 z-10 flex items-center justify-center rounded-3xl bg-blue-500/20 backdrop-blur-sm border-2 border-blue-500 border-dashed">
              <div className="flex flex-col items-center gap-2 text-blue-400">
                <Image className="size-8" />
                <p className="text-sm font-medium">Solte os arquivos aqui</p>
              </div>
            </div>
          )}

          <div className={`px-4 py-3 ${isDragging ? 'pointer-events-none' : ''}`}>
          {/* Botão de tela cheia no canto superior direito */}
          <button
            onClick={() => setIsFullscreen(true)}
            className="absolute top-3 right-3 p-1.5 rounded-lg text-white/40 hover:text-white/70 hover:bg-white/[0.05] transition-all"
            title="Tela cheia"
            type="button"
          >
            <Maximize2 className="size-4" />
          </button>

          {/* Input de texto no topo */}
          <div className="w-full pr-8">
            <style jsx>{`
            textarea::-webkit-scrollbar {
              width: 6px;
            }
            textarea::-webkit-scrollbar-track {
              background: transparent;
            }
            textarea::-webkit-scrollbar-thumb {
              background: #2e2e2e;
              border-radius: 10px;
            }
            textarea::-webkit-scrollbar-thumb:hover {
              background: #3e3e3e;
            }
          `}</style>
            <textarea
              value={input}
              onChange={onChange}
              onKeyDown={handleKeyDown}
              placeholder="Pergunte ao Research.IA"
              rows={1}
              className="w-full resize-none bg-transparent text-[15px] text-white/95 placeholder:text-white/50 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 max-h-[160px] overflow-y-auto leading-6"
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

          {/* Botões de ação embaixo */}
          <div className="flex items-center gap-2">
            {/* Menu de anexos */}
            <DropdownMenu open={showAttachMenu} onOpenChange={setShowAttachMenu}>
              <DropdownMenuTrigger asChild>
                <Button
                  size="icon"
                  type="button"
                  variant="ghost"
                  className="size-9 shrink-0 rounded-xl text-white/60 hover:bg-white/[0.08] hover:text-white/90"
                  disabled={isLoading}
                  title="Adicionar anexo"
                >
                  <Plus className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                className="w-56 bg-[#1e1e1e] border-white/10 text-white"
                sideOffset={8}
              >
                <DropdownMenuItem
                  onClick={handleImageClick}
                  className="gap-3 py-2.5 text-white/80 hover:bg-white/[0.08] hover:text-white/95 focus:bg-white/[0.08] focus:text-white/95 cursor-pointer"
                >
                  <Image className="size-4" />
                  <span>Enviar arquivos</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    // Abrir Google Drive em popup otimizado
                    const width = 1200;
                    const height = 800;
                    const left = (window.screen.width - width) / 2;
                    const top = (window.screen.height - height) / 2;
                    window.open(
                      'https://drive.google.com/drive/my-drive',
                      'GoogleDrivePicker',
                      `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes,status=yes`
                    );
                    setShowAttachMenu(false);
                  }}
                  className="gap-3 py-2.5 text-white/80 hover:bg-white/[0.08] hover:text-white/95 focus:bg-white/[0.08] focus:text-white/95 cursor-pointer"
                >
                  <HardDrive className="size-4" />
                  <span>Adicionar do Drive</span>
                </DropdownMenuItem>

                {/* <DropdownMenuItem
                disabled
                className="gap-3 py-2.5 text-white/40 cursor-not-allowed"
              >
                <Camera className="size-4" />
                <span>Fotos</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled
                className="gap-3 py-2.5 text-white/40 cursor-not-allowed"
              >
                <Code className="size-4" />
                <span>Importar código</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled
                className="gap-3 py-2.5 text-white/40 cursor-not-allowed"
              >
                <BookOpen className="size-4" />
                <span>NotebookLM</span>
              </DropdownMenuItem>
               */}

              </DropdownMenuContent>
            </DropdownMenu>

            {/* Seletor de IA (se fornecido) */}
            {aiProviderSelector && (
              <div className="shrink-0">
                {aiProviderSelector}
              </div>
            )}

            <div className="flex-1" />

            {/* Botão de voz */}
            <Button
              size="icon"
              type="button"
              variant="ghost"
              className={`size-9 shrink-0 rounded-xl transition-all ${isRecording
                  ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 animate-pulse'
                  : 'text-white/60 hover:bg-white/[0.08] hover:text-white/90'
                }`}
              onClick={toggleVoiceRecording}
              disabled={isLoading}
              title={isRecording ? "Parar gravação" : "Gravar áudio"}
            >
              {isRecording ? <MicOff className="size-4" /> : <Mic className="size-4" />}
            </Button>

            {/* Botão de enviar */}
            <Button
              size="icon"
              type="button"
              className="size-9 shrink-0 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-white/[0.08] disabled:text-white/30 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95"
              onClick={onSubmit}
              disabled={isLoading || !input.trim()}
              title="Enviar mensagem"
            >
              <Send className="size-4 text-white" />
            </Button>
          </div>
          </div>
        </div>
      </div>
    </>
  );
};
