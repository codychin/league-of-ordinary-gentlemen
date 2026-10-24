-- STAGING PILOT ONLY. Not a production migration. Apply only to a verified isolated database.
-- Requires Supabase auth.uid(), auth.role(), authenticated/anon/service_role roles.
begin;
create schema brief_pilot;
revoke all on schema brief_pilot from public, anon, authenticated, service_role;
create table brief_pilot.access (
 actor uuid primary key, editions text[] not null check(cardinality(editions)>0 and editions <@ array['loog','sunday-crew','doge']), approver boolean not null default false,
 publisher boolean not null default false, verifier boolean not null default false, active boolean not null default true,
 version integer not null default 1 check(version>0),
 check(not verifier or (not approver and not publisher))
);
create table brief_pilot.releases (
 digest text primary key, payload jsonb not null, renderer text not null,
 actor uuid not null, created_at timestamptz not null default clock_timestamp()
);
create table brief_pilot.head (
 id boolean primary key default true check(id), digest text references brief_pilot.releases,
 generation integer not null default 0, renderer text not null
);
create table brief_pilot.approvals (
 id bigint generated always as identity primary key, digest text not null references brief_pilot.releases,
 actor uuid not null, permission_version integer not null, scope text not null check(scope='staging'),
 created_at timestamptz not null default clock_timestamp()
);
create table brief_pilot.revocations (
 approval bigint primary key references brief_pilot.approvals, actor uuid not null,
 created_at timestamptz not null default clock_timestamp()
);
create table brief_pilot.qa (
 id bigint generated always as identity primary key, digest text not null references brief_pilot.releases,
 actor uuid not null, permission_version integer not null, editions text[] not null,
 renderer text not null, evidence jsonb not null, created_at timestamptz not null default clock_timestamp()
);
create table brief_pilot.activations (
 request_id uuid primary key, actor uuid not null, digest text not null references brief_pilot.releases,
 previous text, generation integer unique not null, approval bigint references brief_pilot.approvals,
 qa_id bigint not null references brief_pilot.qa, changed_editions text[] not null,
 created_at timestamptz not null default clock_timestamp()
);
create table brief_pilot.verifications (
 request_id uuid primary key references brief_pilot.activations, actor uuid not null,
 evidence jsonb not null, created_at timestamptz not null default clock_timestamp()
);
-- No direct access, including service_role. Functions derive actors from verified user JWTs.
do $$ declare t text; begin
 foreach t in array array['access','releases','head','approvals','revocations','qa','activations','verifications'] loop
 execute format('alter table brief_pilot.%I enable row level security',t);
 execute format('revoke all on brief_pilot.%I from public, anon, authenticated, service_role',t);
 end loop;
end $$;
create function brief_pilot.immutable() returns trigger language plpgsql set search_path='' as $$
begin raise exception 'immutable publication record'; end $$;
do $$ declare t text; begin
 foreach t in array array['releases','approvals','revocations','qa','activations','verifications'] loop
 execute format('create trigger immutable before update or delete on brief_pilot.%I for each row execute function brief_pilot.immutable()',t);
 end loop;
end $$;

create index qa_digest_order on brief_pilot.qa(digest,id desc);
create function brief_pilot.changed_editions(previous_digest text,candidate_digest text) returns text[]
language sql stable set search_path='' as $$
 select coalesce(array_agg(e order by e),'{}'::text[])
 from brief_pilot.releases candidate
 left join brief_pilot.releases previous on previous.digest=previous_digest,
 unnest(array['loog','sunday-crew','doge']) e
 where candidate.digest=candidate_digest and
 (previous.digest is null or candidate.payload->'editions'->e is distinct from previous.payload->'editions'->e);
$$;

create function brief_pilot.command(op text, args jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare
 u uuid := auth.uid(); g brief_pilot.access; h brief_pilot.head;
 r brief_pilot.releases; a brief_pilot.approvals; act brief_pilot.activations;
 d text := args->>'digest'; edition text; snap jsonb; story text; arr jsonb;
 req uuid; result jsonb; changed text[]; attested text[]; selected_qa bigint; requested_renderer text := args->>'renderer';
begin
 if auth.role() is distinct from 'authenticated' or u is null then raise exception 'authenticated user required'; end if;
 -- One lock order serializes activation/revocation; access row locks prevent stale grants.
 select * into h from brief_pilot.head where id for update;
 if not found then raise exception 'pilot not initialized'; end if;
 if requested_renderer is distinct from h.renderer then raise exception 'fixed renderer mismatch'; end if;
 select * into g from brief_pilot.access where actor=u and active for share;
 if not found then raise exception 'pilot permission required'; end if;
 if args->>'scope' is distinct from 'staging' then raise exception 'staging scope required'; end if;
 if op='stage' then
  if not g.approver then raise exception 'approver required'; end if;
  if args->'payload'->>'schemaVersion' is distinct from '1' then raise exception 'unsupported schema'; end if;
  if args->'payload'->>'renderer' is distinct from h.renderer then raise exception 'payload renderer mismatch'; end if;
  if (select count(*) from jsonb_object_keys(args->'payload'->'editions'))<>3 then raise exception 'three editions required'; end if;
  foreach edition in array array['loog','sunday-crew','doge'] loop
   snap := args->'payload'->'editions'->edition;
   if snap is null then raise exception 'missing edition'; end if;
   arr := snap->'home';
   if jsonb_typeof(arr)<>'array' or jsonb_array_length(arr)<4 then raise exception 'lead and three cards required'; end if;
   if (select count(distinct value) from jsonb_array_elements_text(arr))<>jsonb_array_length(arr) then raise exception 'duplicate placement'; end if;
   for story in select jsonb_array_elements_text(arr) loop
    if not (snap->'articles' ? story) then raise exception 'missing article'; end if;
   end loop;
   if h.digest is not null and not edition=any(g.editions) and
      snap is distinct from (select payload->'editions'->edition from brief_pilot.releases where digest=h.digest)
    then raise exception 'edition permission denied'; end if;
   if h.digest is null and not edition=any(g.editions) then raise exception 'baseline requires all editions'; end if;
  end loop;
  d := encode(sha256(convert_to((args->'payload')::text,'UTF8')),'hex');
  insert into brief_pilot.releases values(d,args->'payload',h.renderer,u,clock_timestamp()) on conflict do nothing;
  return jsonb_build_object('digest',d);
 end if;
 if op='read' then
  d := coalesce(d,h.digest);
  select * into r from brief_pilot.releases where digest=d;
  if not found then raise exception 'release not found'; end if;
  edition:=args->>'edition';
  if not edition=any(g.editions) then raise exception 'edition permission denied'; end if;
  return jsonb_build_object('digest',d,'generation',h.generation,'renderer',h.renderer,'actor',u,'snapshot',r.payload->'editions'->edition,'preflightReady',exists(select 1 from brief_pilot.qa q join brief_pilot.access v on v.actor=q.actor where q.digest=d and v.active and v.verifier and v.version=q.permission_version and v.editions @> brief_pilot.changed_editions(h.digest,d) and q.editions @> brief_pilot.changed_editions(h.digest,d)));
 end if;
 if op='status' then
  select * into act from brief_pilot.activations where request_id=(args->>'requestId')::uuid and actor=u;
  if not found then return jsonb_build_object('state',case when (args->>'expectedGeneration')::integer < h.generation then 'superseded' else 'recoverable-failure' end,'committed',false,'active',h.digest); end if;
  return jsonb_build_object('state',case when h.generation<>act.generation then 'superseded' when exists(select 1 from brief_pilot.verifications where request_id=act.request_id) then 'verified-live' else 'publishing' end,
   'committed',true,'digest',act.digest,'active',h.digest,'generation',act.generation);
 end if;
 select * into r from brief_pilot.releases where digest=d;
 if not found then raise exception 'release not found'; end if;
 if op='revoke' then
  select * into a from brief_pilot.approvals where id=(args->>'approval')::bigint and digest=d;
  if not found or a.actor<>u or not g.approver then raise exception 'approval owner required'; end if;
  insert into brief_pilot.revocations values(a.id,u,clock_timestamp()) on conflict do nothing;
  return jsonb_build_object('revoked',a.id,'active',h.digest,'requiresWithdrawal',h.digest=d);
 end if;
 changed := brief_pilot.changed_editions(h.digest,d);
 foreach edition in array array['loog','sunday-crew','doge'] loop
  if not edition=any(g.editions) and (h.digest is null or r.payload->'editions'->edition is distinct from
    (select payload->'editions'->edition from brief_pilot.releases where digest=h.digest)) then raise exception 'edition permission denied'; end if;
 end loop;
 if op='preflight' then
  if not g.verifier then raise exception 'verifier required'; end if;
  if args->'evidence'->>'passed' is distinct from 'true' or args->'evidence'->>'digest' is distinct from d then raise exception 'exact QA evidence required'; end if;
  if jsonb_typeof(args->'evidence'->'editions') is distinct from 'array' then raise exception 'explicit QA edition scope required'; end if;
  select array_agg(e) into attested from jsonb_array_elements_text(args->'evidence'->'editions') e;
  if attested is null or not g.editions @> attested or not attested @> changed then raise exception 'QA edition permission denied'; end if;
  insert into brief_pilot.qa(digest,actor,permission_version,editions,renderer,evidence) values(d,u,g.version,attested,h.renderer,args->'evidence') returning id into selected_qa;
  return jsonb_build_object('preflight',true,'attestation',selected_qa);
 end if;
 if op='verify' then
  if not g.verifier then raise exception 'verifier required'; end if;
  select * into act from brief_pilot.activations where request_id=(args->>'requestId')::uuid;
  if not found or act.digest<>d or h.digest<>d or h.generation<>act.generation then raise exception 'activation superseded'; end if;
  if not g.editions @> act.changed_editions then raise exception 'verification edition permission denied'; end if;
  if args->'evidence'->>'passed' is distinct from 'true' or args->'evidence'->>'digest' is distinct from d then raise exception 'exact live evidence required'; end if;
  insert into brief_pilot.verifications values(act.request_id,u,args->'evidence',clock_timestamp()) on conflict do nothing;
  return jsonb_build_object('state','verified-live','digest',d);
 end if;
 if op not in ('approve','publish','approve_publish') then raise exception 'unsupported operation'; end if;
 if op<>'approve' then
  if not g.publisher then raise exception 'publisher required'; end if;
  req := (args->>'requestId')::uuid;
  if req is null then raise exception 'request ID required'; end if;
  select * into act from brief_pilot.activations where request_id=req;
  if found then
   if act.actor<>u or act.digest<>d then raise exception 'idempotency conflict'; end if;
   return jsonb_build_object('committed',true,'digest',d,'generation',act.generation,'replayed',true);
  end if;
 end if;
 -- The QA role is separately granted and rechecked, never inferred from publisher status.
 select q.id into selected_qa from brief_pilot.qa q join brief_pilot.access v on v.actor=q.actor
  where q.digest=d and q.renderer=h.renderer and v.active and v.verifier and v.version=q.permission_version
   and q.editions @> changed and v.editions @> changed
  order by q.id desc limit 1 for share of v;
 if not found then raise exception 'valid exact preflight required'; end if;
 if op in ('approve','approve_publish') then
  if not g.approver then raise exception 'approver required'; end if;
  insert into brief_pilot.approvals(digest,actor,permission_version,scope) values(d,u,g.version,'staging') returning * into a;
 else
  select ap.* into a from brief_pilot.approvals ap join brief_pilot.access gr on gr.actor=ap.actor
   where ap.digest=d and gr.active and gr.approver and gr.version=ap.permission_version
   and not exists(select 1 from brief_pilot.revocations rv where rv.approval=ap.id)
   order by ap.id desc limit 1 for share of gr;
  if not found then raise exception 'valid approval required'; end if;
 end if;
 -- Recheck approver scope against every changed edition at activation time.
 foreach edition in array array['loog','sunday-crew','doge'] loop
  if (h.digest is null or r.payload->'editions'->edition is distinct from (select payload->'editions'->edition from brief_pilot.releases where digest=h.digest)) and
   not exists(select 1 from brief_pilot.access where actor=a.actor and edition=any(editions)) then raise exception 'approver edition permission denied'; end if;
 end loop;
 if op='approve' then return jsonb_build_object('approval',a.id); end if;
 if (args->>'expectedGeneration')::integer is distinct from h.generation then raise exception 'stale generation'; end if;
 update brief_pilot.head set digest=d,generation=generation+1 where id;
 insert into brief_pilot.activations values(req,u,d,h.digest,h.generation+1,a.id,selected_qa,changed,clock_timestamp());
 return jsonb_build_object('committed',true,'digest',d,'generation',h.generation+1,'state','publishing');
end $$;
revoke all on all functions in schema brief_pilot from public,anon,authenticated,service_role;
grant usage on schema brief_pilot to authenticated;
grant execute on function brief_pilot.command(text,jsonb) to authenticated;
create function public.brief_pilot_command(op text,args jsonb) returns jsonb
language sql security invoker set search_path='' as $$ select brief_pilot.command(op,args); $$;
revoke all on function public.brief_pilot_command(text,jsonb) from public,anon,service_role;
grant execute on function public.brief_pilot_command(text,jsonb) to authenticated;
commit;
