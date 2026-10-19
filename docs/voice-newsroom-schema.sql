-- UNAPPLIED DRAFT. Review and test in an isolated database before any deployment.
-- Requires the existing verified platform-owner check public.brief_manage_is_owner().
-- No new roles, keys, cron jobs, audio storage, or public tables are created.
-- Authenticated RPC only. Keep brief_voice_private outside exposed API schemas.
-- Transcript entries: {speaker: 'cody' | 'rika' | 'maude' | 'hollis' | 'marnie', text}.
-- TTL prevents API reads immediately; physical cleanup occurs on open/end, not a cron.
-- Budget reservations are irreversible conservative upper bounds, not actual invoices.
-- Provider calls must happen ONLY after successful reserve then single-use start.
-- Losing a start response must not trigger a provider retry with that operation ID.
-- No proof of physical audio playback is possible here: heard is a client acknowledgment.
begin;

create schema brief_voice_private;
revoke all on schema brief_voice_private from public, anon, authenticated;

create table brief_voice_private.rooms (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  created_at timestamptz not null default clock_timestamp(),
  expires_at timestamptz not null default (clock_timestamp() + interval '20 minutes'),
  current_turn uuid,
  current_speaker text check (current_speaker in ('rika','maude','hollis','marnie')),
  pending_text text,
  transcript jsonb not null default '[]'::jsonb,
  check (jsonb_typeof(transcript) = 'array'),
  check ((current_turn is null) = (current_speaker is null)),
  check (pending_text is null or current_turn is not null)
);
create index rooms_expiry on brief_voice_private.rooms (expires_at);

-- Singleton total survives all room deletion/expiry, failures, and owner changes.
create table brief_voice_private.budget (
  id boolean primary key default true check (id),
  total_micro_usd bigint not null default 0 check (total_micro_usd between 0 and 20000000)
);
insert into brief_voice_private.budget (id) values (true);
create table brief_voice_private.operations (
  id uuid primary key,
  owner_id uuid not null,
  room_id uuid not null,
  turn_id uuid,
  amount_micro_usd bigint not null check (amount_micro_usd between 1 and 20000000),
  state text not null default 'reserved' check (state in ('reserved','started')),
  created_at timestamptz not null default clock_timestamp(),
  started_at timestamptz
);
-- Intentionally no FK from operations to rooms or auth.users: deleting either
-- must never refund or erase a consumed reservation or permit operation replay.
alter table brief_voice_private.rooms enable row level security;
alter table brief_voice_private.budget enable row level security;
alter table brief_voice_private.operations enable row level security;
-- No client policies: default-deny, plus no schema/table grants. Privileged RPC
-- explicitly authenticates every invocation and checks per-room/operation owner.
revoke all on all tables in schema brief_voice_private from public, anon, authenticated;

create function brief_voice_private.room_action(
  p_action text, p_room uuid, p_turn uuid, p_speaker text,
  p_text text, p_amount bigint, p_operation uuid
) returns jsonb
language plpgsql security invoker set search_path = ''
as $$
declare
  v_owner uuid := auth.uid();
  v_room brief_voice_private.rooms%rowtype;
  v_operation brief_voice_private.operations%rowtype;
  v_turn uuid;
  v_total bigint;
begin
  if v_owner is null or public.brief_manage_is_owner() is not true then
    raise exception 'Owner access required' using errcode = '42501';
  end if;

  if p_action = 'status' then
    select total_micro_usd into v_total from brief_voice_private.budget where id = true;
    if not found then raise exception 'Budget unavailable' using errcode = '55000'; end if;
    return jsonb_build_object('capMicroUsd',20000000,'reservedMicroUsd',v_total);
  end if;

  if p_action = 'reserve' then
    select * into v_room from brief_voice_private.rooms where id = p_room and owner_id = v_owner for update;
    if not found or v_room.expires_at <= clock_timestamp() then raise exception 'Room unavailable' using errcode = '22023'; end if;
    if p_turn is not null and v_room.current_turn is distinct from p_turn then raise exception 'Stale turn' using errcode = '40001'; end if;
    if p_operation is null or p_amount is null or p_amount < 1 or p_amount > 20000000 then
      raise exception 'Invalid reservation' using errcode = '22023';
    end if;
    -- Same lock order for every reservation; serializes the global cap and ID check.
    select total_micro_usd into v_total from brief_voice_private.budget where id = true for update;
    if not found then raise exception 'Budget unavailable' using errcode = '55000'; end if;
    if exists (select 1 from brief_voice_private.operations where id = p_operation) then
      raise exception 'Operation already reserved' using errcode = '23505';
    end if;
    if v_total > 20000000 - p_amount then
      raise exception 'Voice budget exhausted' using errcode = '54000';
    end if;
    insert into brief_voice_private.operations (id, owner_id, room_id, turn_id, amount_micro_usd)
      values (p_operation, v_owner, p_room, p_turn, p_amount);
    update brief_voice_private.budget set total_micro_usd = total_micro_usd + p_amount where id = true;
    return jsonb_build_object('operationId',p_operation,'reservedMicroUsd',p_amount,'totalMicroUsd',v_total + p_amount);
  elsif p_action = 'start' then
    select * into v_operation from brief_voice_private.operations
      where id = p_operation and owner_id = v_owner for update;
    if not found or v_operation.state <> 'reserved' then
      raise exception 'Operation unavailable or already started' using errcode = '40001';
    end if;
    select * into v_room from brief_voice_private.rooms where id = v_operation.room_id and owner_id = v_owner for update;
    if not found or v_room.expires_at <= clock_timestamp() or v_operation.room_id is distinct from p_room or v_operation.turn_id is distinct from p_turn then raise exception 'Operation room unavailable' using errcode = '40001'; end if;
    if p_turn is not null and v_room.current_turn is distinct from p_turn then raise exception 'Stale turn' using errcode = '40001'; end if;
    update brief_voice_private.operations set state = 'started', started_at = clock_timestamp()
      where id = p_operation;
    return jsonb_build_object('ok',true,'operationId',p_operation);
  elsif p_action = 'open' then
    delete from brief_voice_private.rooms where expires_at <= clock_timestamp();
    insert into brief_voice_private.rooms (owner_id) values (v_owner) returning * into v_room;
    return jsonb_build_object('roomId',v_room.id);
  end if;

  -- All room operations, including read, serialize against claim/end/interrupt.
  select * into v_room from brief_voice_private.rooms
    where id = p_room and owner_id = v_owner for update;
  if not found then
    raise exception 'Room unavailable' using errcode = '22023';
  end if;
  if p_action = 'end' then
    delete from brief_voice_private.rooms where id = p_room and owner_id = v_owner;
    delete from brief_voice_private.rooms where expires_at <= clock_timestamp();
    return jsonb_build_object('ok',true);
  end if;
  -- Check the wall clock AFTER acquiring the lock, not transaction start time.
  if v_room.expires_at <= clock_timestamp() then
    raise exception 'Room expired' using errcode = '22023';
  end if;
  if p_action = 'read' then
    return jsonb_build_object('currentTurn',v_room.current_turn,'transcript',v_room.transcript);
  elsif p_action = 'claim' then
    if p_speaker is null or p_speaker not in ('rika','maude','hollis','marnie') then
      raise exception 'Invalid speaker' using errcode = '22023';
    end if;
    if p_text is not null and (length(btrim(p_text)) = 0 or length(p_text) > 12000) then
      raise exception 'Invalid transcript text' using errcode = '22023';
    end if;
    if jsonb_array_length(v_room.transcript) >= 200 then
      raise exception 'Room transcript full' using errcode = '54000';
    end if;
    if v_room.current_turn is not null then raise exception 'Speaking floor occupied' using errcode = '40001'; end if;
    v_turn := gen_random_uuid();
    if p_text is not null then
      v_room.transcript := v_room.transcript || jsonb_build_array(jsonb_build_object('speaker','cody','text',p_text));
    end if;
    update brief_voice_private.rooms set current_turn = v_turn, current_speaker = p_speaker,
      pending_text = null, transcript = v_room.transcript where id = p_room;
    return jsonb_build_object('turnId',v_turn,'transcript',v_room.transcript);
  end if;

  -- An idle interrupt is a no-op; a delayed interrupt may not clear a new turn.
  if p_action = 'interrupt' and p_turn is null and v_room.current_turn is null then
    return jsonb_build_object('ok',true);
  end if;
  if p_turn is null or v_room.current_turn is distinct from p_turn then
    raise exception 'Stale turn' using errcode = '40001';
  end if;
  if p_action = 'stage' then
    if p_speaker is distinct from v_room.current_speaker or p_text is null or
       length(btrim(p_text)) = 0 or length(p_text) > 12000 or v_room.pending_text is not null then
      raise exception 'Invalid or already staged response' using errcode = '22023';
    end if;
    update brief_voice_private.rooms set pending_text = p_text where id = p_room;
  elsif p_action = 'heard' then
    if v_room.pending_text is null then
      raise exception 'No staged response' using errcode = '22023';
    end if;
    update brief_voice_private.rooms set transcript = transcript ||
      jsonb_build_array(jsonb_build_object('speaker',current_speaker,'text',pending_text)),
      current_turn = null, current_speaker = null, pending_text = null where id = p_room;
  elsif p_action = 'interrupt' then
    update brief_voice_private.rooms set current_turn = null, current_speaker = null,
      pending_text = null where id = p_room;
  else
    raise exception 'Invalid room action' using errcode = '22023';
  end if;
  return jsonb_build_object('ok',true);
end;
$$;
revoke all on function brief_voice_private.room_action(text,uuid,uuid,text,text,bigint,uuid)
  from public, anon, authenticated;

-- This small privileged bridge is necessary because authenticated has no access
-- to the private schema/function. It exposes only the explicitly guarded actions.
-- Install as the existing trusted schema owner, never a client-controlled role.
create function public.brief_voice_room(
  p_action text, p_room uuid default null, p_turn uuid default null,
  p_speaker text default null, p_text text default null,
  p_amount bigint default null, p_operation uuid default null
) returns jsonb
language sql security definer set search_path = ''
as $$
  select brief_voice_private.room_action(p_action,p_room,p_turn,p_speaker,p_text,p_amount,p_operation);
$$;
revoke all on function public.brief_voice_room(text,uuid,uuid,text,text,bigint,uuid) from public, anon, authenticated;
grant execute on function public.brief_voice_room(text,uuid,uuid,text,text,bigint,uuid) to authenticated;
commit;
