const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://zwunjfdazixygebaavko.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3dW5qZmRheml4eWdlYmFhdmtvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg3MzMwMzMsImV4cCI6MjA4NDMwOTAzM30._duG0nQV-h5mfrBSQhLtktBI2Rl5Mj2HcbT0-MdCNMc';
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data, error } = await supabase
    .from('store_profiles')
    .select('*')
    .limit(1)
    
  console.log("store_profiles:", data || error);

  const { data: d2, error: e2 } = await supabase
    .from('stores')
    .select('*')
    .limit(1)
    
  console.log("stores:", d2 || e2);
  
  const { data: d3, error: e3 } = await supabase
    .from('vendors')
    .select('*')
    .limit(1)
    
  console.log("vendors:", d3 || e3);
}

test();
