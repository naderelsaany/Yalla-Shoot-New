/**
 * REPAIR phase 3: fix the 6 remaining broken images with known sources
 */
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('fs').readFileSync('.env.local', 'utf-8').split('\n').forEach(l => { const m = l.match(/^([^=]+)=(.*)$/); if (m) process.env[m[1]] = m[2].trim(); });
const sup = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const UA = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36' };

// filename -> image source URL
const FIXES = {
  'news-e7f9b73d-1786035716992.jpg': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/57/Yan_Diomande_Cote_D%27Ivoire_v_Ecuador_14_June_2026-17_%28cropped%29.jpg/330px-Yan_Diomande_Cote_D%27Ivoire_v_Ecuador_14_June_2026-17_%28cropped%29.jpg',
  'news-930f8701-1786035717923.jpg': 'https://upload.wikimedia.org/wikipedia/en/thumb/e/ef/Zamalek_SC_logo.svg/330px-Zamalek_SC_logo.svg.png',
  'news-63a144da-1786035720577.jpg': null, // Al-Ahli Saudi - resolve below
  'news-f0308bfe-1786035723788.jpg': 'https://upload.wikimedia.org/wikipedia/en/b/b9/Al-Ramtha_SC_Logo.png',
  'news-10387ef7-1786035760437.png': 'https://upload.wikimedia.org/wikipedia/en/thumb/e/ef/Zamalek_SC_logo.svg/330px-Zamalek_SC_logo.svg.png',
  'news-aea33faf-1786035758848.png': null, // Salah - retry below
};

async function getAlAhliSaudi() {
  // REST summary sometimes has thumbnail
  const r = await fetch('https://en.wikipedia.org/api/rest_v1/page/summary/Al-Ahli_Saudi_FC', { headers: UA, signal: AbortSignal.timeout(15000) });
  const j = await r.json();
  if (j.thumbnail && j.thumbnail.source) return j.thumbnail.source;
  // fallback: known crest URL pattern
  return 'https://upload.wikimedia.org/wikipedia/en/thumb/a/a6/Al-Ahli_Saudi_FC_logo.svg/330px-Al-Ahli_Saudi_FC_logo.svg.png';
}

async function getSalah() {
  const r = await fetch('https://en.wikipedia.org/api/rest_v1/page/summary/Mohamed_Salah', { headers: UA, signal: AbortSignal.timeout(15000) });
  const j = await r.json();
  return (j.thumbnail || {}).source || null;
}

async function uploadToFilename(imgUrl, filename) {
  try {
    const img = await fetch(imgUrl, { headers: UA, signal: AbortSignal.timeout(25000) });
    if (!img.ok) return { ok: false, why: 'img http ' + img.status };
    const buf = Buffer.from(await img.arrayBuffer());
    if (buf.length < 1000) return { ok: false, why: 'too small ' + buf.length };
    const { error } = await sup.storage.from('news-images').upload(filename, buf, { contentType: img.headers.get('content-type') || 'image/jpeg', upsert: true });
    if (error) return { ok: false, why: error.message };
    return { ok: true, bytes: buf.length };
  } catch (e) { return { ok: false, why: e.message }; }
}

(async () => {
  FIXES['news-63a144da-1786035720577.jpg'] = await getAlAhliSaudi();
  FIXES['news-aea33faf-1786035758848.png'] = await getSalah();
  for (const [file, url] of Object.entries(FIXES)) {
    if (!url) { console.log('❌ no url for', file); continue; }
    const up = await uploadToFilename(url, file);
    console.log(`${up.ok ? '✅' : '❌'} ${file} ${up.ok ? '(' + up.bytes + 'B)' : up.why}`);
  }
})();
