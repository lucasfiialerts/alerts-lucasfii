import { Bot } from "lucide-react";

export type ChatMessageData = {
  id: string;
  role: "user" | "assistant" | "system";
  content?: string;
  parts?: Array<{ type: "text"; text: string }>;
};

interface ChatMessageProps {
  message: ChatMessageData;
  isStreaming?: boolean;
}

export const ChatMessage = ({
  message,
  isStreaming = false,
}: ChatMessageProps) => {
  const isUser = message.role === "user";
  const isSystem = message.role === "system";

  const content = message.parts?.length
    ? message.parts
        .filter((part) => part.type === "text")
        .map((part) => part.text)
        .join("")
    : message.content || "";

  if (isSystem) {
    return (
      <div className="flex w-full flex-col gap-3 px-4 pt-5 pb-0 sm:px-5 sm:pt-6">
        <div className="flex w-full flex-col gap-2.5 rounded-2xl border border-white/10 bg-white/5 p-3">
          <div className="flex w-full items-center justify-center gap-2.5">
            <p className="grow basis-0 text-center text-sm leading-[1.4] font-normal text-white/70">
              {content}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (isUser) {
    return (
      <div className="flex w-full flex-col items-end gap-3 pt-5 pr-4 pb-0 pl-8 sm:pt-6 sm:pr-5 sm:pl-10">
        <div className="flex max-w-[calc(100%-40px)] items-center gap-2.5 rounded-2xl border border-white/10 bg-blue-500/20 px-4 py-3">
          <p className="text-sm leading-[1.4] font-normal text-white/90 break-words whitespace-pre-wrap">
            {content}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-3 pt-5 pr-4 pb-0 pl-3 sm:pt-6 sm:pr-14">
      <div className="flex w-full gap-2">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-blue-500/15">
          <Bot className="size-3.5 text-blue-300" />
        </div>
        <div className="max-w-full text-sm leading-[1.5] font-normal text-white/90 break-words whitespace-pre-wrap">
          {content}
        </div>
      </div>
    </div>
  );
};
