# Editorial culture: delivery and evidence

## Authoring → consumer → review

1. `EDITORIAL.md` is the human editorial source. The deployable instruction source is
   `supabase/functions/brief-editorial-worker/contract.ts`, version `2026-10-17.2`.
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
source packets and Cody's judgment is still needed. Maude's earlier contradictory sentence was explicitly corrected by Cody as a typo.
Her resolved canon is near-religious commitment to evidence combined with active openness
to emergent patterns, without treating statistics as certainty.

## Feedback coverage audit (October 17, 2026)

This is a coverage map of the completed founding feedback and the subsequent Maude
clarification, not a claim that tests establish internalized taste.

1. **Every-piece quality, repeated editing, joy and humanity:** `cultural-purpose`,
   `earned-delight`, `continuing-edit` and the six desk profiles. Laugh-crying remains
   the grail, not a compulsory emotional ending. Material post-approval changes need fresh
   editorial review and fresh Cody publication approval. Optimism and creativity are a viable
   future. Viral attention is not a pitch; echo-chamber output fails the purpose.
2. **Reader respect and show-not-tell:** `reader-respect`, checked with passage-specific
   review evidence. No hand-holding, condescension, leading the witness or explained jokes.
3. **Six characters:** `DESKS` retains Maude's resolved evidence/emergence tension;
   Hollis's gonzo moral gravity, dense lived experience and small observations;
   Conrad's dimensional anger and earned surprising optimism; Marnie's fearless trend
   leadership and genuine care; Sabine's earned judgment and respect for greater lived
   experience; Dashiell's ethical, practical dealmaking rather than habitual refusal.
   No imposed racial performance, imitation of the quoted author or mechanical story arc.
4. **Absurdity, profundity and an emotional point:** `cultural-purpose` and
   `reporting-honesty`. Entertain with movement and leave the reader feeling different.
   Emotion is not a substitute for factual verification.
5. **Editorial initiative:** `creative-ownership` and `reporting-honesty`. Own source
   discovery, find what we love enough to defend, favor specific discoveries over generic
   existential questions, and let the work earn its audience. Ambition precedes premature
   prohibition lists. Cody's current final approval remains explicit; technical approval
   infrastructure remains the rollout gap above.
6. **Trust and originality:** `independent-angle` and `reporting-honesty`, plus substantive
   comparison in review. Do not recycle another outlet's premise or misrepresent access.
   No impossible guarantee of zero overlap. Missing source/comparison material is a gap,
   not a license to declare an angle original.
7. **Future-facing newsroom and durable learning:** human assignment guidance calls for
   imaginative, diverse perspectives rather than nostalgic stock characters. The culture
   supports Cody's direct relationship with each correspondent; it is not a replacement
   intermediary. New corrections must update the executable contract and human handoff,
   gain delivery/gate tests where meaningful, and later face actual editorial evaluation.

The expressly skipped proposal remains skipped; this work does not revive it. Personal
founder biography is unnecessary to these writing instructions. An internal editorial
identity is not silently added to the public correspondent cast. No publication authority
is inferred from approval of a successful GitHub build.
