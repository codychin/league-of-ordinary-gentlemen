# The Brief — Canonical speech and video production standard

**Status:** Proposed production contract; implementation gates are not yet wired to every generation provider. **Owner:** Dashiell (editorial production), Ellis (engineering); Cody (final editorial approval).

## Scope and sources of truth

- Use `data/voice-pronunciation-canon.json` for the shared pronunciation lexicon. It applies to **all six correspondents and every league**.
- Preserve actual written spellings in scripts, captions and article copy. Render-time substitution / SSML / provider dictionary handles speech.
- Read `docs/brief-video-performance-guide.md` for house cadence and the existing Maude/Hollis/Sabine performance exemplars. This document supplements, not replaces, them.
- Store audio references with review provenance before labeling anything *audio approved*. Phonetic confirmation alone is not proof a synthesized voice works.

## Correspondent delivery bibles (initial editorial baselines)

| Speaker | Rhythmic signature | Acceleration | Pauses / emphasis | Avoid |
| --- | --- | --- | --- | --- |
| Maude Gannon | Fast tactical explanation; clips complex football into clear beats | Mechanism, protection adjustments, the implication of a stat | Deliberate beat before a reversal; snap-to emphasis on the actual football decision | Generic sportscaster crescendos, numerals sounding recited |
| Hollis Crane | Long rolling observations interrupted by quiet, prosecutorial clarity | Catalogs of strange particular details | Loose, tired patience before the final knife; 5–10% slower than current default when appropriate | Comedy-host wait for laughter, repeated dramatic final sentences |
| Conrad Sorrell | Polished clauses, controlled acidity, a developing thesis | When laying out hypocrisy or a chain of incentives | A half-beat of weariness at inevitable proof; punchline often an afterthought | Shouting, editorializing every word, chopped one-liners |
| Marnie Kells | Crisp cultural observation with effortless deadpan | Setup, incongruous connections, internet behavior | Give the most ridiculous true detail its own modest space; stop early | Wacky-news voice, repeating a name with inconsistent stress, artificial hilarity |
| Sabine March | Measured, socially observant, low pitch, emotionally economical | Confident rhythmic lists | Light shelf for dry correction; underplay institutional absurdity | British accent, affectless monotone, overperformed jokes |
| Dashiell Pike | Quiet cost-accounting, informed and pragmatic | Sequence of incentives, mechanisms and downstream consequences | Controlled slowdown for the decision or hidden cost | TED-talk certainty, boardroom motivational speech, nonstop sarcastic affect |

Do not infer fixed speech rates or precise pause durations from these prose rules. Approved clips should later establish a **versioned per-speaker audio baseline**, including provider voice ID, speed/pitch parameters and documented approved examples. Compare future changes to a baseline and preserve successful settings.

## Required low-cost preflight (before any paid render)

1. **Scope and approvals.** Identify league or global content, specific speaker, script version, pronunciation lexicon version, and the exact approval state for script, audio, and publication separately.
2. **Dictionary coverage.** Find every named entity, compare against the canon and unresolved-name list; no unknown name may be silently guessed or auto-replaced with a different lexical name. A correction updates one entry without deleting others.
3. **Audio proof.** Generate only a short provider audio sample where audio is needed, reuse approved samples when available, and check names, connected-speech cadence, stress, pauses and numerals. Record human/editor sign-off. If the provider offers no audio-only preview, use the cheapest bounded equivalent with a cost ceiling.
4. **Visual sanity.** Select from an approved scene bank per correspondent and prevent repeated backgrounds in an editorial batch. Explicitly rule out cars **inside** stadiums, implausible traffic, morphing props, unnaturally synchronized crowds, and physically inconsistent object paths. Diverse scenes are a preference, believable scenes a requirement.
5. **Render.** Generate only after the low-cost checks pass. Record provider job ID, prompt/profile/lexicon versions, anticipated cost, retry count and source assets.
6. **Post-render QA.** Check pronunciation and delivery from the actual video audio, visual plausibility, mouth sync, continuity and captions. Passing script validation is *not* passing rendered video QA.
7. **Publication.** Require explicit approval of the specific rendered asset. Publishing an earlier approved asset does not approve a new variation or authorize unlimited rerenders.

## Failure taxonomy and response

| Failure | First action | Do not |
| --- | --- | --- |
| Name spoken wrong | Correct canonical mapping/audio, re-run **short audio proof** | Re-render full video repeatedly before verification |
| Awkward pause/rhythm | Refine speaker-specific thought units and sample | Change unrelated pronunciation entries |
| Visual hallucination | Change shot/background motion constraints, validate scene | Treat this as a lexicon failure |
| Voice identity drift | Compare voice ID, pitch, speed and approved baseline | Quietly replace a known-good voice |
| Publishing or tenant mismatch | Stop; verify scope and content/asset IDs | Post a global reel to a local league without approval |

## Cost and quality instrumentation

Track by correspondent, league and provider: attempted renders, publishable renders, full-render retries, short audio probes, defects by category, actual vendor credits or dollars, and **cost per publishable asset**. The key quotient is approved publishable assets / paid full renders; never claim an improvement until actual runs establish it. Budget-limit retries (default: one full rerender, further rerenders need editor approval).

## Adoption criteria

- Preflight fails closed on missing/unverified pronunciation for important names and missing approval metadata.
- Every render retains a specific voice profile version and glossary version.
- Two successive releases demonstrate no repeated known pronunciation regression; test across correspondents and at least two leagues.
- No change to a global speaker profile may silently alter a league-local roster or publication scope.
- No new voice is declared canonical merely because one synthetic sample sounds plausible.

## Next integration points

Map the actual HeyGen generation entry point(s) to this standard, wire pronunciation coverage and approval metadata into the provider request, store approved audio references, and add automated checks. This document and the JSON canon **do not by themselves enforce runtime controls**.
