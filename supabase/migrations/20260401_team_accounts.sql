-- Add standalone login credentials for team members managed by Master Admin
ALTER TABLE public.team_members
ADD COLUMN IF NOT EXISTS login_email TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS login_password TEXT;

-- Also add assigned_team column to client_projects for proper task routing
ALTER TABLE public.client_projects
ADD COLUMN IF NOT EXISTS assigned_team JSONB DEFAULT '[]'::jsonb;
