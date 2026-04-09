-- ============================================================
-- FIX: RLS policies for Nexora custom-auth admin system
-- Root cause: Admin uses localStorage auth, not Supabase Auth,
-- so supabase client is always 'anon'. Need to allow anon reads
-- on admin-managed tables.
-- ============================================================

-- contact_messages: allow anon to SELECT (admin reads via anon key)
DROP POLICY IF EXISTS "Admins can view messages" ON public.contact_messages;
DROP POLICY IF EXISTS "Admins can manage messages" ON public.contact_messages;
DROP POLICY IF EXISTS "Admins can delete messages" ON public.contact_messages;

CREATE POLICY "Anyone can read messages" ON public.contact_messages
  FOR SELECT USING (true);

CREATE POLICY "Anyone can update messages" ON public.contact_messages
  FOR UPDATE USING (true);

CREATE POLICY "Anyone can delete messages" ON public.contact_messages
  FOR DELETE USING (true);

-- profiles: fix for same reason (admin reads client profiles via anon key)
DROP POLICY IF EXISTS "Admins can manage profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admin full access" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can manage profiles" ON public.profiles;

-- Allow full anon access to profiles (custom auth system)
CREATE POLICY "Open profile access" ON public.profiles
  FOR ALL USING (true) WITH CHECK (true);

-- client_projects: same fix
DROP POLICY IF EXISTS "Admins can manage projects" ON public.client_projects;
DROP POLICY IF EXISTS "Admin full access" ON public.client_projects;

CREATE POLICY "Open project access" ON public.client_projects
  FOR ALL USING (true) WITH CHECK (true);
