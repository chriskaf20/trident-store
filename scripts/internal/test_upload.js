const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const supabaseUrl = 'https://zwunjfdazixygebaavko.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3dW5qZmRheml4eWdlYmFhdmtvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg3MzMwMzMsImV4cCI6MjA4NDMwOTAzM30._duG0nQV-h5mfrBSQhLtktBI2Rl5Mj2HcbT0-MdCNMc';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testUpload() {
  const content = 'test file';
  const { data, error } = await supabase.storage.from('products').upload('test.txt', content, { contentType: 'text/plain' });
  console.log("Upload result:", error || data);
}

testUpload();
