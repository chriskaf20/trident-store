const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://zwunjfdazixygebaavko.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3dW5qZmRheml4eWdlYmFhdmtvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg3MzMwMzMsImV4cCI6MjA4NDMwOTAzM30._duG0nQV-h5mfrBSQhLtktBI2Rl5Mj2HcbT0-MdCNMc';
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data, error, count } = await supabase
    .from('products')
    .select('*, stores(name, slug)', { count: 'exact' })
    
  console.log("Joined count:", count);
  console.log("Error:", error);
  
  const { data: d2, error: e2, count: c2 } = await supabase
    .from('products')
    .select('*, store(*)', { count: 'exact' })
    
  console.log("With store:", !!d2, e2);
}

test();
