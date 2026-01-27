"use client";

import { Bot, Sparkles, Menu, Lightbulb, Copy, Check, SquarePen, Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { ChatInput } from "@/app/api/chat/_components/chat-input";
import { ChatMessage, type ChatMessageData } from "@/app/api/chat/_components/chat-message";
import { Button } from "@/components/ui/button";
import { ChatSidebar } from "./chat-sidebar";
import { AiProviderSelector } from "./ai-provider-selector";
import HoverGlitch from "@/components/ui/hover-glitch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  createConversation, 
  getConversationMessages, 
  saveMessage 
} from "@/actions/chat-conversations";

const suggestions = [
  {
    id: 1,
    title: "Quais são os melhores FIIs para investir em 2026?",
  },
  {
    id: 2,
    title: "Como montar uma carteira diversificada de fundos imobiliários?",
  },
  {
    id: 3,
    title: "Qual a diferença entre FIIs de tijolo, papel e híbridos?",
  },
  {
    id: 4,
    title: "Como analisar o dividend yield e o P/VP de um FII?",
  },
];

const toTextParts = (text: string) => [{ type: "text" as const, text }];

interface ChatIaPageProps {
  userName?: string;
}

export function ChatIaPage({ userName = 'Usuário' }: ChatIaPageProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<string | undefined>(undefined);
  
  const initialMessages = useMemo<ChatMessageData[]>(
    () => [],
    [],
  );

  const [messages, setMessages] = useState<ChatMessageData[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [extractedPdfData, setExtractedPdfData] = useState<{ fileName: string; text: string; pages: number } | null>(null);
  const [showSuggestionsModal, setShowSuggestionsModal] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isLoading]);

  const handleSuggestion = (text: string) => {
    void sendMessage(text);
  };

  const handleCopySuggestion = async (text: string, id: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      toast.success("Mensagem copiada!");
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      toast.error("Erro ao copiar");
    }
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(event.target.value);
  };

  const handleVoiceInput = (text: string) => {
    setInput(text);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (!input.trim() || isLoading) {
      return;
    }

    void sendMessage(input.trim());
  };

  const handleImageUpload = async (file: File) => {
    // Se for PDF, processar o texto
    if (file.type === 'application/pdf') {
      toast.info('Processando PDF...');
      
      try {
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await fetch('/api/extract-pdf', {
          method: 'POST',
          body: formData,
        });
        
        const data = await response.json();
        
        if (data.success) {
          // Armazenar dados do PDF sem preencher o input
          setExtractedPdfData({
            fileName: data.fileName,
            text: data.text,
            pages: data.pages
          });
          toast.success(`PDF processado! ${data.pages} páginas extraídas. Digite sua pergunta.`);
        } else {
          toast.error(data.error || 'Erro ao processar PDF');
        }
      } catch (error) {
        console.error('Erro ao processar PDF:', error);
        toast.error('Erro ao processar PDF');
      }
    } else {
      // Se for imagem, processar como antes
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        setSelectedImage(base64);
        toast.success("Imagem anexada! Digite sua pergunta e envie.");
      };
      reader.readAsDataURL(file);
    }
  };

  const getMessageText = (message: ChatMessageData) =>
    message.parts?.length
      ? message.parts
          .filter((part) => part.type === "text")
          .map((part) => part.text)
          .join("")
      : message.content || "";

  const sendMessage = async (text: string) => {
    if (isLoading) {
      return;
    }

    // Preparar o texto final (incluindo PDF se houver)
    let finalText = text;
    if (extractedPdfData) {
      const pdfIntro = `📄 **PDF: ${extractedPdfData.fileName}** (${extractedPdfData.pages} páginas)\n\n`;
      const pdfContent = extractedPdfData.text.substring(0, 100000); // Limite de 100k caracteres
      finalText = `${pdfIntro}${pdfContent}\n\n**Minha pergunta:** ${text}`;
    }

    // Create conversation if doesn't exist
    let conversationId = currentConversationId;
    if (!conversationId) {
      const result = await createConversation(text.substring(0, 50));
      if (result.success && result.conversation) {
        conversationId = result.conversation.id;
        setCurrentConversationId(conversationId);
        
        // Refresh sidebar to show new conversation
        if ((window as any).__refreshChatConversations) {
          await (window as any).__refreshChatConversations();
        }
      } else {
        toast.error("Erro ao criar conversa");
        return;
      }
    }

    const userMessage: ChatMessageData = {
      id: crypto.randomUUID(),
      role: "user",
      content: finalText,
      parts: selectedImage 
        ? [{ type: "text" as const, text: finalText }, { type: "image" as const, image: selectedImage }]
        : toTextParts(finalText),
    };

    const assistantMessageId = crypto.randomUUID();
    const assistantMessage: ChatMessageData = {
      id: assistantMessageId,
      role: "assistant",
      content: "",
      parts: toTextParts(""),
    };

    setMessages((prev) => [...prev, userMessage, assistantMessage]);
    setInput("");
    setSelectedImage(null); // Clear selected image after sending
    setExtractedPdfData(null); // Clear PDF data after sending
    setIsLoading(true);

    // Save user message to backend
    if (conversationId) {
      await saveMessage(conversationId, "user", text, userMessage.parts);
    }

    try {
      const response = await fetch("/api/chat-ia", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((message) => ({
            role: message.role,
            content: getMessageText(message),
            parts: message.parts,
          })),
        }),
      });

      if (!response.ok || !response.body) {
        // Try to parse error message from response
        let errorMessage = "Erro ao processar mensagem. Tente novamente mais tarde.";
        try {
          const errorData = await response.json();
          if (errorData.error) {
            errorMessage = errorData.error;
          }
        } catch (e) {
          // Use default message if parsing fails
        }
        
        toast.error(errorMessage);
        throw new Error(errorMessage);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantText = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) {
          break;
        }

        assistantText += decoder.decode(value, { stream: true });

        setMessages((prev) =>
          prev.map((message) =>
            message.id === assistantMessageId
              ? {
                  ...message,
                  content: assistantText,
                  parts: toTextParts(assistantText),
                }
              : message,
          ),
        );
      }

      // Save assistant message to backend
      if (conversationId && assistantText) {
        await saveMessage(conversationId, "assistant", assistantText);
      }
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
      toast.error("Erro ao processar mensagem. Tente novamente mais tarde.");
      
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "system",
          content: "Não foi possível obter resposta da IA. Tente novamente mais tarde.",
          parts: toTextParts(
            "Não foi possível obter resposta da IA. Tente novamente mais tarde.",
          ),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const hasUserMessages = messages.some((message) => message.role === "user");

  const handleNewConversation = () => {
    setMessages(initialMessages);
    setInput("");
    setCurrentConversationId(undefined);
  };

  const handleSelectConversation = async (id: string) => {
    setCurrentConversationId(id);
    
    // Load messages from backend
    const result = await getConversationMessages(id);
    console.log('📥 Mensagens carregadas:', result);
    
    if (result.success && result.messages) {
      const loadedMessages: ChatMessageData[] = result.messages.map(msg => {
        console.log('📝 Processando mensagem:', { id: msg.id, parts: msg.parts, partsType: typeof msg.parts });
        
        return {
          id: msg.id,
          role: msg.role as "user" | "assistant" | "system",
          content: msg.content,
          parts: (msg.parts && Array.isArray(msg.parts)) ? msg.parts as any : toTextParts(msg.content),
        };
      });
      setMessages(loadedMessages.length > 0 ? loadedMessages : initialMessages);
    } else {
      toast.error(result.error || "Erro ao carregar mensagens");
      setMessages(initialMessages);
    }
  };

  return (
    <div className="relative flex h-full overflow-hidden" style={{ backgroundColor: '#141414' }}>
      {/* Sidebar estilo Gemini - fixo à esquerda (apenas desktop) */}
      <div className="hidden md:flex flex-shrink-0 w-16 bg-[#1e1e1e] border-r border-white/5 flex-col items-center py-4 gap-6">
        {/* Menu hamburger no topo */}
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 rounded-xl text-white/60 hover:bg-white/[0.08] hover:text-white/90"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        >
          <Menu className="size-5" />
        </Button>
        
        {/* Botão nova conversa */}
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 rounded-xl text-white/60 hover:bg-white/[0.08] hover:text-white/90"
          onClick={handleNewConversation}
          title="Nova conversa"
        >
          <SquarePen className="size-5" />
        </Button>
        
        {/* Spacer para empurrar config pro final */}
        <div className="flex-1" />
        
        {/* Botão de sugestões no final */}
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 rounded-xl text-white/60 hover:bg-white/[0.08] hover:text-white/90"
          onClick={() => setShowSuggestionsModal(true)}
          title="Mensagens prontas"
        >
          <Lightbulb className="size-5" />
        </Button>
      </div>

      {/* Chat Sidebar Component (overlay) */}
      <ChatSidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)}
        currentConversationId={currentConversationId}
        onNewConversation={handleNewConversation}
        onSelectConversation={handleSelectConversation}
      />

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header mobile - barra superior (apenas mobile) */}
        <div className="md:hidden flex-shrink-0 border-b border-white/5 px-4 py-3">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-xl text-white/60 hover:bg-white/[0.08] hover:text-white/90"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu className="size-5" />
            </Button>
            
            <HoverGlitch
              text="Research.IA"
              fontFamily="system-ui, -apple-system, sans-serif"
              fontSize="1.5rem"
              fontWeight={600}
              color="#ffffff"
              baseIntensity={1.1}
              hoverIntensity={6}
            />
            
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-xl text-white/60 hover:bg-white/[0.08] hover:text-white/90"
              onClick={handleNewConversation}
            >
              <SquarePen className="size-5" />
            </Button>
          </div>
        </div>

        {/* Header desktop - simplificado (apenas desktop) */}
        <div className="hidden md:block flex-shrink-0 border-b border-white/5 px-4 py-3 sm:px-6">
          <div className="mx-auto flex max-w-3xl items-center justify-center">
            <HoverGlitch
              text="Research.IA"
              fontFamily="system-ui, -apple-system, sans-serif"
              fontSize="1.94rem"
              fontWeight={600}
              color="#ffffff"
              baseIntensity={1.1}
              hoverIntensity={6}
            />
          </div>
        </div>

        {/* Messages Area */}
        <div 
          className="chat-messages-scroll relative flex-1 overflow-y-auto"
        >
        <div className="mx-auto max-w-3xl px-4 py-4">
          {/* Welcome Message */}
          {!hasUserMessages && (
            <div className="flex flex-col items-center justify-center space-y-6 py-12 text-center sm:py-16">
              <div className="flex items-center gap-2.5">
                <Sparkles className="size-5 text-blue-400" />
                <h1 className="text-3xl font-medium text-white/95 sm:text-4xl">
                  Olá, {userName}
                </h1>
              </div>
              <p className="text-xl font-light text-white/70 sm:text-2xl">
                Por onde começamos?
              </p>
            </div>
          )}

          {/* Suggestions */}
          {showSuggestions && !hasUserMessages && (
            <div className="mb-6 grid gap-2.5 sm:grid-cols-2">
              {suggestions.map((suggestion) => (
                <Button
                  key={suggestion.id}
                  variant="secondary"
                  className="h-auto w-full justify-start rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3 text-left text-[13px] text-white/80 hover:bg-white/[0.06] sm:px-4"
                  onClick={() => {
                    handleSuggestion(suggestion.title);
                    setShowSuggestions(false);
                  }}
                >
                  <span className="whitespace-normal leading-relaxed">
                    {suggestion.title}
                  </span>
                </Button>
              ))}
            </div>
          )}

          {/* Messages */}
          {messages.map((message, index) => {
            // A última mensagem do assistente está em streaming se isLoading estiver true
            const isLastAssistantMessage = 
              message.role === 'assistant' && 
              index === messages.length - 1;
            const isStreamingMessage = isLastAssistantMessage && isLoading;
            
            return (
              <ChatMessage 
                key={message.id} 
                message={message} 
                isStreaming={isStreamingMessage}
              />
            );
          })}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input Area - Fixed at bottom */}
      <div className="flex-shrink-0">
        <div className="mx-auto max-w-3xl px-4 pb-3 pt-3 sm:pb-4 sm:pt-4">
          {selectedImage && (
            <div className="mb-3 flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-2">
              <img src={selectedImage} alt="Preview" className="h-16 w-16 rounded-lg object-cover" />
              <p className="text-sm text-white/70">Imagem anexada</p>
              <button
                onClick={() => setSelectedImage(null)}
                className="ml-auto rounded-lg px-2 py-1 text-xs text-white/60 hover:bg-white/[0.08] hover:text-white/90"
              >
                Remover
              </button>
            </div>
          )}
          <ChatInput
            input={input}
            onChange={handleInputChange}
            onSubmit={handleSubmit}
            isLoading={isLoading}
            onImageUpload={handleImageUpload}
            pdfAttached={extractedPdfData ? { fileName: extractedPdfData.fileName, pages: extractedPdfData.pages } : null}
            aiProviderSelector={<AiProviderSelector />}
            onVoiceInput={handleVoiceInput}
          />
          <p className="mt-2 text-center text-xs text-white/40">
            O Research.IA pode cometer erros. Por isso, é bom verificar as informações.
          </p>
        </div>
      </div>
      </div>

      {/* Modal de Mensagens Prontas */}
      <Dialog open={showSuggestionsModal} onOpenChange={setShowSuggestionsModal}>
        <DialogContent className="bg-[#1a1a1a] border-white/10 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Lightbulb className="size-5 text-yellow-400" />
              Mensagens Prontas
            </DialogTitle>
            <DialogDescription className="text-white/60">
              Clique em uma mensagem para copiar e começar sua conversa
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-4">
            {suggestions.map((suggestion) => (
              <div
                key={suggestion.id}
                className="group relative flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4 transition-all hover:bg-white/[0.06] hover:border-white/20"
              >
                <div className="flex-1">
                  <p className="text-sm leading-relaxed text-white/90">
                    {suggestion.title}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="shrink-0 opacity-70 hover:opacity-100 transition-opacity"
                  onClick={() => handleCopySuggestion(suggestion.title, suggestion.id)}
                >
                  {copiedId === suggestion.id ? (
                    <Check className="size-4 text-green-400" />
                  ) : (
                    <Copy className="size-4" />
                  )}
                </Button>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
