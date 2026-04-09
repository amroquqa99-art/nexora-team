-- NEXORA FULL DATABASE MIGRATION & SEED BUNDLE
-- Auto-generated for project bpeaabjzqdmnumevfeoa



-- ==========================================
-- MIGRATION: 20260302131933_70060498-3f1a-402d-b968-e308abd6336c.sql
-- ==========================================


-- Create app_role enum
DO $ BEGIN
    CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
EXCEPTION
    WHEN duplicate_object THEN null;
END $;

-- User roles table
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Helper: is current user admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'admin')
$$;

-- Projects table
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title_ar TEXT NOT NULL DEFAULT '',
  title_en TEXT NOT NULL DEFAULT '',
  description_ar TEXT NOT NULL DEFAULT '',
  description_en TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'other',
  thumbnail_url TEXT DEFAULT '',
  video_url TEXT DEFAULT '',
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Team members table
CREATE TABLE IF NOT EXISTS public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ar TEXT NOT NULL DEFAULT '',
  name_en TEXT NOT NULL DEFAULT '',
  role_ar TEXT NOT NULL DEFAULT '',
  role_en TEXT NOT NULL DEFAULT '',
  image_url TEXT DEFAULT '',
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- Join requests table
CREATE TABLE IF NOT EXISTS public.join_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT DEFAULT '',
  specialty TEXT NOT NULL DEFAULT '',
  portfolio_url TEXT DEFAULT '',
  message TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.join_requests ENABLE ROW LEVEL SECURITY;

-- Contact messages table
CREATE TABLE IF NOT EXISTS public.contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- Site content table
CREATE TABLE IF NOT EXISTS public.site_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value_ar TEXT NOT NULL DEFAULT '',
  value_en TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;

-- Social links table
CREATE TABLE IF NOT EXISTS public.social_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT NOT NULL DEFAULT '',
  url TEXT NOT NULL DEFAULT '',
  icon TEXT NOT NULL DEFAULT '',
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.social_links ENABLE ROW LEVEL SECURITY;

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers for updated_at
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_team_members_updated_at BEFORE UPDATE ON public.team_members FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_site_content_updated_at BEFORE UPDATE ON public.site_content FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies

-- user_roles: only admins can manage
DROP POLICY IF EXISTS "Admins can view roles" ON public.user_roles;
CREATE POLICY "Admins can view roles" ON public.user_roles FOR SELECT TO authenticated USING (public.is_admin());
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- projects: public read, admin CRUD
DROP POLICY IF EXISTS "Public can read projects" ON public.projects;
CREATE POLICY "Public can read projects" ON public.projects FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins can manage projects" ON public.projects;
CREATE POLICY "Admins can manage projects" ON public.projects FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- team_members: public read, admin CRUD
DROP POLICY IF EXISTS "Public can read team" ON public.team_members;
CREATE POLICY "Public can read team" ON public.team_members FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins can manage team" ON public.team_members;
CREATE POLICY "Admins can manage team" ON public.team_members FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- join_requests: anyone can insert, admin can read/manage
DROP POLICY IF EXISTS "Anyone can submit join request" ON public.join_requests;
CREATE POLICY "Anyone can submit join request" ON public.join_requests FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Admins can view join requests" ON public.join_requests;
CREATE POLICY "Admins can view join requests" ON public.join_requests FOR SELECT TO authenticated USING (public.is_admin());
DROP POLICY IF EXISTS "Admins can manage join requests" ON public.join_requests;
CREATE POLICY "Admins can manage join requests" ON public.join_requests FOR UPDATE TO authenticated USING (public.is_admin());
DROP POLICY IF EXISTS "Admins can delete join requests" ON public.join_requests;
CREATE POLICY "Admins can delete join requests" ON public.join_requests FOR DELETE TO authenticated USING (public.is_admin());

-- contact_messages: anyone can insert, admin can read/manage
DROP POLICY IF EXISTS "Anyone can send message" ON public.contact_messages;
CREATE POLICY "Anyone can send message" ON public.contact_messages FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Admins can view messages" ON public.contact_messages;
CREATE POLICY "Admins can view messages" ON public.contact_messages FOR SELECT TO authenticated USING (public.is_admin());
DROP POLICY IF EXISTS "Admins can manage messages" ON public.contact_messages;
CREATE POLICY "Admins can manage messages" ON public.contact_messages FOR UPDATE TO authenticated USING (public.is_admin());
DROP POLICY IF EXISTS "Admins can delete messages" ON public.contact_messages;
CREATE POLICY "Admins can delete messages" ON public.contact_messages FOR DELETE TO authenticated USING (public.is_admin());

-- site_content: public read, admin CRUD
DROP POLICY IF EXISTS "Public can read content" ON public.site_content;
CREATE POLICY "Public can read content" ON public.site_content FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins can manage content" ON public.site_content;
CREATE POLICY "Admins can manage content" ON public.site_content FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- social_links: public read, admin CRUD
DROP POLICY IF EXISTS "Public can read social links" ON public.social_links;
CREATE POLICY "Public can read social links" ON public.social_links FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins can manage social links" ON public.social_links;
CREATE POLICY "Admins can manage social links" ON public.social_links FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());


-- ==========================================
-- MIGRATION: 20260303123946_263d78c1-388a-47c2-919d-e459ea9b93a4.sql
-- ==========================================


-- Add CRM fields to contact_messages
ALTER TABLE public.contact_messages
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS assigned_to uuid REFERENCES public.team_members(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS internal_notes text DEFAULT '',
  ADD COLUMN IF NOT EXISTS company text DEFAULT '',
  ADD COLUMN IF NOT EXISTS service_type text DEFAULT '',
  ADD COLUMN IF NOT EXISTS budget text DEFAULT '';

-- Add more roles to enum

DO $ BEGIN
    ALTER TYPE public.app_role ADD VALUE 'project_manager';
EXCEPTION
    WHEN duplicate_object THEN null;
END $;;

DO $ BEGIN
    ALTER TYPE public.app_role ADD VALUE 'creative_lead';
EXCEPTION
    WHEN duplicate_object THEN null;
END $;;

DO $ BEGIN
    ALTER TYPE public.app_role ADD VALUE 'editor';
EXCEPTION
    WHEN duplicate_object THEN null;
END $;;

DO $ BEGIN
    ALTER TYPE public.app_role ADD VALUE 'designer';
EXCEPTION
    WHEN duplicate_object THEN null;
END $;;

DO $ BEGIN
    ALTER TYPE public.app_role ADD VALUE 'social_media_manager';
EXCEPTION
    WHEN duplicate_object THEN null;
END $;;

-- Activity logs table
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action text NOT NULL,
  details text DEFAULT '',
  entity_type text DEFAULT '',
  entity_id text DEFAULT '',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view activity logs" ON public.activity_logs;
CREATE POLICY "Admins can view activity logs" ON public.activity_logs
  FOR SELECT TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "Authenticated can insert logs" ON public.activity_logs;
CREATE POLICY "Authenticated can insert logs" ON public.activity_logs
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Add rating fields to team_members
ALTER TABLE public.team_members
  ADD COLUMN IF NOT EXISTS rating integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rating_notes text DEFAULT '',
  ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;


-- ==========================================
-- MIGRATION: 20260305085728_49c3f16f-fe1a-4ae3-b863-90256cb7aefe.sql
-- ==========================================


-- Storage buckets for direct file uploads
INSERT INTO storage.buckets (id, name, public) VALUES ('uploads', 'uploads', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('project-files', 'project-files', false);

-- Storage RLS policies
DROP POLICY IF EXISTS "Admins can upload" ON storage.objects;
CREATE POLICY "Admins can upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'uploads' AND (SELECT public.is_admin()));
DROP POLICY IF EXISTS "Admins can update uploads" ON storage.objects;
CREATE POLICY "Admins can update uploads" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'uploads' AND (SELECT public.is_admin()));
DROP POLICY IF EXISTS "Admins can delete uploads" ON storage.objects;
CREATE POLICY "Admins can delete uploads" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'uploads' AND (SELECT public.is_admin()));
DROP POLICY IF EXISTS "Public can view uploads" ON storage.objects;
CREATE POLICY "Public can view uploads" ON storage.objects FOR SELECT USING (bucket_id = 'uploads');

DROP POLICY IF EXISTS "Auth users can upload project files" ON storage.objects;
CREATE POLICY "Auth users can upload project files" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'project-files');
DROP POLICY IF EXISTS "Auth users can view project files" ON storage.objects;
CREATE POLICY "Auth users can view project files" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'project-files');
DROP POLICY IF EXISTS "Admins can delete project files" ON storage.objects;
CREATE POLICY "Admins can delete project files" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'project-files' AND (SELECT public.is_admin()));

-- Profiles table for clients
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  company TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  avatar_url TEXT DEFAULT '',
  client_type TEXT NOT NULL DEFAULT 'one_time' CHECK (client_type IN ('one_time', 'contract')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
CREATE POLICY "Users can read own profile" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid());
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid());
DROP POLICY IF EXISTS "Admins can read all profiles" ON public.profiles;
CREATE POLICY "Admins can read all profiles" ON public.profiles FOR SELECT TO authenticated USING ((SELECT public.is_admin()));
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
CREATE POLICY "Admins can update all profiles" ON public.profiles FOR UPDATE TO authenticated USING ((SELECT public.is_admin()));
DROP POLICY IF EXISTS "Admins can insert profiles" ON public.profiles;
CREATE POLICY "Admins can insert profiles" ON public.profiles FOR INSERT TO authenticated WITH CHECK ((SELECT public.is_admin()));
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), NEW.email);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Client projects table with phase tracking
CREATE TABLE IF NOT EXISTS public.client_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT '',
  description TEXT DEFAULT '',
  phase TEXT NOT NULL DEFAULT 'request' CHECK (phase IN ('request', 'planning', 'production', 'review', 'delivery', 'completed')),
  assigned_team JSONB DEFAULT '[]',
  progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  service_type TEXT DEFAULT '',
  budget TEXT DEFAULT '',
  start_date TIMESTAMPTZ,
  deadline TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.client_projects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Clients can view own projects" ON public.client_projects;
CREATE POLICY "Clients can view own projects" ON public.client_projects FOR SELECT TO authenticated USING (client_id = auth.uid());
DROP POLICY IF EXISTS "Admins can manage client projects" ON public.client_projects;
CREATE POLICY "Admins can manage client projects" ON public.client_projects FOR ALL TO authenticated USING ((SELECT public.is_admin())) WITH CHECK ((SELECT public.is_admin()));

-- Project messages
CREATE TABLE IF NOT EXISTS public.project_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.client_projects(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  sender_name TEXT NOT NULL DEFAULT '',
  sender_role TEXT NOT NULL DEFAULT 'client',
  message TEXT NOT NULL DEFAULT '',
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.project_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Project participants can view messages" ON public.project_messages;
CREATE POLICY "Project participants can view messages" ON public.project_messages FOR SELECT TO authenticated USING (
  sender_id = auth.uid() OR 
  EXISTS (SELECT 1 FROM public.client_projects WHERE id = project_id AND client_id = auth.uid()) OR
  (SELECT public.is_admin())
);
DROP POLICY IF EXISTS "Auth users can send messages" ON public.project_messages;
CREATE POLICY "Auth users can send messages" ON public.project_messages FOR INSERT TO authenticated WITH CHECK (sender_id = auth.uid());
DROP POLICY IF EXISTS "Admins can manage messages" ON public.project_messages;
CREATE POLICY "Admins can manage messages" ON public.project_messages FOR ALL TO authenticated USING ((SELECT public.is_admin())) WITH CHECK ((SELECT public.is_admin()));

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.project_messages;

-- Project files
CREATE TABLE IF NOT EXISTS public.project_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.client_projects(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL,
  file_name TEXT NOT NULL DEFAULT '',
  file_url TEXT NOT NULL DEFAULT '',
  file_type TEXT DEFAULT '',
  file_size BIGINT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.project_files ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Project participants can view files" ON public.project_files;
CREATE POLICY "Project participants can view files" ON public.project_files FOR SELECT TO authenticated USING (
  uploaded_by = auth.uid() OR 
  EXISTS (SELECT 1 FROM public.client_projects WHERE id = project_id AND client_id = auth.uid()) OR
  (SELECT public.is_admin())
);
DROP POLICY IF EXISTS "Auth users can upload files" ON public.project_files;
CREATE POLICY "Auth users can upload files" ON public.project_files FOR INSERT TO authenticated WITH CHECK (uploaded_by = auth.uid());
DROP POLICY IF EXISTS "Admins can manage files" ON public.project_files;
CREATE POLICY "Admins can manage files" ON public.project_files FOR ALL TO authenticated USING ((SELECT public.is_admin())) WITH CHECK ((SELECT public.is_admin()));

-- Invoices
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.client_projects(id) ON DELETE SET NULL,
  client_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  invoice_number TEXT NOT NULL DEFAULT '',
  amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
  due_date TIMESTAMPTZ,
  paid_date TIMESTAMPTZ,
  items JSONB DEFAULT '[]',
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Clients can view own invoices" ON public.invoices;
CREATE POLICY "Clients can view own invoices" ON public.invoices FOR SELECT TO authenticated USING (client_id = auth.uid());
DROP POLICY IF EXISTS "Admins can manage invoices" ON public.invoices;
CREATE POLICY "Admins can manage invoices" ON public.invoices FOR ALL TO authenticated USING ((SELECT public.is_admin())) WITH CHECK ((SELECT public.is_admin()));

-- Contracts with digital signature
CREATE TABLE IF NOT EXISTS public.contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.client_projects(id) ON DELETE SET NULL,
  client_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'signed', 'expired')),
  signature_data TEXT,
  signed_at TIMESTAMPTZ,
  signed_by_name TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Clients can view own contracts" ON public.contracts;
CREATE POLICY "Clients can view own contracts" ON public.contracts FOR SELECT TO authenticated USING (client_id = auth.uid());
DROP POLICY IF EXISTS "Clients can sign contracts" ON public.contracts;
CREATE POLICY "Clients can sign contracts" ON public.contracts FOR UPDATE TO authenticated USING (client_id = auth.uid());
DROP POLICY IF EXISTS "Admins can manage contracts" ON public.contracts;
CREATE POLICY "Admins can manage contracts" ON public.contracts FOR ALL TO authenticated USING ((SELECT public.is_admin())) WITH CHECK ((SELECT public.is_admin()));

-- Client reviews
CREATE TABLE IF NOT EXISTS public.client_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.client_projects(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT DEFAULT '',
  is_approved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.client_reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Clients can create reviews" ON public.client_reviews;
CREATE POLICY "Clients can create reviews" ON public.client_reviews FOR INSERT TO authenticated WITH CHECK (client_id = auth.uid());
DROP POLICY IF EXISTS "Clients can view own reviews" ON public.client_reviews;
CREATE POLICY "Clients can view own reviews" ON public.client_reviews FOR SELECT TO authenticated USING (client_id = auth.uid());
DROP POLICY IF EXISTS "Public can view approved reviews" ON public.client_reviews;
CREATE POLICY "Public can view approved reviews" ON public.client_reviews FOR SELECT USING (is_approved = true);
DROP POLICY IF EXISTS "Admins can manage reviews" ON public.client_reviews;
CREATE POLICY "Admins can manage reviews" ON public.client_reviews FOR ALL TO authenticated USING ((SELECT public.is_admin())) WITH CHECK ((SELECT public.is_admin()));

-- Notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  message TEXT NOT NULL DEFAULT '',
  type TEXT NOT NULL DEFAULT 'info',
  is_read BOOLEAN NOT NULL DEFAULT false,
  link TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT TO authenticated USING (user_id = auth.uid());
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE TO authenticated USING (user_id = auth.uid());
DROP POLICY IF EXISTS "Admins can create notifications" ON public.notifications;
CREATE POLICY "Admins can create notifications" ON public.notifications FOR INSERT TO authenticated WITH CHECK ((SELECT public.is_admin()));
DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;
CREATE POLICY "System can create notifications" ON public.notifications FOR INSERT WITH CHECK (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;


-- ==========================================
-- MIGRATION: 20260307092521_eb685165-c676-42b9-a868-f98d15294373.sql
-- ==========================================


ALTER TABLE public.team_members ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Allow team members to read their own record
CREATE POLICY "Team members can read own record"
  ON public.team_members FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Allow team members to view projects assigned to them
CREATE POLICY "Team members can view assigned projects"
  ON public.client_projects FOR SELECT
  TO authenticated
  USING (
    assigned_team::text LIKE '%' || auth.uid()::text || '%'
    OR EXISTS (SELECT 1 FROM public.team_members WHERE team_members.user_id = auth.uid() AND team_members.id::text IN (SELECT jsonb_array_elements_text(client_projects.assigned_team)))
  );

-- Allow team members to view messages for their assigned projects
CREATE POLICY "Team members can view project messages"
  ON public.project_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.client_projects cp
      WHERE cp.id = project_messages.project_id
      AND (
        cp.assigned_team::text LIKE '%' || auth.uid()::text || '%'
        OR EXISTS (SELECT 1 FROM public.team_members tm WHERE tm.user_id = auth.uid() AND tm.id::text IN (SELECT jsonb_array_elements_text(cp.assigned_team)))
      )
    )
  );

-- Allow team members to send messages
CREATE POLICY "Team members can send messages"
  ON public.project_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.client_projects cp
      WHERE cp.id = project_messages.project_id
      AND (
        cp.assigned_team::text LIKE '%' || auth.uid()::text || '%'
        OR EXISTS (SELECT 1 FROM public.team_members tm WHERE tm.user_id = auth.uid() AND tm.id::text IN (SELECT jsonb_array_elements_text(cp.assigned_team)))
      )
    )
  );

-- Allow team members to view project files
CREATE POLICY "Team members can view project files"
  ON public.project_files FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.client_projects cp
      WHERE cp.id = project_files.project_id
      AND (
        cp.assigned_team::text LIKE '%' || auth.uid()::text || '%'
        OR EXISTS (SELECT 1 FROM public.team_members tm WHERE tm.user_id = auth.uid() AND tm.id::text IN (SELECT jsonb_array_elements_text(cp.assigned_team)))
      )
    )
  );

-- Allow team members to upload files to assigned projects
CREATE POLICY "Team members can upload files"
  ON public.project_files FOR INSERT
  TO authenticated
  WITH CHECK (
    uploaded_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.client_projects cp
      WHERE cp.id = project_files.project_id
      AND (
        cp.assigned_team::text LIKE '%' || auth.uid()::text || '%'
        OR EXISTS (SELECT 1 FROM public.team_members tm WHERE tm.user_id = auth.uid() AND tm.id::text IN (SELECT jsonb_array_elements_text(cp.assigned_team)))
      )
    )
  );

-- Allow team members to read client profiles for their projects
CREATE POLICY "Team members can read client profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.client_projects cp
      WHERE cp.client_id = profiles.id
      AND (
        cp.assigned_team::text LIKE '%' || auth.uid()::text || '%'
        OR EXISTS (SELECT 1 FROM public.team_members tm WHERE tm.user_id = auth.uid() AND tm.id::text IN (SELECT jsonb_array_elements_text(cp.assigned_team)))
      )
    )
  );


-- ==========================================
-- MIGRATION: 20260317_add_cms_tables.sql
-- ==========================================

-- Create site_content table
CREATE TABLE IF NOT EXISTS site_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(255) UNIQUE NOT NULL,
  value_ar TEXT NOT NULL,
  value_en TEXT NOT NULL,
  category VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Note: The services table might already exist from Lovable's skeleton, so we use IF NOT EXISTS
-- The current implementation uses static arrays, so we likely need to create it.
CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(100) UNIQUE NOT NULL,
  title_ar VARCHAR(255) NOT NULL,
  title_en VARCHAR(255) NOT NULL,
  description_ar TEXT NOT NULL,
  description_en TEXT NOT NULL,
  icon VARCHAR(100) NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Recreate trigger for updated_at if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_site_content_updated_at ON site_content;
CREATE TRIGGER update_site_content_updated_at
BEFORE UPDATE ON site_content
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_services_updated_at ON services;
CREATE TRIGGER update_services_updated_at
BEFORE UPDATE ON services
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE site_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

-- Policies for site_content (Public Read, Admin Write)
DROP POLICY IF EXISTS "Public Read Site Content" ON site_content;
CREATE POLICY "Public Read Site Content" ON site_content
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin Insert Site Content" ON site_content;
CREATE POLICY "Admin Insert Site Content" ON site_content
  FOR INSERT WITH CHECK (
    auth.uid() IN (SELECT id FROM user_roles WHERE role = 'admin')
  );

DROP POLICY IF EXISTS "Admin Update Site Content" ON site_content;
CREATE POLICY "Admin Update Site Content" ON site_content
  FOR UPDATE USING (
    auth.uid() IN (SELECT id FROM user_roles WHERE role = 'admin')
  );

DROP POLICY IF EXISTS "Admin Delete Site Content" ON site_content;
CREATE POLICY "Admin Delete Site Content" ON site_content
  FOR DELETE USING (
    auth.uid() IN (SELECT id FROM user_roles WHERE role = 'admin')
  );

-- Policies for services (Public Read, Admin Write)
DROP POLICY IF EXISTS "Public Read Services" ON services;
CREATE POLICY "Public Read Services" ON services
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin Insert Services" ON services;
CREATE POLICY "Admin Insert Services" ON services
  FOR INSERT WITH CHECK (
    auth.uid() IN (SELECT id FROM user_roles WHERE role = 'admin')
  );

DROP POLICY IF EXISTS "Admin Update Services" ON services;
CREATE POLICY "Admin Update Services" ON services
  FOR UPDATE USING (
    auth.uid() IN (SELECT id FROM user_roles WHERE role = 'admin')
  );

DROP POLICY IF EXISTS "Admin Delete Services" ON services;
CREATE POLICY "Admin Delete Services" ON services
  FOR DELETE USING (
    auth.uid() IN (SELECT id FROM user_roles WHERE role = 'admin')
  );

-- Seed initial site_content (Hero text as example)
INSERT INTO site_content (key, category, value_ar, value_en) VALUES 
('hero_title', 'hero', 'NEXORA', 'NEXORA'),
('hero_subtitle', 'hero', 'نصنع الإبداع الذي يُحدث الفرق', 'Crafting Creativity That Makes a Difference'),
('hero_desc', 'hero', 'فريق تسويقي إبداعي متخصص في بناء الهويات البصرية، إنتاج المحتوى، وإدارة الحملات الرقمية. نحوّل رؤيتك إلى واقع مؤثر.', 'A creative marketing team specializing in brand identity, content production, and digital campaign management. We turn your vision into impactful reality.'),
('about_subtitle', 'about', 'فريق تسويقي إبداعي يبني العلامات التجارية', 'A creative marketing team building brands'),
('about_desc', 'about', 'NEXORA هو فريق تسويقي إبداعي متخصص في بناء الهويات البصرية وإنتاج المحتوى الرقمي عالي الجودة. نقدم حلولاً متكاملة من التصميم والمونتاج إلى إدارة الحملات الإعلانية.', 'NEXORA is a creative marketing team specializing in building visual identities and producing high-quality digital content. We offer integrated solutions from design and editing to advertising campaign management.')
ON CONFLICT (key) DO NOTHING;

-- Seed initial services AND add Project Management
INSERT INTO services (key, title_ar, title_en, description_ar, description_en, icon, display_order) VALUES 
('project_management', 'إدارة المشاريع', 'Project Management', 'إدارة وتخطيط مشاريعك الرقمية باحترافية', 'Professional planning and management of your digital projects', 'Briefcase', 1),
('montage', 'مونتاج احترافي', 'Professional Editing', 'مونتاج فيديو احترافي بأعلى معايير الجودة', 'Professional video editing with the highest quality standards', 'Film', 2),
('motion', 'موشن جرافيك', 'Motion Graphics', 'رسوم متحركة إبداعية تروي قصتك', 'Creative animations that tell your story', 'Sparkles', 3),
('design', 'تصميم إبداعي', 'Creative Design', 'تصاميم مبتكرة تعكس هويتك البصرية', 'Innovative designs that reflect your visual identity', 'Palette', 4),
('social', 'إدارة سوشيال ميديا', 'Social Media Management', 'إدارة شاملة لحساباتك مع محتوى مخصص', 'Comprehensive account management with custom content', 'Share2', 5),
('branding', 'بناء الهوية البصرية', 'Brand Identity', 'هوية بصرية متكاملة تعكس قيم علامتك التجارية', 'Complete visual identity reflecting your brand values', 'Layers', 6),
('campaign', 'حملات إعلانية', 'Ad Campaigns', 'تخطيط وتنفيذ حملات رقمية فعّالة', 'Planning and executing effective digital campaigns', 'Megaphone', 7)
ON CONFLICT (key) DO NOTHING;


-- ==========================================
-- MIGRATION: 20260325_expand_features.sql
-- ==========================================

-- Add is_featured to projects
ALTER TABLE projects ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;

-- Add message_type to contact_messages
ALTER TABLE contact_messages ADD COLUMN IF NOT EXISTS message_type VARCHAR(50) DEFAULT 'request';

-- Add check constraint for message_type
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'contact_messages_type_check') THEN
        ALTER TABLE contact_messages ADD CONSTRAINT contact_messages_type_check CHECK (message_type IN ('request', 'complaint', 'suggestion'));
    END IF;
END $$;

-- Add service_id to projects (optional but recommended for service detail links)
ALTER TABLE projects ADD COLUMN IF NOT EXISTS service_id UUID REFERENCES services(id) ON DELETE SET NULL;


-- ==========================================
-- MIGRATION: 20260325_seed_services.sql
-- ==========================================

-- Seed script for all 8 core Nexora services
TRUNCATE TABLE services CASCADE;

INSERT INTO services (key, title_ar, title_en, description_ar, description_en, icon, color, display_order)
VALUES 
(
    'branding', 
    'بناء العلامة التجارية', 
    'Branding', 
    'هذه المرحلة الأساسية لأي مشروع. تشمل تصميم الهوية البصرية الكاملة، الشعار، وتحديد الألوان والخطوط الرسمية.', 
    'The foundational stage for any project. Includes full visual identity design, logo design, and defining official colors and fonts.', 
    'Palette', 
    'from-neon-cyan to-blue-600', 
    1
),
(
    'graphic_design', 
    'التصميم الجرافيكي', 
    'Graphic Design', 
    'تشمل تصاميم السوشيال ميديا، المنشورات، الحملات الإعلانية، البروشورات، والبوسترات الرقمية.', 
    'Includes social media designs, posts, advertising campaigns, brochures, and digital posters.', 
    'Brush', 
    'from-neon-violet to-purple-600', 
    2
),
(
    'video_production', 
    'صناعة الفيديو', 
    'Video Production', 
    'مونتاج الفيديو، فيديوهات تسويقية، موشن جرافيك، وإعلانات قصيرة (Reels/TikTok).', 
    'Video editing, marketing videos, motion graphics, and short ads (Reels/TikTok).', 
    'Video', 
    'from-red-500 to-orange-500', 
    3
),
(
    'social_media', 
    'إدارة السوشيال ميديا', 
    'Social Media Management', 
    'إنشاء استراتيجية المحتوى، إدارة الحسابات، جدولة النشر، وتحليل الأداء على مختلف المنصات.', 
    'Content strategy creation, account management, scheduling, and performance analysis across platforms.', 
    'Share2', 
    'from-blue-400 to-blue-700', 
    4
),
(
    'digital_marketing', 
    'التسويق الرقمي', 
    'Digital Marketing', 
    'إعلانات فيسبوك، إنستغرام، جوجل، وتحسين نتائج الحملات التسويقية وتحليل المنافسين.', 
    'Facebook, Instagram, and Google ads, performance optimization, and competitor analysis.', 
    'TrendingUp', 
    'from-green-400 to-emerald-600', 
    5
),
(
    'web_design', 
    'تصميم وتطوير المواقع', 
    'Web Design & Development', 
    'تصميم مواقع الشركات، صفحات الهبوط، وتحسين تجربة المستخدم مع سرعة وتجاوب كامل مع الموبايل.', 
    'Corporate website design, landing pages, and UX/UI optimization with high speed and full mobile responsiveness.', 
    'Globe', 
    'from-cyan-400 to-blue-500', 
    6
),
(
    'content_creation', 
    'إنتاج المحتوى', 
    'Content Creation', 
    'كتابة المحتوى التسويقي، سكربتات الفيديو، تدوينات السوشيال ميديا، ومحتوى المواقع.', 
    'Marketing copywriting, video scripts, social media posts, and website content.', 
    'PenTool', 
    'from-amber-400 to-orange-600', 
    7
),
(
    'consulting', 
    'الاستشارات الرقمية', 
    'Consulting', 
    'استشارات بناء البراند، خطط التسويق، وضع الاستراتيجيات، وتحليل الحسابات.', 
    'Branding consultations, marketing plans, strategy development, and account analysis.', 
    'MessageCircle', 
    'from-indigo-400 to-violet-600', 
    8
);


-- ==========================================
-- MIGRATION: db_fix_20260325.sql
-- ==========================================

-- Nexora Database Fix Script - 2026-03-25
-- Run this in the Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)

-- 1. Fix contact_messages table
ALTER TABLE contact_messages ADD COLUMN IF NOT EXISTS message_type VARCHAR(50) DEFAULT 'request';

-- Add check constraint for message_type if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'contact_messages_type_check') THEN
        ALTER TABLE contact_messages ADD CONSTRAINT contact_messages_type_check CHECK (message_type IN ('request', 'complaint', 'suggestion'));
    END IF;
END $$;

-- 2. Fix projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS service_id UUID REFERENCES services(id) ON DELETE SET NULL;

-- 3. Fix services table
ALTER TABLE services ADD COLUMN IF NOT EXISTS color VARCHAR(255) DEFAULT 'from-neon-cyan to-neon-violet';

-- 4. Ensure RLS is enabled and public can insert messages
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'contact_messages' 
        AND policyname = 'Enable insert for all'
    ) THEN
        DROP POLICY IF EXISTS "Enable insert for all" ON contact_messages;
CREATE POLICY "Enable insert for all" ON contact_messages FOR INSERT WITH CHECK (true);
    END IF;
END $$;

-- 5. Ensure public can read services
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'services' 
        AND policyname = 'Allow public read'
    ) THEN
        DROP POLICY IF EXISTS "Allow public read" ON services;
CREATE POLICY "Allow public read" ON services FOR SELECT USING (true);
    END IF;
END $$;



-- ==========================================
-- AUTO-ASSIGN ADMIN ROLE
-- ==========================================
-- This automatically assigns 'admin' to amro@nexora.team
DO $$
DECLARE
    v_user_id UUID;
BEGIN
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'amro@nexora.team' LIMIT 1;
    
    IF v_user_id IS NOT NULL THEN
        -- Safely insert the role
        INSERT INTO public.user_roles (user_id, role) 
        VALUES (v_user_id, 'admin')
        ON CONFLICT (user_id, role) DO NOTHING;
    END IF;
END $$;
