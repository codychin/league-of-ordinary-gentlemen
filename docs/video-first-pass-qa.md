# The Brief — First-pass video production and QA

## North star
First render should be publishable, not a starting point. Make established corrections part of preflight, NOT after-the-fact reviewer feedback. Maintain distinct Maude/Hollis/Conrad/Marnie/Sabine/Dashiell voices per docs/brief-video-performance-guide.md.

## Locked pronunciation and delivery dictionary
- Tetairoa McMillan: **Tet McMillan** in spoken scripts.
- Mohsin: **Moe** in spoken scripts when referencing this league participant.
- Nipun: nih-POON (rhymes with bassoon).
- Romeo Doubs: DOBBS.
- Zay Flowers and Zaywatch: ZAY rhymes with day.
- Kyle Monangai: muh-NUN-gai; approved fallback written **Monongai** only if needed for speech.
- Puka Nacua: use approved natural full-name delivery, never phonetic letters spoken aloud.
- Isaiah Likely: proper name **Isaiah Likely**; avoid syntactic contexts where “likely” sounds like an adjective.
- Jahmyr Gibbs: juh-MEER; Malik Nabers: muh-LEEK.
- Maude says ROOT, not ROWT, for route.
- For ambiguous names, render short audio-only pronunciation test before expensive video production and compare against the approved reference.
- Never insert visible or spoken phonetic spelling, duplicated syllables, phonetic markup, or unnatural letter-by-letter pronunciations.

## Script and editorial preflight
1. Check original evidence, league selection, current matchup facts, lore, injuries, results, and week.
2. Review for real insight, scene-specific absurdity, distinct author voice, and a genuinely effective closing beat. Avoid generic filler, mechanic recap structure, and repetitive stock metaphors.
3. Remove sign-offs and obvious explanations. Scripts must sound spoken, not read.
4. Run spoken-name dictionary; confirm explicit proper-name context, cadence, and speed.
5. Freeze approved script and voice settings before expensive rendering. No silent script substitution.

### Editorial rejection gate — evidence before acceptance

Cody's October 27, 2026 rejection applies to the whole Week 7 recap-script packet: accurate score readouts with interchangeable personalities are failed scripts, not approval-ready work. The existing preflight already forbids mechanical recaps; the failure was acceptance without passage-level proof. The October 23 qualified approval of an improved batch did not authorize lowering the bar or automatic approval.

Before calling a batch ready, the reviewer reads the actual spoken copy beside the relevant prior script and source evidence, not just its thesis metadata. Reject and return for rewriting when:

- The script's only movement is scorer list → positional comparison → arithmetic explanation → detachable wry line. A correct calculation or colorful closing noun does not make this a story.
- Removing byline and cosmetic vocabulary leaves no meaningful difference in what this correspondent notices, doubts, pursues or changes their mind about. Do not enforce six catchphrases or six fixed narrative templates instead; the performance guide's cadence examples are not compulsory story structures.
- The claimed hinge cannot be demonstrated with a specific passage, or the rest of the script abandons that hinge to enumerate results. Each retained number must materially change the observation, not merely authenticate a recap.
- Its human interpretation requires invented intention, private behavior, manager philosophy or pre-lock certainty. Outcome evidence does not establish what was knowable at selection time.
- Another script in the batch uses substantially the same progression, comparison or punchline without a necessary independent reason. Compare the whole batch, not isolated pieces.

Keep a short review note showing the exact deficient passage and the substantive change required, or the actual passage that survives the challenge and why. Do not accept completed checklist fields, passing factual tests or a writer's self-description as evidence of voice. Bind approval to the exact script revision. Cody's explicit October 27 delegation of routine recap approval to Rika remains in force within its stated scope; this gate does not require Cody to approve every routine recap. His specific rejection means the rewritten October 27 Week 7 batch returns to Cody for review. Rejected copy cannot inherit prior approval, automatically graduate, or revive through a generic thumbs-up. Rendering spend and publication remain separate gates.

Regression comparison from the October 27 review handoff: the rejected contribution list ending “Several considerably less glamorous contributions” is still an inventory. In the approved predecessor described in that handoff, Roy's four new starters nearly equaled his opponent's whole lineup: the shopping-list observation develops from that comparison rather than decorating a tally. Another predecessor moves from winless to a win with eight ordinary useful starters, allowing Hollis to discover the exotic experience of an uneventful victory. These predecessor descriptions are construction summaries, not verbatim quotations or instructions to reuse those endings. Compare the actual complete scripts during review; these examples do not certify a whole piece or supersede later founder feedback. Automated text checks can flag repetition and missing evidence; they cannot certify humor, originality or earned emotional movement.

### Where this gate is consumed

This is a reviewer procedure, not software enforcement. [The release contract's video feedback flywheel](release-contract.md#video-feedback-flywheel) requires this guide and the [performance guide](brief-video-performance-guide.md); [autonomous matchup release, hard gate 2](autonomous-matchup-release.md#hard-gates) points reviewers here for script QA. No repository runtime entrypoint imports or reads this Markdown. In particular, `supabase/functions/brief-editorial-worker/index.ts` calls `sharedDesk` in `shared.ts`, whose draft and review instructions come from `contract.ts`, not this guide. The reachable `brief-sunday-engine/index.ts` handler does not call its legacy generators. The recap packagers (`scripts/package-week4-recaps.py`, `scripts/package-week5-recaps.py`, `scripts/package-dashiell-recap.py`) consume JSON media sources, not these editorial instructions. Editing this guide does not update those prompts, saved correspondent conversations or external automation instructions, and does not prove that a reviewer applied it.

## Visual scene preflight
- Choose plausible, varied, inhabited real-life locations appropriate to the correspondent. Rotate locations/outfits while preserving visual identity.
- No vehicles driving through stadium seating or pitches; no impossible background paths or multiplying props.
- Keep hands empty by default; no distracting oversized microphones, disappearing objects, weird signage, unmotivated crowd movement, or artificial compositing.
- Sabine: restrained styling, lower-pitched American voice, **not** a British accent.
- Maude: clear smart football analysis, precise tactical language and diagram logic.
- Hollis: lived-in, gonzo, not a bland studio presenter.
- Dashiell: neutral American, confident systems analysis.
- Match final video crop to homepage feature slot and PWA/mobile viewport without cutting off heads or hands.

## Post-render gate
Automatable: verify media URL exists, video/audio streams decode, nonzero duration, dimensions/aspect, poster generated, first and last frames, silence/peaks where measurable, caption/manifest linkage, correct league/week, and no incorrect text asset path.

Human or visual-model required: name pronunciation, plausible motion/backgrounds, facial consistency, performance cadence, physical continuity, comedic impact, accurate factual framing, and safe crop. Failure blocks publication.

## Learning loop
Store correction with {clip_id, correspondent, league, revision, defect_category, observed_failure, corrected_rule, approved_reference, prompt_or_script_version, model_or_voice_version, final_approval}. A rule fixed for one clip becomes reusable global guidance unless it is explicitly unique to that clip. Before every batch, compare candidate against known failure categories and the latest approved examples.

Report: first-pass approval %, mean renders per published video, most common rejection causes, cost per approved clip. Lower review burden only after consistently strong first-pass results across several batches; do not mistake passing mechanical tests for creative approval.
