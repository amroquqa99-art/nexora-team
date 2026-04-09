import { createClient } from '@supabase/supabase-client';

const supabaseUrl = 'https://vmococfacnahaujlrgkp.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function dump() {
  const { data: projects } = await supabase.from('projects').select('title_ar, thumbnail_url');
  const { data: team } = await supabase.from('team_members').select('name_ar, image_url');
  const { data: services } = await supabase.from('services').select('title_ar, icon_url');
  
  console.log('--- PROJECTS ---');
  projects?.forEach(p => console.log(`${p.title_ar}: ${p.thumbnail_url}`));
  
  console.log('--- TEAM ---');
  team?.forEach(t => console.log(`${t.name_ar}: ${t.image_url}`));

  console.log('--- SERVICES ---');
  services?.forEach(s => console.log(`${s.title_ar}: ${s.icon_url}`));
}

dump();
