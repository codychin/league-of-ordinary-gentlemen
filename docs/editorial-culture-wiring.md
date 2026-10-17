# Editorial culture: delivery and evidence

## Authoring → consumer → review

1. `EDITORIAL.md` is the human editorial source. The deployable instruction source is
   `supabase/functions/brief-editorial-worker/contract.ts`, version `2026-10-17.1`.
   It preserves existing factual, league-boundary, no-quota, name and structure corrections.
2. The reachable worker entrypoint (`index.ts`) calls `sharedDesk` (`shared.ts`). That
   path captures one contract snapshot for both its draft and independent review calls.
   Both receive every newsroom rule and all six desk profiles as actual instructions.
3. The review receives `reviewInstructions(snapshot)`. A machine review must supply
   specific evidence for reader respect, entertainment/movement, voice, independent
   angle and reporting honesty. Missing, empty or unresolved checks cannot approve.
   This is a structured qualitative judgment, not a score or a keyword novelty test.
4. The inserted review records its contract version. No new model calls, retry loops,
   model changes, budgets or credentials are introduced.
5. Older `workflow.ts` also pins the contract and passes it through all six stages in
   `model.ts`, including revision and fresh review. Already-pinned jobs keep their old
   instructions. Legacy contracts without review checks retain their old schema.

## Boundaries and rollout prerequisites

**Do not activate this change as proof of Cody-controlled publication.** The existing
reachable `sharedDesk` inserts into `brief_global_live_posts` after machine approval.
It has no verified owner-approval receipt or draft-to-owner approval step. Cody is
currently approving everything: before rollout, implement and test that separate
approval mechanism or keep generation non-publishing. This patch does not authorize
activation, merge, deployment, generation spending or publication.

The capped path has no revision loop. It declines/rejects weak material rather than
spending indefinitely; the continuing-edit instruction does not create a post-approval
editing system. The older workflow's two-revision cap remains unchanged.

`brief-sunday-engine/model.ts` is legacy: its imported generators are not called by the
reachable `Deno.serve` branch. Do not reactivate it as an alternate culture-free path.
`lib/newsroom-context.js` composes canonical identity and local relationships but is not
loaded by this shared worker. Saved ChatGPT correspondent conversations, long-form
manual work, visual/audio generation and existing articles are not automatically updated.
No runtime deployment or direct-correspondent conversation propagation is asserted.

The present event packet mainly supplies ESPN reports and game data. Instructions to
inspect original artifacts and compare closest coverage do not create those inputs.
The reviewer must mark necessary missing comparisons unverified, not invent provenance.
Broader discovery and originality research remain separate work (including PR #39).

## Verification

`node --test tests/newsroom-worker.test.mjs tests/editorial-culture.test.mjs` captures
outgoing model request bodies with fake network/database responses, exercises missing
and unresolved review-check rejection, verifies exact contract version and retains
older pinning/revision tests. No paid model or database request is made by these tests.

Tests prove delivery and gate shape, not laughter, originality, emotional impact or
internalized taste. A later separately authorized non-publishing comparison using real
source packets and Cody's judgment is still needed. Maude's contradictory first sentence
remains explicitly unresolved; the rest of the guidance is not blocked on it.
