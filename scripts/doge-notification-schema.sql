alter table public.brief_push_subscriptions add column if not exists edition_slug text not null default 'league-of-ordinary-gentlemen' references public.brief_tenants(slug);
alter table public.brief_push_deliveries add column if not exists edition_slug text not null default 'league-of-ordinary-gentlemen' references public.brief_tenants(slug);
alter table public.brief_push_deliveries drop constraint if exists brief_push_url_local;
alter table public.brief_push_deliveries add constraint brief_push_url_local check (url like '/articles/%' or url like '/sunday-crew/articles/%' or url like '/doge/articles/%');
create index if not exists brief_push_subscriptions_edition on public.brief_push_subscriptions(edition_slug);
create index if not exists brief_push_deliveries_edition on public.brief_push_deliveries(edition_slug,sent_at desc);
