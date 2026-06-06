import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL || '', process.env.SUPABASE_SERVICE_ROLE_KEY || '');

async function creditUsers() {
  console.log('Fetching all users...');
  const { data: users, error: usersErr } = await supabase.from('profiles').select('id');
  if (usersErr) {
    console.error('Error fetching users:', usersErr);
    return;
  }
  
  if (!users) {
      console.log('No users found.');
      return;
  }
  console.log(`Found ${users.length} users. Crediting 5000 to each...`);
  
  for (const user of users) {
    // get wallet
    const { data: wallet } = await supabase.from('wallets').select('balance').eq('user_id', user.id).single();
    
    if (wallet) {
      const newBalance = wallet.balance + 5000;
      await supabase.from('wallets').update({ balance: newBalance }).eq('user_id', user.id);
      console.log(`Updated wallet for user ${user.id}: new balance = ${newBalance}`);
    } else {
      await supabase.from('wallets').insert([{ user_id: user.id, balance: 5000 }]);
      console.log(`Created wallet for user ${user.id} with balance 5000`);
    }
  }
  console.log('Done!');
}

creditUsers();
