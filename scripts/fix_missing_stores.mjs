import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Read keys manually to avoid dotenv
const envContent = fs.readFileSync('.env.local', 'utf-8');
const lines = envContent.split('\n');
const env = {};
for (const line of lines) {
    if (line.trim() && !line.startsWith('#')) {
        const [key, ...valueParts] = line.split('=');
        env[key.trim()] = valueParts.join('=').trim();
    }
}

const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL'];
// Wait, we need the SERVICE ROLE key to bypass RLS.
// But .env.local might only have the anon key. Let's check if the anon key works.
// We can use the anon key if we log in, but we can't log in easily.
// Let's just create an SQL migration for the user to run, or we can use anon key if RLS allows it.
// Actually, earlier the script failed because of dotenv, not because of missing service role key.
const supabaseKey = env['SUPABASE_SERVICE_ROLE_KEY'] || env['NEXT_PUBLIC_SUPABASE_ANON_KEY'];

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    console.log("Checking vendor applications...");
    const { data: apps, error: appError } = await supabase
        .from('vendor_applications')
        .select('*')
        .eq('applicant_email', 'christophekasonko52@gmail.com');
        
    if (appError) console.error("Error fetching apps", appError);

    console.log("Found applications for user:", apps?.length);

    for (const app of apps || []) {
        console.log(`Checking store for user ${app.user_id}...`);
        const { data: store, error: storeError } = await supabase
            .from('stores')
            .select('*')
            .eq('owner_id', app.user_id)
            .single();

        if (storeError) {
             console.log(`Store NOT found for ${app.user_id} (${app.store_name})`);
             const { error: insertError } = await supabase.from('stores').insert([{
                owner_id: app.user_id,
                name: app.store_name,
                slug: app.store_name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                description: app.description || 'Welcome to my store!',
                city: app.city || 'Unknown',
             }]);
             if (insertError) {
                 console.log("Failed to insert store (might be RLS):", insertError.message);
             } else {
                 console.log(`Successfully created missing store for ${app.store_name}!`);
             }
        } else {
            console.log(`Store ${store.name} already exists.`);
        }
    }
}

main();
