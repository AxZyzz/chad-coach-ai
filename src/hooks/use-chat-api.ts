import { useState } from 'react';
import { UserProfile } from '@/components/OnboardingFlow';
import { supabase, supabaseAnonKey } from '@/lib/supabase';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatAPIOptions {
  profile: UserProfile;
  backendUrl?: string;
}

export function useChatAPI({ profile, backendUrl = 'https://yiogftbgycgilipzwnkv.supabase.co/functions/v1/chat-voice' }: ChatAPIOptions) {
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async (message: string, conversationId: string): Promise<Message> => {
    setIsLoading(true);
    try {
      // Get the access token from Supabase
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      if (!accessToken) {
        throw new Error('No access token available');
      }

      // Send to Supabase Edge Function
      const response = await fetch(backendUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'apikey': supabaseAnonKey
        },
        body: JSON.stringify({
          message,
          profile: {
            tone: profile.ai_tone,
            intensity: profile.ai_intensity,
            goal: profile.ai_goal
          },
          model: 'gemini-pro',
          responseType: 'text'
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Chat API error: ${errorText}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      return {
        role: 'assistant',
        content: data.text, // Changed from data.response to data.text to match the Edge Function
      };
    } catch (error) {
      console.error('Chat API error:', error);
      const errorMessage = "I apologize, but I'm having trouble connecting to the server. Please try again in a moment.";
      
      // Log the error but don't try to save it since we removed Firebase
      return {
        role: 'assistant',
        content: errorMessage,
      };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    sendMessage,
    isLoading,
  };
}