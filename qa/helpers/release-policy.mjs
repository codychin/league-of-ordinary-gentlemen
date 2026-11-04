// File-level parallelism only. Each test retains its own browser context.
export function releaseBrowserPolicy(env=process.env) {
  const ci=env.CI==='true';
  return {workers:ci?2:1,retries:0,maxFailures:ci?1:0,forbidOnly:ci};
}
