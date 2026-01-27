import { Bot } from "lucide-react";

export type ChatMessageData = {
  id: string;
  role: "user" | "assistant" | "system";
  content?: string;
  parts?: Array<{ type: "text"; text: string } | { type: "image"; image: string }>;
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
    const textParts = message.parts?.filter((part) => part.type === "text") || [];
    const imageParts = message.parts?.filter((part) => part.type === "image") || [];
    
    const textContent = textParts.length
      ? textParts.map((part: any) => part.text).join("")
      : message.content || "";

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
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white/[0.08]">
          <Bot className="size-4 text-white/80" />
        </div>
        <div className="max-w-full flex-1 text-[15px] leading-relaxed font-normal text-white/90 break-words whitespace-pre-wrap">
          {content}
        </div>
      </div>
    </div>
  );
};
