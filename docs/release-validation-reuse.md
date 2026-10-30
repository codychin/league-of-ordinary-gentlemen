# Same-run release validation reuse

Release integrity owns checkout, Node 22, dependency installation, the production
build, the pinned Playwright compatibility/launch guard, and both browser server
environments. Its `article-image-qa` dependent job preserves the existing required
check name. No promotion code, environment approval, permission, or branch
protection setting changes.

The dependency must succeed and emit the checkout action’s verified commit output, run ID, attempt, and
workflow ref after all validation and report uploads succeed. The dependent check
compares every field against its own GitHub context. Missing, failed, cancelled,
skipped, other-commit, other-run, other-attempt, or other-workflow evidence fails
closed. No API lookup, downloaded artifact, PR-head cache, or external receipt is
trusted. Both jobs use the same immutable workflow revision and configuration;
PR merge commits and main push commits each execute their own validation. Rerun
**all jobs** if a partial rerun encounters an older attempt's evidence.

Coverage retained:

- Real media preparation/shelf delivery contracts without spending.
- Full `npm test`, full `npm run build` including boundary/routing checks and asset preparation.
- Digest-pinned browser image and locked/installed Playwright version checks;
  real Chromium and WebKit launch checks.
- Original unmocked image-framing suite, now on port 3001, with its own report.
- Original score-fixture image-framing, divider, and reading-navigation suites
  on port 3000, with their existing report and viewport/browser matrix.
- Existing exact-main candidate, both named checks, staging route, promotion,
  alias, and live public route verification gates remain unchanged.

Removed work: the standalone image workflow's checkout, container startup, Node
setup, npm installation and production build. The dependent check needs no
checkout, dependencies, browser container, or artifact download. Image tests
remain in both environments, so no coverage claim relies on assuming their
fixtures are equivalent. The legacy workflow name remains in the promotion
listener for compatibility; Release integrity completion now includes both checks.

## Baseline observations (not demonstrated savings)

Source: main Release integrity run
[41110204371](https://github.com/codychin/league-of-ordinary-gentlemen/actions/runs/41110204371),
integrity job 124251520885, commit 069de32e33907521ad4f212c6e6ba5a67693975e.
Approximate elapsed stage intervals from timestamped job logs:

| Stage | Start UTC | Next stage UTC | Elapsed |
| --- | --- | --- | --- |
| Container creation | 18:52:17 | 18:52:40 | 23 s |
| Checkout | 18:52:40 | 18:54:15 | 95 s |
| Node setup/cache | 18:54:15 | 18:54:18 | 3 s |
| npm ci | 18:54:18 | 18:54:24 | 7 s |
| npm test (285 passed) | 18:54:24 | 18:54:42 | 18 s |
| Build | 18:54:42 | 18:54:58 | 16 s |
| Browser guard | 18:54:58 | 18:54:59 | 1 s |
| Fixture browser suite | 18:54:59 | 18:58:26 | 207 s |

These are observed intervals in the general job, not measurements of the removed
job or predicted wall-clock gains. The two original workflows ran concurrently;
consolidation saves runner work but now runs the short unmocked image suite before
the broader fixture suite. Queue time and that ordering can affect latency. The
reported 12m21s whole-run duration and 23–31 minute approval-to-live experience
include other stages and must not be treated as the savings from this change.
Measure a post-merge main run and the full approval-to-verified release separately.
No production speed improvement is yet demonstrated.
