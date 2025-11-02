import { useState, useEffect } from "react";
import { ChatSidebar } from "@/components/ChatSidebar";
import { ChatMessage } from "@/components/ChatMessage";
import { ChatInput } from "@/components/ChatInput";
import { OnboardingFlow, UserProfile } from "@/components/OnboardingFlow";
import { SettingsPanel } from "@/components/SettingsPanel";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useChatAPI } from "@/hooks/use-chat-api";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase";
import { supabaseAnonKey } from "@/lib/supabase";
import { Auth } from "@/components/Auth";

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
  // Core hooks - always present
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading, setIsAuthenticated } = useAuth();
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  
  // Chat API hook
  const { sendMessage, isLoading: chatLoading } = useChatAPI({ 
    profile: userProfile || { 
      ai_tone: 'tough', 
      ai_intensity: 70,
      ai_goal: 'Stay focused and build discipline'
    },
  });

  // Effect for loading user data when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const loadUserData = async () => {
        try {
          const savedProfile = localStorage.getItem("chadgpt-profile");
          const savedConversations = localStorage.getItem("chadgpt-conversations");

          if (savedProfile) {
            setUserProfile(JSON.parse(savedProfile));
            setHasCompletedOnboarding(true);
          }
          if (savedConversations) {
            const parsed = JSON.parse(savedConversations);
            setConversations(parsed);
            if (parsed.length > 0) {
              setActiveConversationId(parsed[0].id);
            }
          }
        } catch (error) {
          console.error('Error loading user data:', error);
        }
      };

      loadUserData();
    }
  }, [isAuthenticated]);

  // Effect for auth state changes
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        setUserProfile(null);
        setHasCompletedOnboarding(false);
        localStorage.removeItem("chadgpt-profile");
        localStorage.removeItem("chadgpt-conversations");
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Early returns for auth states
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-foreground text-lg">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Auth onAuthComplete={() => setIsAuthenticated(true)} />;
  }

  const handleAuthComplete = () => {
    setIsAuthenticated(true);
  };

  const handleOnboardingComplete = async (profile: UserProfile) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error('No user found');

      // First save locally to ensure UI updates
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

      // Debug log the profile data being sent
      console.log('Saving profile to Supabase:', {
        ...profile,
        id: user.id,
        username: user.email,
        updated_at: new Date().toISOString()
      });

      // Then try to save to Supabase
      const { data, error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          email: user.email,
          ai_goal: profile.ai_goal,
          ai_tone: profile.ai_tone,
          ai_intensity: profile.ai_intensity,
          updated_at: new Date().toISOString()
        }, { 
          onConflict: 'id'
        });

      if (error) {
        // Log detailed error information
        console.error('Supabase error:', {
          error,
          errorMessage: error.message,
          details: error.details,
          hint: error.hint
        });
        // Don't throw here - we already saved locally
        toast({
          title: "Warning",
          description: `Profile sync failed: ${error.message}. Data saved locally.`,
          variant: "default",
        });
        return;
      }

      console.log('Profile saved successfully:', data);

      toast({
        title: "Welcome to CHADGPT",
        description: "Let's get to work. No excuses.",
      });
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: "Error",
        description: "Failed to save profile. Please try again.",
        variant: "destructive",
      });
    }
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

  const handleSendMessage = async (content: string) => {
    if (!activeConversationId || !userProfile) return;
    
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

      // Send message to voice chat endpoint
      try {
        const session = await supabase.auth.getSession();
        const accessToken = session.data.session?.access_token;
        
        if (!accessToken) {
          console.error('No access token available');
          return;
        }

        // Format message for voice API
        const formattedMessage = {
          message: content,
          profile: {
            tone: userProfile.ai_tone,
            intensity: userProfile.ai_intensity,
            goal: userProfile.ai_goal
          },
          model: 'gemini-pro', // Specify the model explicitly
          responseType: 'text'  // Specify response type
        };

        const response = await fetch('https://yiogftbgycgilipzwnkv.supabase.co/functions/v1/chat-voice', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Apikey': supabaseAnonKey,
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify(formattedMessage)
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Voice chat request failed:', errorText);
          // Don't throw error to prevent breaking chat flow
        }
      } catch (error) {
        console.error('Error sending voice chat request:', error);
        // Don't throw error to prevent breaking chat flow
      }    try {
      if (!activeConversationId) throw new Error('No active conversation');
      
      // Get response from chat API
      const response = await sendMessage(content, activeConversationId);
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response.content,
        timestamp: new Date().toLocaleTimeString(),
      };

      const withResponse = updatedConversations.map((conv) => {
        if (conv.id === activeConversationId) {
          return {
            ...conv,
            messages: [...conv.messages, assistantMessage],
            lastMessage: response.content.slice(0, 50),
          };
        }
        return conv;
      });

      setConversations(withResponse);
      localStorage.setItem("chadgpt-conversations", JSON.stringify(withResponse));
    } catch (error) {
      console.error('Failed to get chat response:', error);
      toast({
        title: "Error",
        description: "Failed to get response. Please try again.",
      });
    }
  };



  const activeConversation = conversations.find((c) => c.id === activeConversationId);

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  // Show authentication if not authenticated
  if (!isAuthenticated) {
    return <Auth onAuthComplete={() => null} />;
  }

  // Show onboarding if authenticated but not completed onboarding
  if (!hasCompletedOnboarding) {
    return <OnboardingFlow onComplete={handleOnboardingComplete} />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar for desktop */}
      <div className="hidden md:block">
        <ChatSidebar
          conversations={conversations}
          activeConversationId={activeConversationId || undefined}
          onNewChat={handleNewChat}
          onSelectConversation={setActiveConversationId}
          onDeleteConversation={handleDeleteConversation}
          onOpenSettings={() => setShowSettings(true)}
        />
      </div>

      {/* Mobile: header with toggle */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 border-b border-border bg-card px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              aria-label="Open sidebar"
              className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-sidebar-accent text-sidebar-foreground"
              onClick={() => setShowSettings(true)}
              onMouseDown={(e) => e.preventDefault()}
            >
              {/* simple hamburger icon */}
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="text-lg font-bold text-foreground">CHADGPT</h1>
          </div>
          <div className="text-sm text-muted-foreground">
            {userProfile?.ai_tone === "tough" && "Tough"}
            {userProfile?.ai_tone === "stoic" && "Stoic"}
            {userProfile?.ai_tone === "bro" && "Bro"}
          </div>
        </div>
      </div>

      {/* Sidebar drawer for mobile when toggled (uses showSettings as sidebar open flag) */}
      {showSettings && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div className="w-64 border-r border-sidebar-border bg-sidebar-background">
            <ChatSidebar
              conversations={conversations}
              activeConversationId={activeConversationId || undefined}
              onNewChat={handleNewChat}
              onSelectConversation={(id) => {
                setActiveConversationId(id);
                setShowSettings(false);
              }}
              onDeleteConversation={handleDeleteConversation}
              onOpenSettings={() => setShowSettings(true)}
              className="h-full"
            />
          </div>
          <div className="flex-1 bg-black/40" onClick={() => setShowSettings(false)} />
        </div>
      )}

      {/* Main Chat Area */}
      <div className="flex flex-1 flex-col md:ml-0">
        {/* Header */}
        <div className="border-b border-border bg-card px-6 py-4 md:pl-6 md:pr-6 pt-16 md:pt-4">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-lg font-semibold text-foreground">
              {activeConversation?.title || "CHADGPT"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {userProfile?.ai_tone === "tough" && "Tough Coach Mode"}
              {userProfile?.ai_tone === "stoic" && "Stoic Mentor Mode"}
              {userProfile?.ai_tone === "bro" && "Big Bro Mode"}
              {" · "}
              Intensity: {userProfile?.ai_intensity}%
            </p>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 px-4">
          <div className="mx-auto w-full max-w-3xl py-8">
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
                {chatLoading && (
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
              disabled={chatLoading}
              placeholder="What's your excuse today?"
            />
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && userProfile && (
        <SettingsPanel
          profile={userProfile}
          onUpdateProfile={(profile) => {
            setUserProfile(profile);
            localStorage.setItem("chadgpt-profile", JSON.stringify(profile));
            toast({
              title: "Settings updated",
              description: "Your preferences have been saved.",
            });
          }}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
};

export default Index;
