"use client";

import { Bot, Sparkles } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { ChatInput } from "@/app/api/chat/_components/chat-input";
import { ChatMessage, type ChatMessageData } from "@/app/api/chat/_components/chat-message";
import { Button } from "@/components/ui/button";

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

export function ChatIaPage() {
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

    const userMessage: ChatMessageData = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
      parts: toTextParts(text),
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
    setIsLoading(true);

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
        throw new Error("Resposta inválida do servidor.");
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
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "system",
          content: "Não foi possível obter resposta da IA. Tente novamente.",
          parts: toTextParts(
            "Não foi possível obter resposta da IA. Tente novamente.",
          ),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const hasUserMessages = messages.some((message) => message.role === "user");

  return (
    <div className="relative min-h-[calc(100vh-64px)]">
      <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-col px-4 pb-24 pt-6 sm:pb-28 sm:pt-10 lg:px-8">
        <div className="flex flex-col items-center text-center">
          <div className="flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-white/80">
            <Sparkles className="size-3.5 text-blue-300" />
            Research.IA
          </div>
          <h1 className="mt-4 text-2xl font-semibold text-white sm:text-4xl">
            Research.IA
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-white/70 sm:text-base">
            Pergunte à Research.IA! Seu assistente inteligente especializado em fundos imobiliários.
          </p>
        </div>

        <div className="mt-5 flex items-center justify-center sm:mt-6">
          <Button
            variant="secondary"
            className="rounded-full border border-white/15 bg-white/10 px-5 py-2 text-sm text-white/90 hover:bg-white/20"
            onClick={() => setShowSuggestions((prev) => !prev)}
          >
            {showSuggestions ? "Ocultar dicas" : "Dicas de perguntas"}
          </Button>
        </div>

        {showSuggestions && (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {suggestions.map((suggestion) => (
              <Button
                key={suggestion.id}
                variant="secondary"
                className="h-auto w-full justify-start rounded-2xl border border-white/15 bg-white/10 px-3 py-2.5 text-left text-sm text-white/90 hover:bg-white/20 sm:px-4 sm:py-3"
                onClick={() => handleSuggestion(suggestion.title)}
              >
                <span className="whitespace-normal leading-relaxed">
                  {suggestion.title}
                </span>
              </Button>
            ))}
          </div>
        )}

        <div className="mt-6 flex flex-1 flex-col overflow-hidden rounded-2xl border border-white/15 bg-[#0b1220]/70 shadow-2xl backdrop-blur sm:mt-8 sm:rounded-3xl">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 sm:px-6 sm:py-4">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-full bg-blue-500/25 sm:size-10">
                <Bot className="size-4 text-blue-200 sm:size-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Research.IA</p>
                <p className="text-xs text-emerald-300">online agora</p>
              </div>
            </div>
          </div>

          <div className="relative flex-1 overflow-y-auto px-2 pb-24 pt-2 sm:pb-28">
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}

            {!hasUserMessages && (
              <div className="px-6 pt-8 text-center text-sm text-white/70">
                Faça uma pergunta para começar.
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          <ChatInput
            input={input}
            onChange={handleInputChange}
            onSubmit={handleSubmit}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
}
