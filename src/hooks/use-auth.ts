import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        console.log('Auth Status:', { session, error }); // Debug log
        
        if (error) {
          console.error('Auth error:', error);
          return;
        }

        if (session?.user) {
          // Check/create profile after successful auth
          const { data: profile } = await supabase
            .from('Profile')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (!profile) {
            // Create profile if it doesn't exist
            await supabase
              .from('Profile')
              .insert([{
                id: session.user.id,
                email: session.user.email,
                ai_tone: 'tough',
                ai_intensity: 5
              }])
              .single();
          }
        }

        if (mounted) {
          setIsAuthenticated(!!session);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    // Initial auth check
    initAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      
      console.log('Auth state changed:', event, !!session); // Debug log
      
      if (event === 'SIGNED_IN' && session?.user) {
        // Create profile on sign in if it doesn't exist
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (!profile) {
          await supabase
            .from('profiles')
            .insert([{
              id: session.user.id,
              email: session.user.email,
              ai_tone: 'tough',
              ai_intensity: 5
            }])
            .single();
        }
      }
      
      setIsAuthenticated(!!session);
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  return { isAuthenticated, isLoading };
};