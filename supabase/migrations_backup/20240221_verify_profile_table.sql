-- Drop any existing old tables and objects
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public."Profile" CASCADE;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create the Profile table
CREATE TABLE IF NOT EXISTS public."Profile" (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE,
    email TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    ai_goal TEXT,
    ai_tone TEXT DEFAULT 'tough'::text,
    ai_intensity NUMERIC DEFAULT 5,
    CONSTRAINT username_length CHECK (char_length(username) >= 3)
);

-- Set up basic permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON public."Profile" TO postgres, service_role;
GRANT ALL ON public."Profile" TO authenticated;
GRANT SELECT ON public."Profile" TO anon;

-- Enable RLS
ALTER TABLE public."Profile" ENABLE ROW LEVEL SECURITY;

-- Create policies
DO $$
BEGIN
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Enable read for users" ON public."Profile";
    DROP POLICY IF EXISTS "Enable insert for users" ON public."Profile";
    DROP POLICY IF EXISTS "Enable update for users" ON public."Profile";
    
    -- Create new policies
    CREATE POLICY "Enable read for users"
        ON public."Profile"
        FOR SELECT
        USING (true);  -- Allow all users to read profiles

    CREATE POLICY "Enable insert for users"
        ON public."Profile"
        FOR INSERT
        WITH CHECK (auth.uid() = id);

    CREATE POLICY "Enable update for users"
        ON public."Profile"
        FOR UPDATE
        USING (auth.uid() = id);
END
$$;

-- Create the function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO public."Profile" (id, email, updated_at)
    VALUES (NEW.id, NEW.email, now())
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Verify table exists and has correct structure
DO $$
BEGIN
    RAISE NOTICE 'Verifying Profile table...';
    IF EXISTS (
        SELECT FROM pg_tables
        WHERE schemaname = 'public'
        AND tablename = 'Profile'
    ) THEN
        RAISE NOTICE 'Profile table exists';
    ELSE
        RAISE EXCEPTION 'Profile table does not exist';
    END IF;
END
$$;