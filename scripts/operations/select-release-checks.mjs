import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

// Deliberately narrow initial lane. Any application, media, dependency, unknown
// or deleted path retains the existing broad checks. No branch-name exemptions.
export const focusedPaths = new Set([
  '.github/workflows/release-integrity.yml',
  '.github/workflows/promote-verified-production.yml',
  'scripts/operations/select-release-checks.mjs',
  'scripts/operations/monitor-release-state.mjs',
  'scripts/operations/monitor-incident.mjs',
  'tests/release-monitor-tristate.test.mjs',
  'scripts/operations/check-public-routes.mjs',
  'scripts/operations/check-editorial-release.mjs',
  'scripts/operations/promote-verified-release.mjs',
  'qa/release-expectations/chargers-detroit-2026-11-07.json',
  'tests/public-smoke-scope.test.mjs',
  'tests/automatic-release-contract.test.mjs',
  'tests/release-gate-recovery.test.mjs',
  'tests/release-check-selection.test.mjs',
  'tests/release-validation-reuse.test.mjs',
]);
export function selectChecks(changes) {
  return changes.length > 0 && changes.every(({status, path}) =>
    ['A', 'M'].includes(status) && focusedPaths.has(path)) ? 'release-tooling' : 'full';
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const rows = fs.readFileSync(process.argv[2], 'utf8').trim().split('\n').filter(Boolean);
  const changes = rows.map(row => { const [status, path, extra] = row.split('\t'); return {status: extra ? 'unknown' : status, path}; });
  const lane = selectChecks(changes);
  console.log(`Selected ${lane} checks for ${changes.length} changed paths`);
  fs.appendFileSync(process.env.GITHUB_OUTPUT, `lane=${lane}\n`);
}
