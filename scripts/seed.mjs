/**
 * Seed script — uploads 22 tin images to Supabase Storage
 * and inserts corresponding tin_catalog rows.
 *
 * Usage: node scripts/seed.mjs
 *
 * Requires: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
 * in .env.local (or set as env vars).
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load env manually
const envPath = resolve(__dirname, '..', '.env.local');
if (existsSync(envPath)) {
  const envContent = readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach((line) => {
    const [key, ...rest] = line.split('=');
    if (key && rest.length) {
      process.env[key.trim()] = rest.join('=').trim();
    }
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey || supabaseUrl === 'your-supabase-url-here') {
  console.error('❌ Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local first.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Map of filename → display name
const TINS = {
  '7up.png': '7 Up',
  'Bfizz.png': 'B Fizz',
  'appy-fizz.png': 'Appy Fizz',
  'bloodybubble.png': 'Bloody Bubble',
  'cocacola-zerosugar.png': 'Coca-Cola Zero Sugar',
  'cocacola.png': 'Coca-Cola',
  'cocalcola-zerosugar.png': 'Coca-Cola Zero (Alt)',
  'dietcoke.png': 'Diet Coke',
  'fanta.png': 'Fanta',
  'hell.png': 'Hell Energy',
  'mirinda.png': 'Mirinda',
  'mountaindew.png': 'Mountain Dew',
  'pepsi-zero.png': 'Pepsi Zero',
  'pepsi.png': 'Pepsi',
  'redbull-green.png': 'Red Bull Green',
  'redbull-pink.png': 'Red Bull Pink',
  'redbull-red.png': 'Red Bull Red',
  'redbull-sugarfree.png': 'Red Bull Sugar Free',
  'redbull.png': 'Red Bull',
  'sprite-zero.png': 'Sprite Zero',
  'thumbsup.png': 'Thums Up',
  'white-monster.png': 'Monster Ultra',
};

const ASSETS_DIR = resolve(__dirname, '..', '..', 'assests');

async function seed() {
  console.log('🚀 Starting seed...');
  console.log(`📁 Assets directory: ${ASSETS_DIR}`);

  // First, sign in anonymously to satisfy RLS
  const { data: authData, error: authError } = await supabase.auth.signInAnonymously();
  if (authError) {
    console.error('❌ Auth error:', authError.message);
    process.exit(1);
  }
  console.log('✅ Authenticated anonymously');

  let successCount = 0;
  let skipCount = 0;

  for (const [filename, displayName] of Object.entries(TINS)) {
    const filePath = resolve(ASSETS_DIR, filename);

    if (!existsSync(filePath)) {
      console.log(`⚠️  Skipping ${filename} — file not found`);
      skipCount++;
      continue;
    }

    // Check if already in catalog
    const { data: existing } = await supabase
      .from('tin_catalog')
      .select('id')
      .eq('name', displayName)
      .maybeSingle();

    if (existing) {
      console.log(`⏭️  ${displayName} already in catalog`);
      skipCount++;
      continue;
    }

    // Read file
    const fileBuffer = readFileSync(filePath);
    const storageName = `seed-${filename.replace(/\s+/g, '-')}`;

    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from('tin-photos')
      .upload(storageName, fileBuffer, {
        contentType: 'image/png',
        cacheControl: '31536000',
        upsert: true,
      });

    if (uploadError) {
      console.error(`❌ Upload failed for ${filename}:`, uploadError.message);
      continue;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('tin-photos')
      .getPublicUrl(storageName);

    // Insert catalog row
    const { error: insertError } = await supabase
      .from('tin_catalog')
      .insert({
        name: displayName,
        photo_url: urlData.publicUrl,
        created_by: authData.user.id,
      });

    if (insertError) {
      console.error(`❌ Insert failed for ${displayName}:`, insertError.message);
      continue;
    }

    console.log(`✅ ${displayName}`);
    successCount++;
  }

  console.log(`\n🎉 Seed complete: ${successCount} added, ${skipCount} skipped`);
}

seed().catch(console.error);
