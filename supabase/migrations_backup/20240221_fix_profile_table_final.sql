-- First drop the old table and related objects
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public."Profile" CASCADE;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create the Profile table with proper case
CREATE TABLE public."Profile" (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE,
    email TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    ai_goal TEXT,
    ai_tone TEXT DEFAULT 'tough'::text,
    ai_intensity NUMERIC DEFAULT 5,
    CONSTRAINT username_length CHECK (char_length(username) >= 3)
);

-- Enable RLS
ALTER TABLE public."Profile" ENABLE ROW LEVEL SECURITY;

-- Grant access to service role first
GRANT USAGE ON SCHEMA public TO service_role;
GRANT ALL ON public."Profile" TO service_role;

-- Grant access to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public."Profile" TO authenticated;

-- Grant access to anon users
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON public."Profile" TO anon;

-- Create RLS Policies with proper case
CREATE POLICY "Enable read for authenticated users"
ON public."Profile"
FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Enable insert for users based on user_id"
ON public."Profile"
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable update for users based on user_id"
ON public."Profile"
FOR UPDATE
TO authenticated
USING (auth.uid() = id);

-- Create function to handle new user creation
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

-- Create trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Index for performance
CREATE INDEX IF NOT EXISTS profile_user_id_idx ON public."Profile"(id);

-- Insert a test row to verify permissions
INSERT INTO public."Profile" (id, email, ai_tone, ai_intensity)
SELECT 
    auth.uid(),
    (SELECT email FROM auth.users WHERE id = auth.uid()),
    'tough',
    5
WHERE 
    NOT EXISTS (
        SELECT 1 FROM public."Profile" WHERE id = auth.uid()
    )
AND
    auth.uid() IS NOT NULL;