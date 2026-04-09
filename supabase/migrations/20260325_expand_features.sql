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
