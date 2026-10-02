import {NextResponse} from 'next/server';
import {managementSession, managementTenant} from '../../../lib/manage-auth';
import {sameOrigin, accessInput, articleInput, memoryInput, text} from '../../../lib/manage-validation.mjs';

export const dynamic = 'force-dynamic';
const reply = (data, status = 200) => NextResponse.json(data, {status, headers: {'Cache-Control': 'private, no-store'}});
const uuid = value => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

export async function POST(request) {
  if (!sameOrigin(request)) return reply({error: 'Request origin not allowed.'}, 403);
  if (Number(request.headers.get('content-length') || 0) > 100000) return reply({error: 'Request is too large.'}, 413);
  let input;
  try {const raw = await request.text(); if (raw.length > 100000) return reply({error: 'Request is too large.'}, 413); input = JSON.parse(raw);} catch {return reply({error: 'Invalid request.'}, 400);}
  try {
    const {db, user, owner} = await managementSession();
    if (!user) return reply({error: 'Please sign in.'}, 401);
    if (input.action === 'claimOwner') {
      const {error} = await db.rpc('brief_manage_claim_owner', {p_code: text(input.code, 100, true)});
      return error ? reply({error: 'Setup code is invalid, expired, or already used.'}, 403) : reply({ok: true});
    }
    const slug = text(input.tenant, 100, true);
    if (!/^[a-z0-9-]+$/.test(slug)) return reply({error: 'Invalid bureau.'}, 400);
    const tenant = await managementTenant(db, slug);
    if (!tenant) return reply({error: 'You do not have access to this bureau.'}, 403);
    let result;
    if (input.action === 'grantAccess') {
      if (!owner) return reply({error: 'Only the owner can grant access.'}, 403);
      const {email, role} = accessInput(input);
      result = await db.rpc('brief_manage_grant_access', {p_tenant_id: tenant.id, p_email: email, p_role: role});
    } else if (input.action === 'revokeAccess') {
      if (!owner || !uuid(input.id)) return reply({error: 'Only the owner can revoke access.'}, 403);
      result = await db.rpc('brief_manage_revoke_access', {p_tenant_id: tenant.id, p_id: input.id});
    } else if (input.action === 'saveSettings') {
      if (!['owner', 'admin'].includes(tenant.role)) return reply({error: 'Admin access is required.'}, 403);
      result = await db.rpc('brief_manage_publication_name', {p_tenant_id: tenant.id, p_name: text(input.publication_name, 120, true)});
    } else if (input.action === 'saveArticle') {
      const row = articleInput(input, tenant.league.id);
      if (input.id && !uuid(input.id)) return reply({error: 'Invalid article.'}, 400);
      result = input.id ? await db.from('brief_publication_articles').update(row).eq('id', input.id).eq('scope', 'league').eq('league_id', tenant.league.id).select('id').maybeSingle() : await db.from('brief_publication_articles').insert(row).select('id').single();
      if (!result.error && !result.data) return reply({error: 'Article not found in this bureau.'}, 404);
    } else if (input.action === 'saveMemory') {
      const row = memoryInput(input, tenant.league.id);
      if (input.id && !/^\d+$/.test(String(input.id))) return reply({error: 'Invalid memory.'}, 400);
      result = input.id ? await db.from('brief_league_memory').update(row).eq('id', input.id).eq('league_id', tenant.league.id).select('id').maybeSingle() : await db.from('brief_league_memory').insert(row).select('id').single();
      if (!result.error && !result.data) return reply({error: 'Memory not found in this bureau.'}, 404);
    } else return reply({error: 'Unknown action.'}, 400);
    if (result.error) return reply({error: result.error.code === '23505' ? 'That article slug is already in use.' : 'The change could not be saved. Check your access and try again.'}, 400);
    return reply({ok: true});
  } catch (error) {
    return reply({error: error.message?.startsWith('Please check') || error.message?.startsWith('Enter a valid') || error.message?.startsWith('Check the') ? error.message : 'The management service could not complete this request.'}, 400);
  }
}
