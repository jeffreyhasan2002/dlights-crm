import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

console.log('Testing connection to Supabase:', supabaseUrl);
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  try {
    const { data: tables, error: tableError } = await supabase.from('profiles').select('*').limit(1);
    console.log('Profiles query result:', { data: tables, error: tableError });

    const { data: clients, error: clientError } = await supabase.from('clients').select('*').limit(5);
    console.log('Clients query result:', { count: clients?.length, error: clientError });

    const { data: leads, error: leadError } = await supabase.from('leads').select('*').limit(5);
    console.log('Leads query result:', { count: leads?.length, error: leadError });
  } catch (err) {
    console.error('Error connecting to Supabase:', err);
  }
}

test();
