create table public.brief_desk_control(id boolean primary key default true check(id),enabled boolean not null default false, last_attempt timestamptz);
insert into public.brief_desk_control(id) values(true);
create table public.brief_desk_budget(period_start date primary key,reserved_cents integer not null default 0 check(reserved_cents between 0 and 1000));
create table public.brief_desk_usage(id uuid primary key,period_start date not null references public.brief_desk_budget,created_at timestamptz default now(),purpose text not null,model text not null,reserved_cents integer not null default 10 check(reserved_cents=10),input_tokens integer,output_tokens integer,estimated_usd numeric,status text not null default 'reserved');
create table public.brief_desk_events(event_key text primary key,created_at timestamptz default now(),status text not null default 'claimed');
create table public.brief_global_live_posts(id uuid primary key default gen_random_uuid(),event_key text unique not null,writer text not null,tag text not null,subject text not null,text text not null,thread text default 'NFL',published_at timestamptz default now(),sort_time timestamptz default now(),source_url text,source_name text,review jsonb not null);
alter table public.brief_desk_control enable row level security;
alter table public.brief_desk_budget enable row level security;
alter table public.brief_desk_usage enable row level security;
alter table public.brief_desk_events enable row level security;
alter table public.brief_global_live_posts enable row level security;
revoke all on public.brief_desk_control,public.brief_desk_budget,public.brief_desk_usage,public.brief_desk_events,public.brief_global_live_posts from anon,authenticated;
grant all on public.brief_desk_control,public.brief_desk_budget,public.brief_desk_usage,public.brief_desk_events,public.brief_global_live_posts to service_role;
-- Non-refundable worst-case reservations: timeouts, retries and rejected work still count.
create function public.reserve_brief_call(p_id uuid,p_purpose text) returns boolean language plpgsql security invoker set search_path=public as $$
declare local_day date := (now() at time zone 'America/New_York')::date; period date;
begin
 if not exists(select 1 from brief_desk_control where id and enabled) then return false; end if;
 period := local_day - ((extract(isodow from local_day)::integer+2)%7);
 insert into brief_desk_budget(period_start) values(period) on conflict do nothing;
 update brief_desk_budget set reserved_cents=reserved_cents+10 where period_start=period and reserved_cents+10<=1000;
 if not found then return false; end if;
 insert into brief_desk_usage(id,period_start,purpose,model) values(p_id,period,p_purpose,'gpt-5.4-mini');
 return true;
end $$;
create function public.claim_brief_attempt() returns boolean language sql security invoker set search_path=public as $$
 with claimed as (update brief_desk_control set last_attempt=now() where id and enabled and (last_attempt is null or last_attempt<now()-interval '3 minutes') returning 1) select exists(select 1 from claimed)
$$;
revoke all on function public.reserve_brief_call(uuid,text),public.claim_brief_attempt() from public,anon,authenticated;
grant execute on function public.reserve_brief_call(uuid,text),public.claim_brief_attempt() to service_role;
