const { createClient } = require('@supabase/supabase-js');
require('fs').readFileSync('.env.local', 'utf-8').split('\n').forEach(l => { const m = l.match(/^([^=]+)=(.*)$/); if (m) process.env[m[1]] = m[2].trim(); });
const sup = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
(async () => {
  const targets = ['news-fb0218e6-1786050500958.jpg', 'news-48649eaf-1786050497507.jpg', 'news-1da5a516-1786050498884.jpg', 'news-4339a995-1786050496451.jpg'];
  for (const t of targets) {
    const { data, error } = await sup.storage.from('news-images').list('', { search: t });
    console.log(t, '->', error ? 'ERR ' + error.message : (data && data[0] ? `size=${data[0].metadata && data[0].metadata.size} bytes` : 'NOT FOUND in list'));
  }
  // compare with a working one
  const { data: w } = await sup.storage.from('news-images').list('', { search: 'news-71f15906-1786050501934.jpg' });
  console.log('working sample ->', w && w[0] ? `size=${w[0].metadata && w[0].metadata.size}` : 'not found');
})();
