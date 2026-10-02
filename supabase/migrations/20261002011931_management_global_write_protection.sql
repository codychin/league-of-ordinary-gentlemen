-- Public displays remain readable; global engine writes require service-role credentials.
alter table public.brief_live_score_state enable row level security;
alter table public.brief_live_detail_state enable row level security;
alter table public.brief_media_releases enable row level security;
alter table public.brief_public_sports_wire enable row level security;
alter table public.brief_editorial_candidates enable row level security;
alter table public.brief_editorial_reservations enable row level security;
revoke insert,update,delete,truncate,references,trigger on public.brief_live_score_state,public.brief_live_detail_state,public.brief_media_releases,public.brief_public_sports_wire,public.brief_editorial_candidates,public.brief_editorial_reservations from anon,authenticated;
create policy public_score_read on public.brief_live_score_state for select to anon,authenticated using (true);
create policy public_detail_read on public.brief_live_detail_state for select to anon,authenticated using (true);
create policy public_release_read on public.brief_media_releases for select to anon,authenticated using (true);
revoke select on public.brief_public_sports_wire,public.brief_editorial_candidates,public.brief_editorial_reservations from anon,authenticated;
