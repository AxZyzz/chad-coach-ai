-- Reset everything first
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create the profiles table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY,
    username TEXT UNIQUE,
    email TEXT,
    updated_at TIMESTAMP WITH TIME ZONE,
    ai_goal TEXT,
    ai_tone TEXT DEFAULT 'tough',
    ai_intensity NUMERIC DEFAULT 5,
    CONSTRAINT username_length CHECK (char_length(username) >= 3)
);

-- Set up foreign key
ALTER TABLE public.profiles
    ADD CONSTRAINT profiles_id_fkey 
    FOREIGN KEY (id) REFERENCES auth.users(id) 
    ON DELETE CASCADE;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.profiles TO postgres, authenticated, service_role;
GRANT SELECT ON public.profiles TO anon;

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Set up RLS policies
CREATE POLICY "Users can read own profile"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
    ON public.profiles FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = id);

-- Create the function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO public.profiles (id, email, updated_at)
    VALUES (
        NEW.id,
        NEW.email,
        CURRENT_TIMESTAMP
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();