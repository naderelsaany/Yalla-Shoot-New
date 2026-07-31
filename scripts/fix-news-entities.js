// Fix existing news rows: decode HTML entities in titles + backfill empty summaries
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

fs.readFileSync('.env.local', 'utf-8').split('\n').forEach(l => {
  const i = l.indexOf('=');
  if (i > 0) { const k = l.slice(0, i).trim(); const v = l.slice(i + 1).trim(); if (k) process.env[k] = v; }
});
const sup = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

function decodeEntities(s) {
  return s
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#\d+;/g, ' ');
}
function stripHtml(s) {
  return decodeEntities(s.replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim();
}

(async () => {
  const { data: all, error } = await sup.from('news').select('id, title, summary, content').limit(2000);
  if (error) { console.error('ERR', error.message); return; }
  console.log('Total news:', all.length);

  let fixedTitles = 0, fixedSummaries = 0, errors = 0;
  for (const n of all) {
    const updates = {};
    const decoded = decodeEntities(n.title || '');
    if (decoded !== n.title) updates.title = decoded;

    let summary = (n.summary || '').trim();
    if (!summary) {
      summary = stripHtml(n.content || '').substring(0, 160);
      if (summary) updates.summary = summary;
    }

    if (Object.keys(updates).length) {
      const { error: ue } = await sup.from('news').update(updates).eq('id', n.id);
      if (ue) { errors++; console.log('  ❌', n.id, ue.message); }
      else {
        if (updates.title) fixedTitles++;
        if (updates.summary) fixedSummaries++;
      }
    }
  }
  console.log(`✅ Titles fixed: ${fixedTitles} | Summaries backfilled: ${fixedSummaries} | Errors: ${errors}`);
})().catch(e => console.error('FATAL', e.message));
