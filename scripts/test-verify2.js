#!/usr/bin/env node

// Quick verification test
const { createClient } = require("@supabase/supabase-js");
const SUPABASE_URL = "https://ynqvcexiolbqztnwkrbd.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_BGmM7bOrSx8gggVgh-Lvgw_O8gtzDhc";
const SERVICE_ROLE_KEY = "PLACEHOLDER_SECRET_KEY_REPLACE_IN_ENV";
const BASE_URL = "https://yalla-shoot-new.vercel.app";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const serviceSupabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
console.log("Supabase client created");

async function main() {
  const { data, error } = await supabase.from("matches").select("count(*)");
  if (error) { console.log("Error:", error); return; }
  console.log("Matches query result:", JSON.stringify(data));
}
main().catch(e => console.error(e));
