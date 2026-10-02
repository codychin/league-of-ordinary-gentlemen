'use client';
import {createBrowserClient} from '@supabase/ssr';

let client;
export function managementBrowser() {
  if (!client) client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dnzdbqycuuoonewcowis.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_oVFeqnL1WtrpB5BWZopBSw_rKScXieO',
    {auth: {flowType: 'pkce', detectSessionInUrl: false}},
  );
  return client;
}
