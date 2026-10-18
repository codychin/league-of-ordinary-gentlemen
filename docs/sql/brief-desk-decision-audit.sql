-- Additive internal diagnostics. Preserve existing RLS and grants; no data rewrite.
ALTER TABLE public.brief_desk_events ADD COLUMN IF NOT EXISTS decision jsonb;
