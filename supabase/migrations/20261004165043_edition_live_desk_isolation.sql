
create table public.brief_edition_live_posts (
 id bigint generated always as identity primary key,
 edition_slug text not null references public.brief_tenants(slug),
 writer text not null, tag text not null, subject text, text text not null,
 thread text, status text not null default 'draft', story_key text,
 published_at timestamptz, sort_time timestamptz not null default now(),
 created_at timestamptz not null default now(), source_url text, source_name text,
 unique(edition_slug,story_key)
);
create table public.brief_edition_editorial_runs (
 id bigint generated always as identity primary key,
 edition_slug text not null references public.brief_tenants(slug),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 status text not null default 'queued', packet jsonb not null default '{}',
 pitches jsonb, decision jsonb, draft jsonb, error text, attempts integer not null default 0
);
create unique index brief_edition_one_open_run on public.brief_edition_editorial_runs(edition_slug)
 where status in ('queued','pitched','selected','written');
create table public.brief_edition_editorial_memory (
 id bigint generated always as identity primary key,
 edition_slug text not null references public.brief_tenants(slug),
 created_at timestamptz not null default now(), writer text not null,
 premise_key text not null, thesis text, evidence jsonb, outcome text,
 source_post_id bigint references public.brief_edition_live_posts(id),
 unique(edition_slug,writer,premise_key)
);
create table public.brief_edition_desk_leases (
 edition_slug text primary key references public.brief_tenants(slug),
 owner uuid, until_at timestamptz not null default now()
);
alter table public.brief_edition_live_posts enable row level security;
alter table public.brief_edition_editorial_runs enable row level security;
alter table public.brief_edition_editorial_memory enable row level security;
alter table public.brief_edition_desk_leases enable row level security;
revoke all on public.brief_edition_live_posts,public.brief_edition_editorial_runs,public.brief_edition_editorial_memory,public.brief_edition_desk_leases from anon,authenticated;
grant all on public.brief_edition_live_posts,public.brief_edition_editorial_runs,public.brief_edition_editorial_memory,public.brief_edition_desk_leases to service_role;
create function public.claim_edition_desk(p_slug text,p_owner uuid) returns boolean
language sql security invoker set search_path=public as $$
 with claimed as (
 insert into brief_edition_desk_leases(edition_slug,owner,until_at)
 values(p_slug,p_owner,now()+interval '4 minutes')
 on conflict(edition_slug) do update set owner=excluded.owner,until_at=excluded.until_at
 where brief_edition_desk_leases.until_at<now()
 returning 1) select exists(select 1 from claimed)
$$;
revoke all on function public.claim_edition_desk(text,uuid) from public,anon,authenticated;
grant execute on function public.claim_edition_desk(text,uuid) to service_role;

