-- ============================================================
-- NEXORA COMPREHENSIVE CRM & PIPELINE DATABASE FIX
-- This script synchronizes the database with the new request-driven
-- architecture and fixes visibility issues for the admin dashboard.
-- ============================================================

-- 1. SANITY CHECK: Ensure contact_messages has all required fields
ALTER TABLE public.contact_messages ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
ALTER TABLE public.contact_messages ADD COLUMN IF NOT EXISTS message_type VARCHAR(50) DEFAULT 'request';
ALTER TABLE public.contact_messages ADD COLUMN IF NOT EXISTS service_type VARCHAR(100);

-- Ensure message_type has correct constraint
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'contact_messages_type_check') THEN
        ALTER TABLE public.contact_messages ADD CONSTRAINT contact_messages_type_check 
        CHECK (message_type IN ('request', 'complaint', 'suggestion'));
    END IF;
END $$;

-- 2. PIPELINE SYNCHRONIZATION: Fix phase values in client_projects
-- We use: queued, planning, production, delivery
UPDATE public.client_projects SET phase = 'queued' WHERE phase IN ('waiting', 'request', 'pending');
UPDATE public.client_projects SET phase = 'production' WHERE phase IN ('working', 'execution');
UPDATE public.client_projects SET phase = 'delivery' WHERE phase = 'completed';

-- 3. RLS SECURITY FIX: Allow Admin Dashboard (Anon Role) to manage data
-- Because Admin uses custom localStorage auth, we must allow 'anon' access.

-- contact_messages:
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can send message" ON public.contact_messages;
DROP POLICY IF EXISTS "Anyone can read messages" ON public.contact_messages;
DROP POLICY IF EXISTS "Anyone can update messages" ON public.contact_messages;
DROP POLICY IF EXISTS "Anyone can delete messages" ON public.contact_messages;
DROP POLICY IF EXISTS "Admins can view messages" ON public.contact_messages;
DROP POLICY IF EXISTS "Admins can manage messages" ON public.contact_messages;

CREATE POLICY "Anyone can insert messages" ON public.contact_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can select messages" ON public.contact_messages FOR SELECT USING (true);
CREATE POLICY "Anyone can update messages" ON public.contact_messages FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete messages" ON public.contact_messages FOR DELETE USING (true);

-- profiles:
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can manage profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admin full access" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can manage profiles" ON public.profiles;
DROP POLICY IF EXISTS "Open profile access" ON public.profiles;

CREATE POLICY "Full access to profiles" ON public.profiles FOR ALL USING (true) WITH CHECK (true);

-- client_projects:
ALTER TABLE public.client_projects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can manage projects" ON public.client_projects;
DROP POLICY IF EXISTS "Admin full access" ON public.client_projects;
DROP POLICY IF EXISTS "Open project access" ON public.client_projects;

CREATE POLICY "Full access to projects" ON public.client_projects FOR ALL USING (true) WITH CHECK (true);

-- 4. SITE CONTENT & CONFIGURATION FIX:
-- Allow Admin Dashboard (Anon Role) to edit site strings and toggles.
ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read content" ON public.site_content;
DROP POLICY IF EXISTS "Admins can manage content" ON public.site_content;

CREATE POLICY "Anyone can select content" ON public.site_content FOR SELECT USING (true);
CREATE POLICY "Anyone can insert content" ON public.site_content FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update content" ON public.site_content FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete content" ON public.site_content FOR DELETE USING (true);

-- Ensure visibility keys exist so the toggle doesn't fail on first click
INSERT INTO public.site_content (key, value_en, value_ar) 
VALUES ('team_section_visible', 'true', 'true')
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.site_content (key, value_en, value_ar) 
VALUES ('join_team_visible', 'true', 'true')
ON CONFLICT (key) DO NOTHING;

-- 5. REPEAT CLIENT LOGIC: Ensure profiles table supports categorization
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS client_type VARCHAR(20) DEFAULT 'one_time';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone VARCHAR(20);

-- Done!
