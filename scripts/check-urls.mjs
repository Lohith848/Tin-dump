import { existsSync, readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

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

const files = [
  '7up.png',
  'Bfizz.png',
  'appy-fizz.png',
  'bloodybubble.png',
  'cocacola-zerosugar.png',
  'cocacola.png',
  'cocalcola-zerosugar.png',
  'dietcoke.png',
  'fanta.png',
  'hell.png',
  'mirinda.png',
  'mountaindew.png',
  'pepsi-zero.png',
  'pepsi.png',
  'redbull-green.png',
  'redbull-pink.png',
  'redbull-red.png',
  'redbull-sugarfree.png',
  'redbull.png',
  'sprite-zero.png',
  'thumbsup.png',
  'white-monster.png'
];

async function check() {
  for (const file of files) {
    // Try both raw filename and seed- prefixed filename
    for (const name of [file, `seed-${file}`, `seed-${file.replace(/\s+/g, '-')}`]) {
      const url = `${supabaseUrl}/storage/v1/object/public/tin-photos/${name}`;
      try {
        const res = await fetch(url, { method: 'HEAD' });
        if (res.status === 200) {
          console.log(`🟢 FOUND: ${name} -> ${url}`);
        }
      } catch (err) {
        // ignore
      }
    }
  }
  console.log('Done checking.');
}

check().catch(console.error);
