import { Bot, Loader2, Share2, Check, Volume2, VolumeX } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Função para processar e limpar o texto da IA
function processAIText(text: string): string {
  if (!text) return '';
  
  let cleaned = text
    // Remover todos os prefixos do streaming (0:", 1:", etc)
    .replace(/\d+:"/g, '')
    .replace(/\d+:/g, '')
    // Remover caracteres de escape ANTES de processar quebras de linha
    .replace(/\\n/g, '\n')
    .replace(/\\t/g, '\t')
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, '\\')
    // Remover barras invertidas soltas que sobraram
    .replace(/\\/g, '')
    // Limpar múltiplas quebras de linha consecutivas
    .replace(/\n{3,}/g, '\n\n')
    // Trim espaços em branco no início e fim
    .trim();
  
  // Remover aspas duplas no início e fim (múltiplas passagens para garantir)
  while (cleaned.startsWith('"') || cleaned.endsWith('"')) {
    cleaned = cleaned.replace(/^"+/, '').replace(/"+$/, '');
  }
  
  return cleaned;
}

export type ChatMessageData = {
  id: string;
  role: "user" | "assistant" | "system";
  content?: string;
  parts?: Array<{ type: "text"; text: string } | { type: "image"; image: string }>;
};

interface ChatMessageProps {
  message: ChatMessageData;
  isStreaming?: boolean;
  audioMode?: boolean;
}

export const ChatMessage = ({
  message,
  isStreaming = false,
  audioMode = false,
}: ChatMessageProps) => {
  const [copied, setCopied] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hasPlayedRef = useRef(false);
  
  const isUser = message.role === "user";
  const isSystem = message.role === "system";

  // Garantir que parts seja sempre um array válido
  const safeParts = Array.isArray(message.parts) ? message.parts : [];

  const content = processAIText(
    safeParts.length
      ? safeParts
          .filter((part) => part.type === "text")
          .map((part) => part.text)
          .join("")
      : message.content || ""
  );

  // Efeito para gerar e reproduzir áudio automaticamente usando Web Speech API
  useEffect(() => {
    if (!audioMode || isUser || isSystem || isStreaming || hasPlayedRef.current) {
      return;
    }

    if (content && content.length > 0) {
      hasPlayedRef.current = true;
      
      // Verificar se o navegador suporta Web Speech API
      if (!('speechSynthesis' in window)) {
        toast.error('Seu navegador não suporta síntese de voz');
        return;
      }

      // Limpar falas anteriores
      window.speechSynthesis.cancel();
      
      // Criar utterance (fala)
      const utterance = new SpeechSynthesisUtterance(content);
      utterance.lang = 'pt-BR';
      utterance.rate = 1.0; // Velocidade normal
      utterance.pitch = 1.0; // Tom normal
      
      // Tentar encontrar uma voz brasileira
      const voices = window.speechSynthesis.getVoices();
      const brVoice = voices.find(voice => voice.lang.startsWith('pt-BR'));
      if (brVoice) {
        utterance.voice = brVoice;
      }
      
      utterance.onstart = () => setIsPlayingAudio(true);
      utterance.onend = () => setIsPlayingAudio(false);
      utterance.onerror = () => {
        setIsPlayingAudio(false);
        toast.error('Erro ao reproduzir áudio');
      };
      
      // Reproduzir automaticamente
      window.speechSynthesis.speak(utterance);
      setAudioUrl('web-speech'); // Marker para indicar que tem áudio
    }

    return () => {
      window.speechSynthesis.cancel();
    };
  }, [content, audioMode, isUser, isSystem, isStreaming]);

  const toggleAudio = () => {
    if (isPlayingAudio) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
    } else {
      // Recriar e reproduzir
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(content);
      utterance.lang = 'pt-BR';
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      
      const voices = window.speechSynthesis.getVoices();
      const brVoice = voices.find(voice => voice.lang.startsWith('pt-BR'));
      if (brVoice) {
        utterance.voice = brVoice;
      }
      
      utterance.onstart = () => setIsPlayingAudio(true);
      utterance.onend = () => setIsPlayingAudio(false);
      utterance.onerror = () => setIsPlayingAudio(false);
      
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      toast.success("Resposta copiada!");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("Erro ao copiar");
    }
  };

  if (isSystem) {
    return (
      <div className="flex w-full flex-col gap-3 px-2 pt-4 pb-0 sm:px-4 sm:pt-5">
        <div className="flex w-full flex-col gap-2.5 rounded-xl border border-white/5 bg-white/[0.02] p-4">
          <div className="flex w-full items-center justify-center gap-2.5">
            <p className="grow basis-0 text-center text-sm leading-relaxed font-normal text-white/60">
              {content}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (isUser) {
    const textParts = safeParts.filter((part) => part.type === "text");
    const imageParts = safeParts.filter((part) => part.type === "image");
    
    const textContent = processAIText(
      textParts.length
        ? textParts.map((part: any) => part.text).join("")
        : message.content || ""
    );

    return (
      <div className="flex w-full flex-col items-end gap-3 pt-4 pr-2 pb-0 pl-8 sm:pt-5 sm:pr-4 sm:pl-10">
        <div className="flex max-w-[85%] flex-col gap-2 rounded-2xl bg-white/[0.08] px-4 py-3 sm:max-w-[75%]">
          {imageParts.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {imageParts.map((part: any, idx: number) => (
                <img
                  key={idx}
                  src={part.image}
                  alt="Uploaded"
                  className="max-w-full rounded-lg"
                  style={{ maxHeight: '200px' }}
                />
              ))}
            </div>
          )}
          {textContent && (
            <p className="text-[15px] leading-relaxed font-normal text-white/95 break-words whitespace-pre-wrap">
              {textContent}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-3 pt-4 pr-2 pb-0 pl-2 sm:pt-5 sm:pr-4 sm:pl-3">
      <div className="flex w-full gap-3">
        <div className="relative flex size-8 shrink-0 items-center justify-center rounded-full bg-white/[0.08]">
          <Bot className="size-4 text-white/80" />
          {isStreaming && (
            <div className="absolute -bottom-0.5 -right-0.5 flex size-3.5 items-center justify-center rounded-full bg-blue-500">
              <Loader2 className="size-2.5 text-white animate-spin" />
            </div>
          )}
        </div>
        <div className="flex-1">
          <div className="max-w-full text-[15px] leading-relaxed font-normal text-white/90 break-words prose prose-invert prose-sm max-w-none">
            <ReactMarkdown 
              remarkPlugins={[remarkGfm]}
              components={{
                // Estilos personalizados para elementos markdown
                p: ({children}) => <p className="mb-3 last:mb-0">{children}</p>,
                ul: ({children}) => <ul className="mb-3 ml-4 list-disc space-y-1">{children}</ul>,
                ol: ({children}) => <ol className="mb-3 ml-4 list-decimal space-y-1">{children}</ol>,
                li: ({children}) => <li className="ml-2">{children}</li>,
                strong: ({children}) => <strong className="font-bold text-white">{children}</strong>,
                h1: ({children}) => <h1 className="text-xl font-bold mb-3 mt-4">{children}</h1>,
                h2: ({children}) => <h2 className="text-lg font-bold mb-2 mt-3">{children}</h2>,
                h3: ({children}) => <h3 className="text-base font-bold mb-2 mt-2">{children}</h3>,
                code: ({children}) => <code className="bg-white/10 px-1.5 py-0.5 rounded text-sm">{children}</code>,
              }}
            >
              {content}
            </ReactMarkdown>
          </div>
          {!isStreaming && content && (
            <div className="mt-2 flex items-center gap-2">
              <button
                onClick={handleCopyMessage}
                className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-white/50 transition-colors hover:bg-white/[0.05] hover:text-white/80"
                title="Copiar resposta"
              >
                {copied ? (
                  <>
                    <Check className="size-3.5" />
                    <span>Copiado!</span>
                  </>
                ) : (
                  <>
                    <Share2 className="size-3.5" />
                    <span>Compartilhar resposta</span>
                  </>
                )}
              </button>
              
              {audioMode && audioUrl && (
                <button
                  onClick={toggleAudio}
                  className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-white/50 transition-colors hover:bg-white/[0.05] hover:text-white/80"
                  title={isPlayingAudio ? 'Pausar áudio' : 'Reproduzir áudio'}
                >
                  {isPlayingAudio ? (
                    <>
                      <VolumeX className="size-3.5" />
                      <span>Pausar</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="size-3.5" />
                      <span>Ouvir</span>
                    </>
                  )}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
