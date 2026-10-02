-- Run with the Supabase SQL connector. Every fixture/change is rolled back.
begin;
insert into auth.users(id,email,email_confirmed_at) values
  ('11111111-1111-4111-8111-111111111111','brief-poc-owner@example.invalid',now()),
  ('22222222-2222-4222-8222-222222222222','brief-poc-admin@example.invalid',now()),
  ('33333333-3333-4333-8333-333333333333','brief-poc-editor@example.invalid',now()),
  ('44444444-4444-4444-8444-444444444444','brief-poc-unassigned@example.invalid',now()),
  ('55555555-5555-4555-8555-555555555555','brief-poc-unverified@example.invalid',null);
select set_config('test.tenant',(select id::text from brief_tenants where slug='sunday-crew'),true);
select set_config('test.league',(select id::text from brief_leagues where tenant_id=current_setting('test.tenant')::uuid limit 1),true);
select set_config('test.other_league',(select id::text from brief_leagues where tenant_id<>current_setting('test.tenant')::uuid limit 1),true);
insert into brief_private.management_setup(singleton,code_hash,expires_at,claimed_at)
values(true,encode(extensions.digest('test-only-code','sha256'),'hex'),now()+interval '1 hour',null)
on conflict(singleton) do update set code_hash=excluded.code_hash,expires_at=excluded.expires_at,claimed_at=null;
select set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}',true);
set local role authenticated;
do $$ begin
  begin perform public.brief_manage_claim_owner('wrong-code'); raise exception 'Wrong setup code accepted'; exception when insufficient_privilege then null; end;
end $$;
select public.brief_manage_claim_owner('test-only-code');
do $$ begin
  if not public.brief_manage_is_owner() then raise exception 'Owner bootstrap failed'; end if;
  begin perform public.brief_manage_claim_owner('test-only-code'); raise exception 'Setup code reused'; exception when insufficient_privilege then null; end;
end $$;
select public.brief_manage_grant_access(current_setting('test.tenant')::uuid,'brief-poc-admin@example.invalid','admin');
select public.brief_manage_grant_access(current_setting('test.tenant')::uuid,'brief-poc-editor@example.invalid','editor');
select public.brief_manage_grant_access(current_setting('test.tenant')::uuid,'brief-poc-unverified@example.invalid','admin');
select set_config('request.jwt.claims','{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated","user_metadata":{"role":"owner"}}',true);
do $$ begin
  if public.brief_manage_is_owner() then raise exception 'User metadata escalated privileges'; end if;
  if (select count(*) from public.brief_tenants)<>1 then raise exception 'Admin can see another tenant'; end if;
  if exists(select 1 from public.brief_leagues where id=current_setting('test.other_league')::uuid) then raise exception 'Other league visible'; end if;
  if exists(select 1 from public.brief_tenant_access) then raise exception 'Admin can read membership list'; end if;
  if has_table_privilege('authenticated','public.brief_correspondents','UPDATE') or has_table_privilege('authenticated','public.brief_correspondents','TRUNCATE') then raise exception 'Canonical correspondent writes available'; end if;
  if has_table_privilege('authenticated','public.brief_live_score_state','UPDATE') or has_table_privilege('authenticated','public.brief_media_releases','UPDATE') then raise exception 'Global engine writes available'; end if;
  begin perform public.brief_manage_grant_access(current_setting('test.tenant')::uuid,'intruder@example.invalid','admin'); raise exception 'Admin granted membership'; exception when insufficient_privilege then null; end;
  begin insert into public.brief_platform_owners(user_id) values('22222222-2222-4222-8222-222222222222'); raise exception 'Admin became owner'; exception when insufficient_privilege then null; end;
  begin update public.brief_tenants set settings='{}' where id=current_setting('test.tenant')::uuid; raise exception 'Tenant security flags editable'; exception when insufficient_privilege then null; end;
  begin perform public.brief_manage_publication_name((select tenant_id from public.brief_leagues where id=current_setting('test.other_league')::uuid),'Unauthorized'); raise exception 'Other settings writable'; exception when insufficient_privilege then null; end;
end $$;
select public.brief_manage_publication_name(current_setting('test.tenant')::uuid,'POC test publication');
insert into public.brief_publication_articles(scope,league_id,slug,title,body,status)
values('league',current_setting('test.league')::uuid,'brief-poc-draft','POC draft','["Test body"]','draft');
insert into public.brief_league_memory(league_id,subject_type,memory_key,content)
values(current_setting('test.league')::uuid,'league','brief-poc-context','POC local context');
do $$ begin
  begin insert into public.brief_publication_articles(scope,league_id,slug,title) values('league',current_setting('test.other_league')::uuid,'brief-poc-other','Unauthorized'); raise exception 'Cross-league insert succeeded'; exception when insufficient_privilege then null; end;
  begin update public.brief_publication_articles set league_id=current_setting('test.other_league')::uuid where slug='brief-poc-draft'; raise exception 'Article moved to another league'; exception when insufficient_privilege then null; end;
  begin update public.brief_publication_articles set scope='global',league_id=null where slug='brief-poc-draft'; raise exception 'Article promoted to global'; exception when insufficient_privilege then null; end;
  begin update public.brief_league_memory set league_id=current_setting('test.other_league')::uuid where memory_key='brief-poc-context'; raise exception 'Memory moved to another league'; exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claims','{"sub":"33333333-3333-4333-8333-333333333333","role":"authenticated"}',true);
do $$ begin
  if (select count(*) from public.brief_publication_articles where slug='brief-poc-draft')<>1 then raise exception 'Editor cannot read local draft'; end if;
  update public.brief_publication_articles set title='Editor revision' where slug='brief-poc-draft';
  if not exists(select 1 from public.brief_publication_articles where title='Editor revision') then raise exception 'Editor cannot save'; end if;
  begin perform public.brief_manage_publication_name(current_setting('test.tenant')::uuid,'Unauthorized'); raise exception 'Editor changed settings'; exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claims','{"sub":"55555555-5555-4555-8555-555555555555","role":"authenticated"}',true);
do $$ begin
  if exists(select 1 from public.brief_tenants) then raise exception 'Unverified user has access'; end if;
end $$;
select set_config('request.jwt.claims','{"sub":"44444444-4444-4444-8444-444444444444","role":"authenticated"}',true);
do $$ begin
  if exists(select 1 from public.brief_tenants) then raise exception 'Unassigned user has access'; end if;
end $$;
select set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}',true);
select public.brief_manage_revoke_access(current_setting('test.tenant')::uuid,(select id from brief_tenant_access where email='brief-poc-admin@example.invalid'));
select set_config('request.jwt.claims','{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}',true);
do $$ begin
  if exists(select 1 from public.brief_tenants) then raise exception 'Revocation not immediate'; end if;
end $$;
set local role anon;
do $$ begin
  if public.get_public_brief_articles('sunday-crew','brief-poc-draft')<>'[]'::jsonb then raise exception 'Public RPC leaks drafts'; end if;
  begin perform public.brief_manage_claim_owner('test-only-code'); raise exception 'Anon can bootstrap'; exception when insufficient_privilege then null; end;
  begin perform 1 from brief_private.management_setup; raise exception 'Setup hash exposed'; exception when insufficient_privilege then null; end;
end $$;
reset role;
select 'PASS: owner bootstrap, admin/editor roles, cross-tenant isolation, scope reassignment, verified email, immediate revocation, draft privacy, and anonymous denial' as result;
rollback;
