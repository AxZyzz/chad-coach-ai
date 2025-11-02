-- First drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- Drop old profiles table
DROP TABLE IF EXISTS public.profiles;

-- Create new Profile table
CREATE TABLE public."Profile" (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username text UNIQUE,
    email text,
    updated_at timestamp with time zone DEFAULT now(),
    ai_goal text,
    ai_tone text DEFAULT 'tough'::text,
    ai_intensity numeric DEFAULT 50,
    CONSTRAINT username_length CHECK (char_length(username) >= 3)
);

-- Set up permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON public."Profile" TO postgres;
GRANT ALL ON public."Profile" TO authenticated;
GRANT ALL ON public."Profile" TO service_role;
GRANT SELECT ON public."Profile" TO anon;

-- Enable RLS
ALTER TABLE public."Profile" ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can read their own profile"
ON public."Profile" FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
ON public."Profile" FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
ON public."Profile" FOR UPDATE
TO authenticated
USING (auth.uid() = id);

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO public."Profile" (id, email)
    VALUES (NEW.id, NEW.email)
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();