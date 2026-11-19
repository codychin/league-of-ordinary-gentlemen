# Production copy dry-run experiment (not active release policy)

This directory is deliberately unreferenced by release workflows. No result here
grants promotion, skips existing gates, or establishes owner UI approval.

## First increment

- Pure eligibility predicate checks coherent direct-provider/GitHub evidence for
  the last verified LIVE deployment, not merely the previous Git commit.
- Complete diff must contain only the audited article, ordinary modified100644
  mode. No exclusions for harness files: the experiment PR itself cannot qualify.
- Region-aware plain paragraph insertion/deletion classifier reuses current
  strict parsing/schema without changing the active classifier. Nontext blocks,
  signoff and metadata remain immutable; original region anchors/order retained.
- Adversarial unit tests exercise stale/wrong provenance, mixed attempts,
  missing media validation, intervening code/media changes and unsafe prose.

The predicate accepts normalized facts from a trusted collector. Its `source`
label is NOT cryptographic authentication. No automated collector has yet been
installed. Never feed it a PR JSON file and treat the result as live authority.
Both classifiers are data-boundary checks, not editorial or accessibility review.

## Direct baseline observation (2026-11-19)

Authenticated Vercel alias read identified production deployment
`dpl_DFHGMUt1AVqWb1RCPP4QCLVmPPiD`, SHA
`9a7470c7f8f834d34ff7a61b03f3c7a0a0d29254`.
GitHub full-main run44454102854 passed. Promotion run44455753760 passed.
Downloaded artifact14498235452 from that exact main run, checked archive digest
`sha256:1a63a51abe7ae0092582c8029970900d3f25587215b67f8d7b4884f4168e2f1a`,
and read receipt state `verified`, matching deployment/SHA/run/attempt1.
This is a dated observation, not reusable future eligibility evidence.

## Hosted dry-run boundary and remaining work

PR runners do not have Vercel read credentials under the existing main-only trust
boundary. This experiment does not expand secrets/auth or copy short-lived tokens.
Therefore no unattended hosted experiment can currently authenticate fresh live
baseline using this prototype alone. Do not substitute an asserted baseline file.

A future bounded runner should execute harness OUTSIDE an isolated exact candidate
Git tree constructed from freshly verified live SHA, prove the complete tree diff,
then run normal complete-media build, actual candidate copy/layout and representative
media availability. Produce non-promotable evidence with candidate SHA, baseline
SHA, workflow/run/attempt; recheck live baseline before accepting it. Exact owner UI
approval and same-SHA aggregate remain mandatory. Missing evidence stops or falls
back to full validation. No main merge or production activation is part of this PR.

## Metrics

No production fast-path timing is measured by these unit tests. Current baseline:
main full integrity14m20s (broad browsers10m42s); ordinary post-gate promotion2m02s.
Target to test later: eligible copy main validation<3min, merge-to-verified-live<5min
warm. Those are hypotheses, not observed production results. Existing staging
pilot2m53s demonstrates a narrower PR lane, not this proposed production path.

Local result:102 tests passed, including67 paragraph-region cases and35 provenance/
whole-tree cases. The exact PR182 two-paragraph closing insertion replay qualifies
in the experiment while the active classifier still rejects it. The region rule
cannot infer semantic relocation after a paragraph is rewritten; editorial/UI
review remains mandatory. No claim of whole application or hosted fast-path pass.
