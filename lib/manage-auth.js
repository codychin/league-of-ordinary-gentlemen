import {createServerClient} from '@supabase/ssr';
import {cookies} from 'next/headers';

export const authConfig = () => ({
  url: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dnzdbqycuuoonewcowis.supabase.co',
  key: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_oVFeqnL1WtrpB5BWZopBSw_rKScXieO',
});

export async function managementClient() {
  const jar = await cookies();
  const {url, key} = authConfig();
  return createServerClient(url, key, {cookies: {
    getAll: () => jar.getAll(),
    setAll: values => {try {values.forEach(({name, value, options}) => jar.set(name, value, options));} catch {/* Refreshed by proxy for Server Components. */}},
  }});
}

export async function managementSession() {
  const db = await managementClient();
  const {data: {user}, error} = await db.auth.getUser();
  if (error || !user?.email_confirmed_at) return {db, user: null};
  const {data: owner, error: ownerError} = await db.rpc('brief_manage_is_owner');
  if (ownerError) throw new Error('Management access is temporarily unavailable.');
  return {db, user, owner: owner === true};
}

export async function managementTenant(db, slug) {
  const {data: tenant, error} = await db.from('brief_tenants').select('id,slug,name,publication_name').eq('slug', slug).maybeSingle();
  if (error || !tenant) return null;
  const {data: leagues, error: leagueError} = await db.from('brief_leagues').select('id,name,season,provider,last_synced_at').eq('tenant_id', tenant.id).eq('status', 'active').order('updated_at', {ascending: false}).limit(1);
  if (leagueError || !leagues?.[0]) return null;
  const {data: role} = await db.rpc('brief_manage_role', {p_tenant_id: tenant.id});
  return role ? {...tenant, league: leagues[0], role} : null;
}
