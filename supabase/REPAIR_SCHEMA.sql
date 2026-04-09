-- NEXORA TOTAL PLATFORM RESTORE SCRIPT (FINAL VERSION)
-- Copy this entire script and paste it into the "SQL Editor" in your Supabase Dashboard.
-- Click "Run" to fix EVERYTHING: Services, Texts, Inquiries, Storage, and Team Joins.

-- 1. Create Core Application Tables
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    company TEXT,
    client_type TEXT DEFAULT 'individual',
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.site_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL,
    value_ar TEXT DEFAULT '',
    value_en TEXT DEFAULT '',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL,
    title_ar TEXT NOT NULL,
    title_en TEXT NOT NULL,
    description_ar TEXT NOT NULL,
    description_en TEXT NOT NULL,
    icon TEXT NOT NULL DEFAULT 'Briefcase',
    color TEXT DEFAULT 'from-neon-cyan to-neon-violet',
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title_ar TEXT NOT NULL, title_en TEXT NOT NULL,
    description_ar TEXT NOT NULL, description_en TEXT NOT NULL,
    thumbnail_url TEXT, video_url TEXT, category TEXT DEFAULT 'all',
    display_order INTEGER DEFAULT 0, is_featured BOOLEAN DEFAULT false,
    service_id UUID REFERENCES public.services(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name_ar TEXT NOT NULL, name_en TEXT NOT NULL, role_ar TEXT NOT NULL, role_en TEXT NOT NULL,
    image_url TEXT, display_order INTEGER DEFAULT 0, rating INTEGER DEFAULT 5, rating_notes TEXT,
    is_active BOOLEAN DEFAULT true, user_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.contact_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL, email TEXT NOT NULL, message TEXT NOT NULL,
    company TEXT, budget TEXT, service_type TEXT, message_type TEXT DEFAULT 'request',
    status TEXT DEFAULT 'pending', internal_notes TEXT, is_read BOOLEAN DEFAULT false,
    assigned_to UUID, created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.join_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL, email TEXT NOT NULL, phone TEXT,
    specialty TEXT NOT NULL, portfolio_url TEXT, message TEXT,
    status TEXT DEFAULT 'pending', created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.client_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES public.profiles(id),
    title TEXT NOT NULL, description TEXT, phase TEXT DEFAULT 'planning', progress INTEGER DEFAULT 0,
    service_type TEXT, budget TEXT, start_date DATE, deadline DATE, assigned_team JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES public.profiles(id),
    project_id UUID REFERENCES public.client_projects(id),
    invoice_number TEXT UNIQUE NOT NULL, amount DECIMAL NOT NULL, currency TEXT DEFAULT 'USD',
    status TEXT DEFAULT 'unpaid', items JSONB, notes TEXT, due_date DATE, paid_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. DISABLE RLS (Make system operational instantly)
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_content DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.services DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.join_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices DISABLE ROW LEVEL SECURITY;

-- 3. UNLOCK STORAGE (Enable image uploads)
CREATE OR REPLACE FUNCTION storage_unlock_all() 
RETURNS void AS $$
BEGIN
    INSERT INTO storage.buckets (id, name, public) 
    VALUES ('uploads', 'uploads', true) 
    ON CONFLICT (id) DO UPDATE SET public = true;

    DELETE FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects';
    
    CREATE POLICY "Full Public Access" ON storage.objects FOR ALL USING (true) WITH CHECK (true);
END;
$$ LANGUAGE plpgsql;

SELECT storage_unlock_all();

-- 4. INSERT INITIAL CONTENT
INSERT INTO public.site_content (key, value_ar, value_en) VALUES
('common.siteName', 'NEXORA', 'NEXORA'),
('hero.title', 'NEXORA', 'NEXORA'),
('hero.subtitle', 'نصنع الإبداع الذي يُحدث الفرق', 'Crafting Creativity That Makes a Difference'),
('hero.description', 'فريق تسويقي إبداعي متخصص في بناء الهويات البصرية، إنتاج المحتوى، وإدارة الحملات الرقمية.', 'A creative marketing team specializing in brand identity and digital campaigns.'),
('hero.cta', 'اكتشف خدماتنا', 'Discover Our Services'),
('indexCta.title', 'هل أنت مستعد لمشروعك القادم؟', 'Ready for Your Next Project?'),
('indexCta.requestBtn', 'اطلب خدمتك الآن', 'Request Now'),
('indexCta.suggestionBtn', 'تقديم اقتراح', 'Submit Suggestion'),
('join_team_visible', 'true', 'true')
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.services (key, title_ar, title_en, description_ar, description_en, icon, display_order) VALUES
('montage', 'مونتاج احترافي', 'Professional Editing', 'مونتاج فيديو احترافي بأعلى معايير الجودة', 'Professional video editing', 'Video', 1),
('motion', 'موشن جرافيك', 'Motion Graphics', 'رسوم متحركة إبداعية تروي قصتك', 'Creative animations', 'Activity', 2),
('design', 'تصميم إبداعي', 'Creative Design', 'تصاميم مبتكرة تعكس هويتك البصرية', 'Innovative designs', 'Palette', 3),
('social', 'إدارة سوشيال ميديا', 'Social Media', 'إدارة شاملة لحساباتك مع محتوى مخصص', 'Social media management', 'Share2', 4),
('branding', 'بناء الهوية البصرية', 'Brand Identity', 'هوية بصرية متكاملة تعكس قيم علامتك التجارية', 'Brand identity systems', 'Award', 5),
('campaign', 'حملات إعلانية', 'Ad Campaigns', 'تخطيط وتنفيذ حملات رقمية فعّالة', 'Effective ad campaigns', 'Target', 6)
ON CONFLICT (key) DO NOTHING;

-- End of final script.
