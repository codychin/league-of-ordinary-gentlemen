-- Management is separate from fantasy league membership. Only verified Auth identities
-- explicitly granted access can operate a bureau. Existing service-role jobs are unchanged.
create schema if not exists brief_private;
revoke all on schema brief_private from public, anon;
grant usage on schema brief_private to authenticated;

create table public.brief_platform_owners (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.brief_platform_owners enable row level security;
revoke all on public.brief_platform_owners from anon, authenticated;
grant select on public.brief_platform_owners to authenticated;
create policy owners_read_self on public.brief_platform_owners for select to authenticated using (user_id=(select auth.uid()));

create table public.brief_tenant_access (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.brief_tenants(id) on delete cascade,
  email text not null check (email=lower(btrim(email)) and email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),
  role text not null check (role in ('admin','editor')),
  granted_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  unique(tenant_id,email)
);
alter table public.brief_tenant_access enable row level security;
revoke all on public.brief_tenant_access from anon, authenticated;
grant select on public.brief_tenant_access to authenticated;
create index brief_tenant_access_email_idx on public.brief_tenant_access(email);
create index brief_tenant_access_granted_by_idx on public.brief_tenant_access(granted_by);

create table brief_private.management_setup (
  singleton boolean primary key default true check (singleton),
  code_hash text not null,
  expires_at timestamptz not null,
  claimed_at timestamptz
);
alter table brief_private.management_setup enable row level security;
revoke all on brief_private.management_setup from public, anon, authenticated;

create function brief_private.verified_email() returns text
language sql stable security definer set search_path='' as $$
  select lower(u.email) from auth.users u where u.id=(select auth.uid()) and u.email_confirmed_at is not null;
$$;
create function brief_private.is_owner() returns boolean
language sql stable security definer set search_path='' as $$
  select (select auth.uid()) is not null and brief_private.verified_email() is not null
    and exists(select 1 from public.brief_platform_owners o where o.user_id=(select auth.uid()));
$$;
create function brief_private.tenant_role(p_tenant_id uuid) returns text
language sql stable security definer set search_path='' as $$
  select case when brief_private.is_owner() then 'owner' else
    (select a.role from public.brief_tenant_access a where a.tenant_id=p_tenant_id and a.email=brief_private.verified_email()) end;
$$;
create function public.brief_manage_is_owner() returns boolean
language sql stable security invoker set search_path='' as $$ select brief_private.is_owner(); $$;
create function public.brief_manage_role(p_tenant_id uuid) returns text
language sql stable security invoker set search_path='' as $$ select brief_private.tenant_role(p_tenant_id); $$;

create function brief_private.claim_owner(p_code text) returns void
language plpgsql security definer set search_path='' as $$
declare setup brief_private.management_setup%rowtype;
begin
  if (select auth.uid()) is null or brief_private.verified_email() is null then raise exception 'Verified login required' using errcode='42501'; end if;
  select * into setup from brief_private.management_setup where singleton=true for update;
  if not found or setup.claimed_at is not null or setup.expires_at<now()
    or setup.code_hash<>encode(extensions.digest(p_code,'sha256'),'hex')
    or exists(select 1 from public.brief_platform_owners) then
    raise exception 'Invalid or consumed setup code' using errcode='42501';
  end if;
  insert into public.brief_platform_owners(user_id) values ((select auth.uid()));
  update brief_private.management_setup set claimed_at=now() where singleton=true;
end;
$$;
create function public.brief_manage_claim_owner(p_code text) returns void
language sql security invoker set search_path='' as $$ select brief_private.claim_owner(p_code); $$;

create function brief_private.grant_access(p_tenant_id uuid,p_email text,p_role text) returns void
language plpgsql security definer set search_path='' as $$
begin
  if not brief_private.is_owner() then raise exception 'Owner access required' using errcode='42501'; end if;
  if p_role not in ('admin','editor') or length(p_email)>254 then raise exception 'Invalid access'; end if;
  insert into public.brief_tenant_access(tenant_id,email,role,granted_by)
    values (p_tenant_id,lower(btrim(p_email)),p_role,(select auth.uid()))
    on conflict (tenant_id,email) do update set role=excluded.role,granted_by=excluded.granted_by;
end;
$$;
create function public.brief_manage_grant_access(p_tenant_id uuid,p_email text,p_role text) returns void
language sql security invoker set search_path='' as $$ select brief_private.grant_access(p_tenant_id,p_email,p_role); $$;

create function brief_private.revoke_access(p_tenant_id uuid,p_id uuid) returns void
language plpgsql security definer set search_path='' as $$
begin
  if not brief_private.is_owner() then raise exception 'Owner access required' using errcode='42501'; end if;
  delete from public.brief_tenant_access where id=p_id and tenant_id=p_tenant_id;
end;
$$;
create function public.brief_manage_revoke_access(p_tenant_id uuid,p_id uuid) returns void
language sql security invoker set search_path='' as $$ select brief_private.revoke_access(p_tenant_id,p_id); $$;

create function brief_private.publication_name(p_tenant_id uuid,p_name text) returns void
language plpgsql security definer set search_path='' as $$
begin
  if coalesce(brief_private.tenant_role(p_tenant_id),'') not in ('owner','admin') then raise exception 'Admin access required' using errcode='42501'; end if;
  if length(btrim(p_name)) not between 1 and 120 then raise exception 'Invalid publication name'; end if;
  update public.brief_tenants set publication_name=btrim(p_name),updated_at=now() where id=p_tenant_id;
end;
$$;
create function public.brief_manage_publication_name(p_tenant_id uuid,p_name text) returns void
language sql security invoker set search_path='' as $$ select brief_private.publication_name(p_tenant_id,p_name); $$;

revoke all on function brief_private.verified_email(),brief_private.is_owner(),brief_private.tenant_role(uuid),brief_private.claim_owner(text),brief_private.grant_access(uuid,text,text),brief_private.revoke_access(uuid,uuid),brief_private.publication_name(uuid,text) from public,anon;
grant execute on function brief_private.verified_email(),brief_private.is_owner(),brief_private.tenant_role(uuid),brief_private.claim_owner(text),brief_private.grant_access(uuid,text,text),brief_private.revoke_access(uuid,uuid),brief_private.publication_name(uuid,text) to authenticated;
revoke all on function public.brief_manage_is_owner(),public.brief_manage_role(uuid),public.brief_manage_claim_owner(text),public.brief_manage_grant_access(uuid,text,text),public.brief_manage_revoke_access(uuid,uuid),public.brief_manage_publication_name(uuid,text) from public,anon;
grant execute on function public.brief_manage_is_owner(),public.brief_manage_role(uuid),public.brief_manage_claim_owner(text),public.brief_manage_grant_access(uuid,text,text),public.brief_manage_revoke_access(uuid,uuid),public.brief_manage_publication_name(uuid,text) to authenticated;

create policy access_owner_read on public.brief_tenant_access for select to authenticated using ((select brief_private.is_owner()));
-- Tenants and leagues are readable only through a membership, or by the platform owner.
revoke all on public.brief_tenants,public.brief_leagues from anon,authenticated;
grant select on public.brief_tenants,public.brief_leagues to authenticated;
create policy management_tenant_read on public.brief_tenants for select to authenticated using (brief_private.tenant_role(id) is not null);
create policy management_league_read on public.brief_leagues for select to authenticated using (brief_private.tenant_role(tenant_id) is not null);

-- Managers cannot change league IDs/scopes to move content into another bureau.
revoke all on public.brief_publication_articles,public.brief_league_memory from anon,authenticated;
grant select,insert,update on public.brief_publication_articles,public.brief_league_memory to authenticated;
create policy management_articles_read on public.brief_publication_articles for select to authenticated
  using (scope='league' and exists(select 1 from public.brief_leagues l where l.id=league_id and brief_private.tenant_role(l.tenant_id) is not null));
create policy management_articles_insert on public.brief_publication_articles for insert to authenticated
  with check (scope='league' and exists(select 1 from public.brief_leagues l where l.id=league_id and brief_private.tenant_role(l.tenant_id) is not null));
create policy management_articles_update on public.brief_publication_articles for update to authenticated
  using (scope='league' and exists(select 1 from public.brief_leagues l where l.id=league_id and brief_private.tenant_role(l.tenant_id) is not null))
  with check (scope='league' and exists(select 1 from public.brief_leagues l where l.id=league_id and brief_private.tenant_role(l.tenant_id) is not null));
create policy management_memory_read on public.brief_league_memory for select to authenticated
  using (exists(select 1 from public.brief_leagues l where l.id=league_id and brief_private.tenant_role(l.tenant_id) is not null));
create policy management_memory_insert on public.brief_league_memory for insert to authenticated
  with check (exists(select 1 from public.brief_leagues l where l.id=league_id and brief_private.tenant_role(l.tenant_id) is not null));
create policy management_memory_update on public.brief_league_memory for update to authenticated
  using (exists(select 1 from public.brief_leagues l where l.id=league_id and brief_private.tenant_role(l.tenant_id) is not null))
  with check (exists(select 1 from public.brief_leagues l where l.id=league_id and brief_private.tenant_role(l.tenant_id) is not null));
-- No management grants on shared correspondent profiles, provider tokens, or snapshots.

create function brief_private.public_articles(p_slug text,p_article_slug text default null) returns jsonb
language sql stable security definer set search_path='' as $$
  select coalesce(jsonb_agg(to_jsonb(a) order by a.published_at desc),'[]'::jsonb) from (
    select a.id,a.slug,a.title,a.dek,a.body,a.writer_slug,a.section,a.published_at
    from public.brief_publication_articles a
    join public.brief_leagues l on l.id=a.league_id
    join public.brief_tenants t on t.id=l.tenant_id
    where t.slug=p_slug and t.status='active' and t.settings->>'public'='true'
      and l.status='active' and a.scope='league' and a.status='published'
      and (p_article_slug is null or a.slug=p_article_slug)
    order by a.published_at desc limit 100
  ) a;
$$;
create function public.get_public_brief_articles(p_slug text,p_article_slug text default null) returns jsonb
language sql stable security invoker set search_path='' as $$ select brief_private.public_articles(p_slug,p_article_slug); $$;
revoke all on function brief_private.public_articles(text,text),public.get_public_brief_articles(text,text) from public;
grant usage on schema brief_private to anon;
grant execute on function brief_private.public_articles(text,text),public.get_public_brief_articles(text,text) to anon,authenticated;
