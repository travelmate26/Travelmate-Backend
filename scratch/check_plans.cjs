const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://wnpnbwtmijxfwcblysqp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InducG5id3RtaWp4ZndjYmx5c3FwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTk0Mjc3OSwiZXhwIjoyMDk1NTE4Nzc5fQ.-afQqN7uoUlJMFNFlwnXmwPP9ecmpVUJA5Z6svJGEUQ';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPlans() {
  const { data, error } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', 'VTPASS_SAVED_PLANS')
    .single();

  if (error) {
    console.error('Error fetching:', error);
    return;
  }
  
  if (data && data.value) {
    let plans = data.value;
    if (typeof plans === 'string') {
        plans = JSON.parse(plans);
    }
    console.log('Total saved plans:', plans.length);
    console.log('Airtime plans:', plans.filter(p => p.service === 'airtime'));
    console.log('Electricity plans:', plans.filter(p => p.service === 'electricity'));
  } else {
    console.log('No plans found in app_settings');
  }
}

checkPlans();
