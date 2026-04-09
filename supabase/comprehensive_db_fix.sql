-- Nexora Comprehensive Database Fix - 2026-03-25
-- Run this in the Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)

-- 1. Ensure contact_messages table has all required columns
ALTER TABLE public.contact_messages 
ADD COLUMN IF NOT EXISTS message_type VARCHAR(50) DEFAULT 'request',
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'new',
ADD COLUMN IF NOT EXISTS company TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS service_type TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS budget TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS internal_notes TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES public.team_members(id) ON DELETE SET NULL;

-- 2. Add check constraint for message_type
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'contact_messages_type_check') THEN
        ALTER TABLE public.contact_messages ADD CONSTRAINT contact_messages_type_check CHECK (message_type IN ('request', 'complaint', 'suggestion'));
    END IF;
END $$;

-- 3. Ensure RLS is enabled and public can insert into contact_messages
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'contact_messages' 
        AND policyname = 'Enable insert for all'
    ) THEN
        CREATE POLICY "Enable insert for all" ON public.contact_messages FOR INSERT WITH CHECK (true);
    END IF;
END $$;

-- 4. Ensure is_admin() function exists and is accessible for RPC
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  )
$$;

-- 5. Helper Script to Grant Admin Role (Replace with actual user ID)
-- To find your user ID: SELECT id, email FROM auth.users;
-- After finding it, run:
-- INSERT INTO public.user_roles (user_id, role) VALUES ('YOUR_USER_ID_HERE', 'admin') ON CONFLICT DO NOTHING;

-- 6. Ensure public can read services
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'services' 
        AND policyname = 'Allow public read'
    ) THEN
        CREATE POLICY "Allow public read" ON public.services FOR SELECT USING (true);
    END IF;
END $$;

-- 7. Ensure profile creation function is correct
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
