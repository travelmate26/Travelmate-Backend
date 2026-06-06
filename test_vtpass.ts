import { generateRequestId, buyAirtime } from './src/services/vtpass.ts';
import dotenv from 'dotenv';
dotenv.config();

async function test() {
  const reqId = generateRequestId();
  console.log('Generated request_id:', reqId);
  console.log('Length:', reqId.length);
  console.log('First 12 chars:', reqId.substring(0, 12));
  console.log('First 12 numeric?', /^\d{12}/.test(reqId));

  // Test with sandbox test number
  console.log('\nTesting airtime buy (sandbox)...');
  try {
    const result = await buyAirtime({
      serviceId: 'mtn',
      phone: '08011111111', // use any number for sandbox
      amount: 100,
      requestId: reqId,
    });
    console.log('Result:', JSON.stringify(result, null, 2));
  } catch (err: any) {
    console.error('Error:', err.response?.data || err.message);
  }
}

test();
