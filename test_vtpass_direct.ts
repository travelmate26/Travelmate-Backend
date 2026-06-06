import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL || '', process.env.SUPABASE_SERVICE_ROLE_KEY || '');

// Directly test VTpass sandbox with the correct format
async function testVtpassDirect() {
  // Get correct Lagos time
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' }));
  const year  = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day   = String(now.getDate()).padStart(2, '0');
  const hour  = String(now.getHours()).padStart(2, '0');
  const min   = String(now.getMinutes()).padStart(2, '0');
  const datePrefix = `${year}${month}${day}${hour}${min}`; // 12 digits
  const suffix = Math.random().toString(36).substring(2, 10).toUpperCase();
  const requestId = `${datePrefix}${suffix}`;

  console.log('request_id:', requestId);
  console.log('Length:', requestId.length, '| First 12 numeric:', /^\d{12}/.test(requestId));

  const apiKey    = process.env.VTPASS_API_KEY;
  const secretKey = process.env.VTPASS_SECRET_KEY;
  const baseUrl   = 'https://sandbox.vtpass.com/api';

  console.log('\nAPI Key:', apiKey ? apiKey.substring(0, 8) + '...' : 'MISSING');
  console.log('Secret Key:', secretKey ? secretKey.substring(0, 8) + '...' : 'MISSING');
  console.log('Base URL:', baseUrl);

  try {
    const response = await axios.post(`${baseUrl}/pay`, {
      request_id: requestId,
      serviceID:  'mtn',
      amount:     100,
      phone:      '08011111111',
    }, {
      headers: {
        'api-key':    apiKey,
        'secret-key': secretKey,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });
    console.log('\nVTpass Response:', JSON.stringify(response.data, null, 2));
  } catch (err: any) {
    if (err.response) {
      console.error('\nVTpass Error Status:', err.response.status);
      console.error('VTpass Error Body:', JSON.stringify(err.response.data, null, 2));
    } else {
      console.error('\nNetwork Error:', err.message);
    }
  }
}

testVtpassDirect();
