const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://zwunjfdazixygebaavko.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3dW5qZmRheml4eWdlYmFhdmtvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg3MzMwMzMsImV4cCI6MjA4NDMwOTAzM30._duG0nQV-h5mfrBSQhLtktBI2Rl5Mj2HcbT0-MdCNMc';
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .limit(1)
    
  console.log("Products schema:", data ? Object.keys(data[0]) : error);
  
  const { data: d2, error: e2 } = await supabase
    .from('profiles')
    .select('*')
    .limit(1)
    
  console.log("Profiles schema:", d2 ? Object.keys(d2[0]) : e2);
}

test();
