const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://zwunjfdazixygebaavko.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3dW5qZmRheml4eWdlYmFhdmtvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg3MzMwMzMsImV4cCI6MjA4NDMwOTAzM30._duG0nQV-h5mfrBSQhLtktBI2Rl5Mj2HcbT0-MdCNMc';
const supabase = createClient(supabaseUrl, supabaseKey);

async function patch() {
  const { data, error } = await supabase
    .from('products')
    .update({ image: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=800&auto=format&fit=crop' })
    .match({ name: 'Jacket' })
    .is('image', null); // Or empty string, let's just use .eq if needed
    
  const { data: data2, error: error2 } = await supabase
    .from('products')
    .update({ image: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=800&auto=format&fit=crop' })
    .eq('image', '');

  console.log("Patched empty images. Errors:", error || error2);
}

patch();
