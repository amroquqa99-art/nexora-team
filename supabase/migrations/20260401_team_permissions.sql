-- 1. Add permissions to team_members
ALTER TABLE public.team_members 
ADD COLUMN IF NOT EXISTS can_post_feed BOOLEAN DEFAULT false;

-- 2. Add assigned_team to profiles for client assignment
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS assigned_team JSONB DEFAULT '[]';

-- 3. In contact_messages it's already a single UUID, let's change or keep as is.
-- Let's keep contact_messages.assigned_to as is, but we'll use profiles.assigned_team for long term client assignment.

-- 4. Enable RLS on profiles to allow team members to view their assigned clients
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname = 'Team members can view assigned profiles' AND tablename = 'profiles'
    ) THEN
        CREATE POLICY "Team members can view assigned profiles" ON public.profiles FOR SELECT TO authenticated USING (
            auth.uid() IN (
                SELECT user_id FROM public.team_members 
                WHERE id::text IN (SELECT jsonb_array_elements_text(assigned_team))
            )
        );
    END IF;
END $$;
