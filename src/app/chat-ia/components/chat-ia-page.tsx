"use client";

import { Bot, Sparkles, Menu } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { ChatInput } from "@/app/api/chat/_components/chat-input";
import { ChatMessage, type ChatMessageData } from "@/app/api/chat/_components/chat-message";
import { Button } from "@/components/ui/button";
import { ChatSidebar } from "./chat-sidebar";
import { AiProviderSelector } from "./ai-provider-selector";
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
    () => [
      {
        id: "system-welcome",
        role: "system",
        content:
          "Pergunte à Research.IA! Seu assistente inteligente especializado em fundos imobiliários.",
        parts: toTextParts(
          "Pergunte à Research.IA! Seu assistente inteligente especializado em fundos imobiliários.",
        ),
      },
    ],
    [],
  );

  const [messages, setMessages] = useState<ChatMessageData[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isLoading]);

  const handleSuggestion = (text: string) => {
    void sendMessage(text);
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInput(event.target.value);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (!input.trim() || isLoading) {
      return;
    }

    void sendMessage(input.trim());
  };

  const handleImageUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      setSelectedImage(base64);
      toast.success("Imagem anexada! Digite sua pergunta e envie.");
    };
    reader.readAsDataURL(file);
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
      content: text,
      parts: selectedImage 
        ? [{ type: "text" as const, text }, { type: "image" as const, image: selectedImage }]
        : toTextParts(text),
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
    setIsLoading(true);

    // Save user message to backend
    if (conversationId) {
      await saveMessage(conversationId, "user", text);
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
    if (result.success && result.messages) {
      const loadedMessages: ChatMessageData[] = result.messages.map(msg => ({
        id: msg.id,
        role: msg.role as "user" | "assistant" | "system",
        content: msg.content,
        parts: toTextParts(msg.content),
      }));
      setMessages(loadedMessages.length > 0 ? loadedMessages : initialMessages);
    } else {
      toast.error(result.error || "Erro ao carregar mensagens");
      setMessages(initialMessages);
    }
  };

  return (
    <div className="relative flex h-full flex-col overflow-hidden" style={{ backgroundColor: '#141414' }}>
      {/* Chat Sidebar Component */}
      <ChatSidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)}
        currentConversationId={currentConversationId}
        onNewConversation={handleNewConversation}
        onSelectConversation={handleSelectConversation}
      />

      {/* Header */}
      <div className="flex-shrink-0 border-b border-white/5 px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-white/60 hover:bg-white/[0.08] hover:text-white/90"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu className="size-5" />
            </Button>
            <div className="flex items-center gap-2.5">
              <div className={`flex size-8 items-center justify-center rounded-full bg-white/[0.08] sm:size-9 ${isLoading ? 'animate-pulse' : ''}`}>
                <Bot className={`size-4 text-white/80 ${isLoading ? 'animate-bounce' : ''}`} />
              </div>
              <div>
                {/* <p className="text-sm font-semibold text-white/90">Research.IA</p> */}
                {/* <p className="text-xs text-emerald-400/80">online agora</p> */}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <AiProviderSelector />
            {/* <Button
              variant="secondary"
              size="sm"
              className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-xs text-white/80 hover:bg-white/[0.08] sm:px-4"
              onClick={() => setShowSuggestions((prev) => !prev)}
            >
              {showSuggestions ? "Ocultar" : "💡 Dicas"}
            </Button> */}
          </div>
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
          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}

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
          />
          <p className="mt-2 text-center text-xs text-white/40">
            O Research.IA pode cometer erros. Por isso, é bom verificar as informações.
          </p>
        </div>
      </div>
    </div>
  );
}
