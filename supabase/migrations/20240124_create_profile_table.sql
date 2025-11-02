-- Create Profile table
CREATE TABLE IF NOT EXISTS "Profile" (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    ai_tone TEXT NOT NULL DEFAULT 'tough',
    ai_intensity INTEGER NOT NULL DEFAULT 5,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Set up Row Level Security (RLS)
ALTER TABLE "Profile" ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own profile"
    ON "Profile"
    FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON "Profile"
    FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Profile is inserted on signup"
    ON "Profile"
    FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Create function to handle updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER update_profile_updated_at
    BEFORE UPDATE ON "Profile"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();