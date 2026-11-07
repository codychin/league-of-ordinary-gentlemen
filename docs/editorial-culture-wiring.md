# Editorial culture: delivery and evidence

## Authoring → consumer → review

1. `EDITORIAL.md` is the human editorial source. The deployable instruction source is
   `supabase/functions/brief-editorial-worker/contract.ts`, version `2026-11-07.1`.
   It preserves existing factual, league-boundary, no-quota, name and structure corrections.
2. The reachable worker entrypoint (`index.ts`) calls `sharedDesk` (`shared.ts`). That
   path captures one contract snapshot for both its draft and independent review calls.
   Both receive every newsroom rule and all six desk profiles as actual instructions.
3. The review receives `reviewInstructions(snapshot)`. A machine review must supply
   specific evidence for reader respect, entertainment/movement, voice, independent
   angle, reporting honesty, through-line/escalation, evidence earning space, coherent
   satire and feedback application. Missing, empty or unresolved checks cannot approve.
   This is a structured qualitative judgment, not a score or a keyword novelty test.
4. The inserted review records its contract version. No new model calls, retry loops,
   model changes, budgets or credentials are introduced.
5. Older `workflow.ts` also pins the contract and passes it through all six stages in
   `model.ts`, including revision and fresh review. Already-pinned jobs keep their old
   instructions. Legacy contracts without review checks retain their old schema.

## Boundaries and rollout prerequisites

**Source changes are not a deployment or an expansion of publication authority.** The
reachable `sharedDesk` inserts into `brief_global_live_posts` after machine approval.
It has no per-post owner-approval receipt. Cody explicitly exempted scheduled Sunday
Live Desk posts from per-post approval on October 17; he distinguished those posts from
matchup copy. That limited existing authority does not extend to full articles,
matchup copy, paid media, new spending or this patch's merge/deployment. Do not revive
the older blanket claim that every Live Desk post now needs an individual approval.

The capped path has no revision loop. It declines/rejects weak material rather than
spending indefinitely; the continuing-edit instruction does not create a post-approval
editing system. The older workflow's two-revision cap remains unchanged.

`brief-sunday-engine/model.ts` is legacy: its imported generators are not called by the
reachable `Deno.serve` branch. Do not reactivate it as an alternate culture-free path.
`lib/newsroom-context.js` composes canonical identity and local relationships but is not
loaded by this shared worker. Saved ChatGPT correspondent conversations, long-form
manual work, visual/audio generation and existing articles are not automatically updated.
This patch does not deploy the worker or update historical correspondent conversations.
The five active writing/discovery task prompts were separately updated and read back;
the status and limits of that change are recorded below.

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

## November 7 feedback delivery audit

The [scoped feedback record](editorial-feedback/2026-11-07-chargers.md) contains both
verbatim Chargers feedback rounds and their article-specific versus room-wide meaning.
The human handoff adds a concrete preparation, draft, passage-specific review, rewrite
and revision-receipt loop. Prior founder voices, sport-centered selection and original
source/credit responsibilities remain in force.

### Saved instructions changed now

Five existing enabled tasks were updated and individually re-read on November 7 UTC:
Brief newsroom rotation, Scout original Brief stories, Thursday: new matchups and
previews, Thursday matchup script delivery, and Tuesday: results and recap reels.
The new prompt text matched the intended replacement in every read-back. Schedule,
timezone, enabled state and destination matched the pre-change values. No new task
was created. Paused legacy jobs and score-only tasks were not changed.

The prompts directly carry the new feedback, so delivery does not depend on this
unmerged documentation being present on main. They also request current canonical
sources instead of pinning the October 17 snapshot. Rotation and Scout remain
conversation/discovery, not unrequested full drafting. Each task keeps its existing
publication, spending and output scope. This is verified configuration; no later run
or improved article was established by the read-back.

### Proposed executable change

Contract `2026-11-07.1` supplies scoped learning, whole-piece development, evidence
earning space and coherent satire to every existing draft/review consumer. Four new
review dimensions join the original five. The `feedback-application` evidence field
is the compact receipt: actual applicable correction, passage changed, strength retained
and unresolved issue. If no prior correction or approved passage is supplied, record
that absence rather than inventing a history. The contract does not ingest chat
automatically; assignment-local corrections still must reach the packet.

All six writers retain their existing desk profiles; article-local jokes and endings
are deliberately absent from the executable common rules. Current jobs retain their
pinned contract. The schema and instructions of an older snapshot do not silently
acquire the new review requirements. No additional model calls, paid generation,
database tables or revision retries are introduced.

### Read-only production check

Supabase `brief-editorial-worker` was retrieved on November 7, 2026: ACTIVE function
version 21, updated October 25, using contract `2026-10-17.2`. The entrypoint calls
`sharedDesk`, whose actual draft and review both receive the old contract. Its
control is enabled, the worker cron is active, and the function enforces its Sunday
window. The legacy Sunday-engine cron is inactive. The latest three published-post
reviews (November 1) also record `2026-10-17.2`.

No function, control, cron, record or article was changed during that check. Thus
the new chat-task instructions are saved, but the deployed Live Desk still uses the
old contract. A merge alone will not establish a new Supabase deployment. A separately
authorized rollout must verify the actual function source/version and subsequent
review evidence before calling the code-side change operational.

### Verification and remaining proof

Focused fake-network/database tests cover both reachable and legacy consumers, all
six writers, every new required check, rejection when checks are missing/unverified,
old snapshot isolation, revision limits and spending caps. These are software delivery
tests, not a blind judgment of prose or a claim that code can measure humor.

No real generation or article publication was performed for this change. A next
authorized piece and Cody's response must demonstrate whether the learning improves
the writing. Full application CI/build results should be read from the exact PR head;
focused tests must never be described as a full application pass.


