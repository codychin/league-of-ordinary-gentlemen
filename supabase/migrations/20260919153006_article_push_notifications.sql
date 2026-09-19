create table if not exists public.brief_push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint brief_push_endpoint_length check (char_length(endpoint) between 20 and 2048),
  constraint brief_push_p256dh_length check (char_length(p256dh) between 20 and 512),
  constraint brief_push_auth_length check (char_length(auth) between 8 and 256)
);

create table if not exists public.brief_push_config (
  id smallint primary key default 1,
  public_key text not null,
  private_key text not null,
  subject text not null default 'https://ordinarybrief.com',
  created_at timestamptz not null default now(),
  constraint brief_push_config_singleton check (id = 1)
);

create table if not exists public.brief_push_deliveries (
  article_id text primary key,
  title text not null,
  body text not null,
  url text not null,
  sent_count integer not null default 0,
  failed_count integer not null default 0,
  sent_at timestamptz not null default now(),
  constraint brief_push_article_id_length check (char_length(article_id) between 1 and 120),
  constraint brief_push_title_length check (char_length(title) between 1 and 120),
  constraint brief_push_body_length check (char_length(body) between 1 and 240),
  constraint brief_push_url_local check (url like '/articles/%')
);

alter table public.brief_push_subscriptions enable row level security;
alter table public.brief_push_config enable row level security;
alter table public.brief_push_deliveries enable row level security;

revoke all on table public.brief_push_subscriptions from anon, authenticated;
revoke all on table public.brief_push_config from anon, authenticated;
revoke all on table public.brief_push_deliveries from anon, authenticated;

grant all on table public.brief_push_subscriptions to service_role;
grant all on table public.brief_push_config to service_role;
grant all on table public.brief_push_deliveries to service_role;
