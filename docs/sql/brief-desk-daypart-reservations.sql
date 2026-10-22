-- Preserve the existing signature, SECURITY INVOKER, search_path, owner and ACL.
-- One-time October 18 window only. Reservations remain nonrefundable.
-- Pair input is JSON text: {"mode":"draft_review_pair","review_id":"UUID","event_key":"..."}.
-- p_id is the draft usage UUID. Both usage rows and the event are claimed atomically.
CREATE OR REPLACE FUNCTION public.reserve_brief_call(p_id uuid, p_purpose text)
RETURNS boolean
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
 local_day date := (clock_timestamp() AT TIME ZONE 'America/New_York')::date;
 period date;
 reservation jsonb;
 review_id uuid;
 event_key_value text;
 pair_mode boolean := false;
 slots integer := 1;
 cents integer := 10;
 ceiling_calls integer;
 ceiling_cents integer;
 existing_cents integer;
 existing_calls bigint;
 checked_at timestamptz;
BEGIN
 IF p_id IS NULL OR p_purpose IS NULL THEN
  RAISE EXCEPTION 'Invalid reservation input';
 END IF;
 IF left(ltrim(p_purpose), 1) = '{' THEN
  IF octet_length(p_purpose) > 1024 THEN RAISE EXCEPTION 'Invalid pair reservation'; END IF;
  reservation := p_purpose::jsonb;
  IF reservation->>'mode' IS DISTINCT FROM 'draft_review_pair'
     OR jsonb_typeof(reservation->'review_id') IS DISTINCT FROM 'string'
     OR jsonb_typeof(reservation->'event_key') IS DISTINCT FROM 'string' THEN
   RAISE EXCEPTION 'Invalid pair reservation';
  END IF;
  review_id := (reservation->>'review_id')::uuid;
  event_key_value := reservation->>'event_key';
  IF review_id = p_id OR length(event_key_value) NOT BETWEEN 1 AND 300 THEN
   RAISE EXCEPTION 'Invalid pair reservation';
  END IF;
  pair_mode := true;
  slots := 2;
  cents := 20;
 END IF;
 checked_at := clock_timestamp();
 IF checked_at < timestamptz '2026-10-18 13:30:00+00'
    OR checked_at >= timestamptz '2026-10-19 04:00:00+00' THEN RETURN false; END IF;
 IF NOT EXISTS(SELECT 1 FROM brief_desk_control WHERE id AND enabled) THEN RETURN false; END IF;
 period := local_day - ((extract(isodow FROM local_day)::integer + 2) % 7);
 INSERT INTO brief_desk_budget(period_start) VALUES(period) ON CONFLICT DO NOTHING;
 -- All reservation paths serialize on the same row before counting or claiming.
 SELECT reserved_cents INTO existing_cents FROM brief_desk_budget
  WHERE period_start = period FOR UPDATE;
 IF NOT FOUND THEN RETURN false; END IF;
 checked_at := clock_timestamp();
 IF checked_at < timestamptz '2026-10-18 13:30:00+00'
    OR checked_at >= timestamptz '2026-10-19 04:00:00+00' THEN RETURN false; END IF;
 ceiling_calls := CASE
  WHEN checked_at < timestamptz '2026-10-18 20:00:00+00' THEN 70
  WHEN checked_at < timestamptz '2026-10-19 00:00:00+00' THEN 86
  ELSE 100 END;
 ceiling_cents := ceiling_calls * 10;
 SELECT count(*) INTO existing_calls FROM brief_desk_usage WHERE period_start = period;
 IF existing_cents + cents > ceiling_cents OR existing_calls + slots > ceiling_calls THEN RETURN false; END IF;
 IF pair_mode THEN
  INSERT INTO brief_desk_events(event_key) VALUES(event_key_value)
   ON CONFLICT (event_key) DO NOTHING;
  IF NOT FOUND THEN RETURN false; END IF;
 END IF;
 UPDATE brief_desk_budget SET reserved_cents = reserved_cents + cents WHERE period_start = period;
 IF pair_mode THEN
  INSERT INTO brief_desk_usage(id, period_start, purpose, model)
   VALUES(p_id, period, 'draft', 'gpt-5.4-mini'),
         (review_id, period, 'review', 'gpt-5.4-mini');
 ELSE
  -- Compatibility for an already-running older worker, under the same ceilings.
  INSERT INTO brief_desk_usage(id, period_start, purpose, model)
   VALUES(p_id, period, p_purpose, 'gpt-5.4-mini');
 END IF;
 RETURN true;
 -- No exception handler: any usage-ID/constraint error rolls back the event,
 -- budget update and both usage inserts together, rather than partially charging.
END
$function$;
