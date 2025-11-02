-- Reset and recreate RLS policies for profiles table
BEGIN;

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can insert their own profile." ON profiles;
DROP POLICY IF EXISTS "Users can update own profile." ON profiles;
DROP POLICY IF EXISTS "Users can read own profile." ON profiles;

-- Create policies
CREATE POLICY "Users can insert their own profile."
ON profiles FOR INSERT
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile."
ON profiles FOR UPDATE
USING (auth.uid() = id);

CREATE POLICY "Users can read own profile."
ON profiles FOR SELECT
USING (auth.uid() = id);

COMMIT;