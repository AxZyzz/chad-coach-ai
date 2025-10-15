import { useState, useEffect } from "react";
import { ChatSidebar } from "@/components/ChatSidebar";
import { ChatMessage } from "@/components/ChatMessage";
import { ChatInput } from "@/components/ChatInput";
import { OnboardingFlow, UserProfile } from "@/components/OnboardingFlow";
import { SettingsPanel } from "@/components/SettingsPanel";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

interface Conversation {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: string;
  messages: Message[];
}

const Index = () => {
  const { toast } = useToast();
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Load data from localStorage on mount
  useEffect(() => {
    const savedProfile = localStorage.getItem("chadgpt-profile");
    const savedWebhook = localStorage.getItem("chadgpt-webhook");
    const savedConversations = localStorage.getItem("chadgpt-conversations");

    if (savedProfile) {
      setUserProfile(JSON.parse(savedProfile));
      setHasCompletedOnboarding(true);
    }
    if (savedWebhook) {
      setWebhookUrl(savedWebhook);
    }
    if (savedConversations) {
      const parsed = JSON.parse(savedConversations);
      setConversations(parsed);
      if (parsed.length > 0) {
        setActiveConversationId(parsed[0].id);
      }
    }
  }, []);

  const handleOnboardingComplete = (profile: UserProfile) => {
    setUserProfile(profile);
    setHasCompletedOnboarding(true);
    localStorage.setItem("chadgpt-profile", JSON.stringify(profile));
    
    // Create initial conversation
    const newConversation: Conversation = {
      id: Date.now().toString(),
      title: "New Chat",
      lastMessage: "Ready to start?",
      timestamp: new Date().toISOString(),
      messages: [],
    };
    setConversations([newConversation]);
    setActiveConversationId(newConversation.id);
    localStorage.setItem("chadgpt-conversations", JSON.stringify([newConversation]));

    toast({
      title: "Welcome to CHADGPT",
      description: "Let's get to work. No excuses.",
    });
  };

  const handleNewChat = () => {
    const newConversation: Conversation = {
      id: Date.now().toString(),
      title: "New Chat",
      lastMessage: "",
      timestamp: new Date().toISOString(),
      messages: [],
    };
    const updated = [newConversation, ...conversations];
    setConversations(updated);
    setActiveConversationId(newConversation.id);
    localStorage.setItem("chadgpt-conversations", JSON.stringify(updated));
  };

  const handleDeleteConversation = (id: string) => {
    const updated = conversations.filter((c) => c.id !== id);
    setConversations(updated);
    if (activeConversationId === id && updated.length > 0) {
      setActiveConversationId(updated[0].id);
    }
    localStorage.setItem("chadgpt-conversations", JSON.stringify(updated));
  };

  const sendToWebhook = async (data: any) => {
    if (!webhookUrl) {
      console.log("No webhook URL configured");
      return;
    }

    try {
      await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        mode: "no-cors",
        body: JSON.stringify(data),
      });
      console.log("Data sent to webhook successfully");
    } catch (error) {
      console.error("Error sending to webhook:", error);
    }
  };

  const handleSendMessage = async (content: string) => {
    if (!activeConversationId || !userProfile) return;

    setIsLoading(true);

    // Create user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content,
      timestamp: new Date().toLocaleTimeString(),
    };

    // Update conversation with user message
    const updatedConversations = conversations.map((conv) => {
      if (conv.id === activeConversationId) {
        return {
          ...conv,
          messages: [...conv.messages, userMessage],
          lastMessage: content.slice(0, 50),
          title: conv.messages.length === 0 ? content.slice(0, 30) : conv.title,
        };
      }
      return conv;
    });

    setConversations(updatedConversations);

    // Send to webhook
    await sendToWebhook({
      type: "user_message",
      message: content,
      profile: userProfile,
      conversationId: activeConversationId,
      timestamp: new Date().toISOString(),
    });

    // Simulate AI response (replace with actual webhook response handling)
    setTimeout(() => {
      const responseContent = generateMockResponse(content, userProfile);
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: responseContent,
        timestamp: new Date().toLocaleTimeString(),
      };

      const withResponse = updatedConversations.map((conv) => {
        if (conv.id === activeConversationId) {
          return {
            ...conv,
            messages: [...conv.messages, assistantMessage],
            lastMessage: responseContent.slice(0, 50),
          };
        }
        return conv;
      });

      setConversations(withResponse);
      localStorage.setItem("chadgpt-conversations", JSON.stringify(withResponse));
      setIsLoading(false);

      // Send AI response to webhook
      sendToWebhook({
        type: "assistant_message",
        message: responseContent,
        profile: userProfile,
        conversationId: activeConversationId,
        timestamp: new Date().toISOString(),
      });
    }, 1500);
  };

  const generateMockResponse = (userMessage: string, profile: UserProfile): string => {
    const lowerMessage = userMessage.toLowerCase();
    
    // Safety check for concerning messages
    if (lowerMessage.includes("suicide") || lowerMessage.includes("kill myself") || lowerMessage.includes("end it all")) {
      return "Hey, I'm here to push you, but I care about you. If you're having thoughts of harming yourself, please reach out to a mental health professional or call a helpline. Your life matters.";
    }

    // Tone-based responses
    if (profile.tone === "tough") {
      if (lowerMessage.includes("tired") || lowerMessage.includes("lazy")) {
        return "You already know that's not okay. One wasted day becomes a week. Pick one thing and finish it before bed. No pity, just action.";
      }
      if (lowerMessage.includes("give up") || lowerMessage.includes("quit")) {
        return "Quitting is easy. That's why most people do it. You said you wanted results. Results don't come from giving up—they come from pushing through when it's hard.";
      }
      return "Stop making excuses. You know what needs to be done. Do it now, not tomorrow.";
    }

    if (profile.tone === "stoic") {
      if (lowerMessage.includes("tired") || lowerMessage.includes("lazy")) {
        return "Rest isn't bad, but you've been resting from work you haven't done yet. Earn your rest tomorrow.";
      }
      return "The obstacle in the path becomes the path. What you resist today shapes who you become tomorrow.";
    }

    if (profile.tone === "bro") {
      if (lowerMessage.includes("tired") || lowerMessage.includes("lazy")) {
        return "Bro, come on. You're better than this. Just do one thing—literally anything productive. Then we can talk.";
      }
      return "Alright, real talk—you got this, but you gotta actually do it. Stop thinking, start moving. Let's go.";
    }

    return "Let's focus on your goals. What's one thing you can do right now to move forward?";
  };

  const activeConversation = conversations.find((c) => c.id === activeConversationId);

  if (!hasCompletedOnboarding) {
    return <OnboardingFlow onComplete={handleOnboardingComplete} />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <ChatSidebar
        conversations={conversations}
        activeConversationId={activeConversationId || undefined}
        onNewChat={handleNewChat}
        onSelectConversation={setActiveConversationId}
        onDeleteConversation={handleDeleteConversation}
        onOpenSettings={() => setShowSettings(true)}
      />

      {/* Main Chat Area */}
      <div className="flex flex-1 flex-col">
        {/* Header */}
        <div className="border-b border-border bg-card px-6 py-4">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-lg font-semibold text-foreground">
              {activeConversation?.title || "CHADGPT"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {userProfile?.tone === "tough" && "Tough Coach Mode"}
              {userProfile?.tone === "stoic" && "Stoic Mentor Mode"}
              {userProfile?.tone === "bro" && "Big Bro Mode"}
              {" · "}
              Intensity: {userProfile?.intensity}%
            </p>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 px-4">
          <div className="mx-auto max-w-3xl py-8">
            {activeConversation?.messages.length === 0 ? (
              <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
                <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/80 animate-glow">
                  <span className="text-3xl font-bold text-primary-foreground">C</span>
                </div>
                <h1 className="mb-4 text-4xl font-bold text-foreground">
                  Ready to start?
                </h1>
                <p className="max-w-md text-lg text-muted-foreground">
                  No excuses. No pity. Just results. What do you need to conquer today?
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {activeConversation.messages.map((message) => (
                  <ChatMessage
                    key={message.id}
                    role={message.role}
                    content={message.content}
                    timestamp={message.timestamp}
                  />
                ))}
                {isLoading && (
                  <ChatMessage
                    role="assistant"
                    content="..."
                    timestamp={new Date().toLocaleTimeString()}
                  />
                )}
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="border-t border-border bg-card p-4">
          <div className="mx-auto max-w-3xl">
            <ChatInput
              onSend={handleSendMessage}
              disabled={isLoading}
              placeholder="What's your excuse today?"
            />
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && userProfile && (
        <SettingsPanel
          profile={userProfile}
          webhookUrl={webhookUrl}
          onUpdateProfile={(profile) => {
            setUserProfile(profile);
            localStorage.setItem("chadgpt-profile", JSON.stringify(profile));
            toast({
              title: "Settings updated",
              description: "Your preferences have been saved.",
            });
          }}
          onUpdateWebhook={(url) => {
            setWebhookUrl(url);
            localStorage.setItem("chadgpt-webhook", url);
          }}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
};

export default Index;
