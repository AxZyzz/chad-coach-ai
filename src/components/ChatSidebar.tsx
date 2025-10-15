import { MessageSquare, Plus, Settings, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface Conversation {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: string;
}

interface ChatSidebarProps {
  conversations: Conversation[];
  activeConversationId?: string;
  onNewChat: () => void;
  onSelectConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void;
  onOpenSettings: () => void;
}

export const ChatSidebar = ({
  conversations,
  activeConversationId,
  onNewChat,
  onSelectConversation,
  onDeleteConversation,
  onOpenSettings,
}: ChatSidebarProps) => {
  return (
    <div className="flex h-screen w-64 flex-col border-r border-sidebar-border bg-sidebar-background">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-sidebar-border p-4">
        <h1 className="text-lg font-bold text-sidebar-foreground">CHADGPT</h1>
        <Button
          variant="ghost"
          size="icon"
          onClick={onNewChat}
          className="text-sidebar-foreground hover:bg-sidebar-accent"
        >
          <Plus className="h-5 w-5" />
        </Button>
      </div>

      {/* Conversations List */}
      <ScrollArea className="flex-1 px-2 py-4">
        <div className="space-y-1">
          {conversations.map((conversation) => (
            <div
              key={conversation.id}
              className={cn(
                "group relative flex cursor-pointer items-start gap-3 rounded-lg p-3 transition-colors hover:bg-sidebar-accent",
                activeConversationId === conversation.id && "bg-sidebar-accent"
              )}
              onClick={() => onSelectConversation(conversation.id)}
            >
              <MessageSquare className="mt-0.5 h-4 w-4 flex-shrink-0 text-sidebar-foreground/60" />
              <div className="flex-1 overflow-hidden">
                <p className="truncate text-sm font-medium text-sidebar-foreground">
                  {conversation.title}
                </p>
                <p className="truncate text-xs text-sidebar-foreground/60">
                  {conversation.lastMessage}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-2 h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteConversation(conversation.id);
                }}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Settings Button */}
      <div className="border-t border-sidebar-border p-4">
        <Button
          variant="ghost"
          className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent"
          onClick={onOpenSettings}
        >
          <Settings className="mr-2 h-4 w-4" />
          Settings
        </Button>
      </div>
    </div>
  );
};
