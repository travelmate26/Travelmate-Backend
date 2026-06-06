import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkTable() {
  console.log('Checking if saved_plans table exists...');
  const { data, error } = await supabase.from('saved_plans').select('id').limit(1);
  if (error) {
    console.error('Error:', error.message);
  } else {
    console.log('Table exists! Data:', data);
  }
}

checkTable();
