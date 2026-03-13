import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Helper to load env from .env.local manually
function loadEnv() {
    try {
        const envContent = fs.readFileSync('.env.local', 'utf-8');
        const env = {};
        envContent.split('\n').forEach(line => {
            const parts = line.split('=');
            if (parts.length >= 2) {
                env[parts[0].trim()] = parts.slice(1).join('=').trim();
            }
        });
        return env;
    } catch (e) {
        console.error('Error loading .env.local:', e);
        return {};
    }
}

const env = loadEnv();
const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseKey = env['SUPABASE_SERVICE_ROLE_KEY'] || env['NEXT_PUBLIC_SUPABASE_ANON_KEY'];

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase URL or Key in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function deduplicate() {
    console.log('--- Store Deduplication Script ---');
    
    // 1. Get all stores grouped by owner_id
    const { data: stores, error } = await supabase
        .from('stores')
        .select('id, owner_id, name, created_at')
        .order('created_at', { ascending: true });

    if (error) {
        console.error('Error fetching stores:', error);
        return;
    }

    const ownersMap = new Map();
    stores.forEach(store => {
        if (!ownersMap.has(store.owner_id)) {
            ownersMap.set(store.owner_id, []);
        }
        ownersMap.get(store.owner_id).push(store);
    });

    console.log(`Found ${stores.length} total stores owned by ${ownersMap.size} unique users.`);

    let deletedCount = 0;

    for (const [ownerId, ownerStores] of ownersMap.entries()) {
        if (ownerStores.length > 1) {
            console.log(`\nUser ${ownerId} has ${ownerStores.length} stores.`);
            
            // Keep the first one (oldest)
            const [keep, ...toDelete] = ownerStores;
            console.log(`Keeping: ${keep.name} (${keep.id}) - Created at: ${keep.created_at}`);
            
            for (const store of toDelete) {
                console.log(`Deleting redundant: ${store.name} (${store.id}) - Created at: ${store.created_at}`);
                
                const { error: deleteError } = await supabase
                    .from('stores')
                    .delete()
                    .eq('id', store.id);

                if (deleteError) {
                    console.error(`Failed to delete store ${store.id}:`, deleteError.message);
                } else {
                    deletedCount++;
                }
            }
        }
    }

    console.log(`\n--- Deduplication Complete ---`);
    console.log(`Total redundant stores deleted: ${deletedCount}`);
}

deduplicate().catch(console.error);
