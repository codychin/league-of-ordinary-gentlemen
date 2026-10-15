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
