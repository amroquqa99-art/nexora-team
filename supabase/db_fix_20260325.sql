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
        CREATE POLICY "Allow public read" ON services FOR SELECT USING (true);
    END IF;
END $$;
