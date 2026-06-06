import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkAppSettings() {
  const { data, error } = await supabase.from('app_settings').select('*').limit(1);
  if (error) {
    console.error('Error fetching app_settings:', error.message);
  } else {
    console.log('app_settings exists! Data:', data);
  }
}

checkAppSettings();
