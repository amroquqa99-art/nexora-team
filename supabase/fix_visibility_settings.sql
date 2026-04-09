-- Ensure both settings exist and are independent in the site_content table
-- You can run this in the Supabase SQL Editor

INSERT INTO site_content (key, value_en, value_ar)
VALUES 
  ('team_section_visible', 'true', 'true'),
  ('join_team_visible', 'true', 'true')
ON CONFLICT (key) DO UPDATE 
SET value_en = EXCLUDED.value_en, value_ar = EXCLUDED.value_ar
WHERE site_content.value_en IS NULL; -- Only update if missing

-- Verification query
SELECT * FROM site_content WHERE key IN ('team_section_visible', 'join_team_visible');
