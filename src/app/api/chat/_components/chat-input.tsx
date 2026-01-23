"use client";

import { Mic, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ChatInputProps {
  input: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading?: boolean;
}

export const ChatInput = ({
  input,
  onChange,
  onSubmit,
  isLoading,
}: ChatInputProps) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSubmit(e);
    }
  };

  return (
    <div className="absolute bottom-0 left-0 flex w-full flex-col gap-2.5 border-t border-white/10 bg-[#0b1220]/90 p-3 sm:p-5 backdrop-blur">
      <div className="flex w-full gap-2 sm:gap-3">
        <Input
          value={input}
          onChange={onChange}
          onKeyDown={handleKeyDown}
          placeholder="Digite sua mensagem"
          className="grow basis-0 rounded-full border-white/10 bg-white/10 px-4 py-2.5 text-sm text-white placeholder:text-white/40 sm:py-3"
          disabled={isLoading}
        />
        <Button
          size="icon"
          className="size-10 shrink-0 rounded-full bg-blue-500/60 p-2.5 hover:bg-blue-500/80 sm:size-[42px]"
          disabled
        >
          <Mic className="size-4 text-white sm:size-5" />
        </Button>
        <Button
          size="icon"
          className="size-10 shrink-0 rounded-full bg-blue-500/80 p-2.5 hover:bg-blue-500 sm:size-[42px]"
          onClick={onSubmit}
          disabled={isLoading || !input.trim()}
        >
          <Send className="size-4 text-white sm:size-5" />
        </Button>
      </div>
    </div>
  );
};
