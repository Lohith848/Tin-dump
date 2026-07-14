import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import https from 'https';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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

const url = `${supabaseUrl}/storage/v1/object/public/tin-photos/7up.png`;

console.log('Fetching:', url);
https.get(url, (res) => {
  console.log('Status code:', res.statusCode);
  res.on('data', d => process.stdout.write(d.toString().slice(0, 100) + '...\n'));
}).on('error', (e) => {
  console.error(e);
});
