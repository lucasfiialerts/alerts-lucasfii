"use client";

import { Paperclip, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ChatInputProps {
  input: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading?: boolean;
  onImageUpload?: (file: File) => void;
}

export const ChatInput = ({
  input,
  onChange,
  onSubmit,
  isLoading,
  onImageUpload,
}: ChatInputProps) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSubmit(e);
    }
  };

  const handleImageClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file && onImageUpload) {
        onImageUpload(file);
      }
    };
    input.click();
  };

  return (
    <div className="flex w-full items-center gap-2 sm:gap-2.5">
      <Button
        size="icon"
        type="button"
        className="size-10 shrink-0 rounded-xl bg-white/[0.05] p-2.5 text-white/60 hover:bg-white/[0.08] hover:text-white/90 sm:size-11"
        onClick={handleImageClick}
        disabled={isLoading}
      >
        <Paperclip className="size-5" />
      </Button>
      <Input
        value={input}
        onChange={onChange}
        onKeyDown={handleKeyDown}
        placeholder="Pergunte ao Research.IA"
        className="grow basis-0 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-[15px] text-white/95 placeholder:text-white/40 focus:border-white/20 focus:bg-white/[0.05] sm:px-5 sm:py-3.5"
        disabled={isLoading}
      />
      <Button
        size="icon"
        className="size-10 shrink-0 rounded-xl bg-blue-600 p-2.5 hover:bg-blue-500 disabled:bg-white/[0.08] disabled:text-white/30 sm:size-11"
        onClick={onSubmit}
        disabled={isLoading || !input.trim()}
      >
        <Send className="size-5 text-white" />
      </Button>
    </div>
  );
};
