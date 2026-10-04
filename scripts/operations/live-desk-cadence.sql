-- Idempotent schedule repair; retain the existing authenticated job command.
select cron.alter_job(jobid, schedule := '*/3 * * * *')
from cron.job where jobname = 'brief-sunday-engine-5m';
-- The worker's one-minute trigger stays unchanged. Per-edition leases prevent
-- overlap while each invocation advances multiple persisted editorial stages.
