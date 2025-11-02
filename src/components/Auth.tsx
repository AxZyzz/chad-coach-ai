import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { handleAuthRedirect, getRedirectUrl } from "@/lib/supabase-helpers";
import { useEffect, useState } from "react";

interface AuthProps {
  onAuthComplete: () => void;
}

export const Auth = ({ onAuthComplete }: AuthProps) => {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Handle OAuth redirect and check session
    const initAuth = async () => {
      try {
        await handleAuthRedirect();
        
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
          console.error('Session error:', sessionError);
          return;
        }

        if (session?.user) {
          // Check if profile exists
          const { data: profile, error: profileError } = await supabase
            .from('Profile')
            .select('id')
            .eq('id', session.user.id)
            .single();
            
          if (profileError) {
            console.error('Profile check error:', profileError);
          }

          if (!profile) {
            // Create profile if it doesn't exist
            const { error: createError } = await supabase
              .from('Profile')
              .upsert({
                id: session.user.id,
                email: session.user.email || '',
                ai_tone: 'tough',
                ai_intensity: 5,
                updated_at: new Date().toISOString()
              }, {
                onConflict: 'id',
                ignoreDuplicates: true
              });
              
            if (createError) {
              console.error('Profile creation error:', createError);
            }
          }

          onAuthComplete();
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      }
    };

    initAuth();

    // Set up auth state listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        try {
          // Create profile on sign in if it doesn't exist
          const { error: createError } = await supabase
            .from('Profile')
            .insert([{
              id: session.user.id,
              email: session.user.email,
              ai_tone: 'tough',
              ai_intensity: 5,
              updated_at: new Date().toISOString()
            }])
            .single();
            
          if (createError && !createError.message.includes('duplicate')) {
            console.error('Profile creation error:', createError);
          }
        } catch (error) {
          console.error('Profile creation error:', error);
        }
        
        onAuthComplete();
      }
    });

    return () => subscription.unsubscribe();
  }, [onAuthComplete]);

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      const redirectUrl = getRedirectUrl();
      console.log('Using redirect URL:', redirectUrl);
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent'
          }
        },
        options: {
          redirectTo: getRedirectUrl(),
          queryParams: {
            access_type: 'offline',
            prompt: 'consent'
          },
          scopes: 'email profile'
        }
      });
      
      if (error) {
        console.error('Google sign in error:', error);
        throw error;
      }
      
      // The redirect will happen automatically, but we'll show loading state
      // until then
    } catch (error) {
      console.error('Error logging in with Google:', error);
    }
    // Don't set loading to false here as we're about to redirect
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md border-border bg-card p-8 shadow-elegant">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/80">
            <span className="text-2xl font-bold text-primary-foreground">C</span>
          </div>
          <h1 className="mb-2 text-3xl font-bold text-foreground">
            Welcome to CHADGPT
          </h1>
          <p className="text-muted-foreground">
            Sign in to start your transformation
          </p>
        </div>

        {/* Login Button */}
        <Button
          className="w-full"
          onClick={handleGoogleLogin}
          disabled={loading}
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Connecting...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </span>
          )}
        </Button>
      </Card>
    </div>
  );
};