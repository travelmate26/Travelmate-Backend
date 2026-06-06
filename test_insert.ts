import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL || '', process.env.SUPABASE_SERVICE_ROLE_KEY || '');

async function testInsert() {
  const { data: users } = await supabase.from('profiles').select('id').limit(1);
  if (!users || users.length === 0) return console.log('No user');

  const { data, error } = await supabase
      .from('transactions')
      .insert([{
        user_id: users[0].id,
        type: 'wallet_funding',
        amount: 100,
        status: 'pending',
        description: 'Test Deposit',
      }])
      .select()
      .single();

  if (error) {
    console.error('Insert error:', error);
  } else {
    console.log('Inserted:', data);
  }
}

testInsert();
