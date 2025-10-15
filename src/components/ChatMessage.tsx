import { cn } from "@/lib/utils";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
}

export const ChatMessage = ({ role, content, timestamp }: ChatMessageProps) => {
  const isUser = role === "user";

  return (
    <div
      className={cn(
        "flex w-full gap-4 px-4 py-6 transition-colors",
        !isUser && "bg-secondary/30"
      )}
    >
      <div className="flex w-full max-w-3xl mx-auto gap-4">
        {/* Avatar */}
        <div
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold",
            isUser
              ? "bg-primary text-primary-foreground"
              : "bg-gradient-to-br from-primary/80 to-primary text-primary-foreground"
          )}
        >
          {isUser ? "Y" : "C"}
        </div>

        {/* Content */}
        <div className="flex-1 space-y-2">
          <div className="prose prose-invert max-w-none">
            <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">
              {content}
            </p>
          </div>
          {timestamp && (
            <p className="text-xs text-muted-foreground">{timestamp}</p>
          )}
        </div>
      </div>
    </div>
  );
};
