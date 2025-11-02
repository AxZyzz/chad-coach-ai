import { supabase, supabaseUrl } from './supabase';

export const handleAuthRedirect = async () => {
  try {
    console.log('Debug - Starting handleAuthRedirect');
    // Handle both hash and query parameters for error cases
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const queryParams = new URLSearchParams(window.location.search);

    // Check for errors in both hash and query parameters
    const error = hashParams.get('error') || queryParams.get('error');
    const errorDescription = hashParams.get('error_description') || queryParams.get('error_description');

    if (error) {
      console.error('Auth error:', error, errorDescription);
      // Clear error from URL without page reload
      window.history.replaceState(null, '', window.location.pathname);
      return;
    }

    // Get the hash fragment from URL for successful auth
    const access_token = hashParams.get('access_token');
    const refresh_token = hashParams.get('refresh_token');
    
    if (access_token) {
      try {
        // Wait for Supabase to be ready
        await new Promise(resolve => setTimeout(resolve, 500));

        console.log('Debug - Starting auth process');
        
        // Get the current session first
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        
        if (!currentSession) {
          console.log('Debug - Setting new session');
          // Set the session
          const { error: setSessionError } = await supabase.auth.setSession({
            access_token,
            refresh_token: refresh_token || '',
          });
          
          if (setSessionError) {
            console.error('Session setting error:', setSessionError);
            return;
          }
        }

        // Clear hash without page reload
        window.history.replaceState(null, '', window.location.pathname);

        // Get the final session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Final session error:', sessionError);
          return;
        }

        if (!session?.user) {
          console.error('No user in session after auth');
          return;
        }

        console.log('Debug - Session established, checking profile');
        
        // Handle profile creation
        const { data: existingProfile, error: profileCheckError } = await supabase
          .from('Profile')
          .select('id')
          .eq('id', session.user.id)
          .single();

            if (!existingProfile) {
              // Create profile if it doesn't exist
              const { error: insertError } = await supabase
                .from('Profile')
                .insert({
                  id: session.user.id,
                  email: session.user.email,
                  ai_tone: 'tough',
                  ai_intensity: 5,
                  updated_at: new Date().toISOString()
                });

              if (insertError) {
                console.error('Error creating profile:', insertError);
                throw insertError;
              }
              console.log('Profile created successfully');
            } else {
              console.log('Profile already exists');
            }
            
            // Redirect to main page after successful auth/profile check
            window.location.href = '/';
          } catch (error) {
            console.error('Profile management error:', error);
            // Don't redirect on error, let the user try again
          }
        }
      } catch (err) {
        // Log error but don't block auth flow
        console.error('Auth process error:', err);
      }
    }
  } catch (error) {
    console.error('Error handling auth redirect:', error);
    // Don't throw, just log the error
  }
};

export const getRedirectUrl = () => {
  // Check if we're in development or production
  if (window.location.hostname === 'localhost') {
    return `${window.location.protocol}//${window.location.hostname}:${window.location.port}`;
  }
  return window.location.origin;
};