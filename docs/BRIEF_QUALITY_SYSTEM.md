# The Brief Quality System

Every Cody intervention must produce two outcomes:
1. Fix the current artifact.
2. Make the same class of failure less likely to recur.

## Quality loop
Evidence -> Canon/rules load -> Generate -> Automated QA -> Cheapest repair/kill -> Final QA -> Publish -> Feedback -> Learning store.

## Durable stores
- brief_feedback: raw + structured Cody feedback.
- brief_rules: scoped candidate/active/locked rules.
- brief_canonical_assets: portraits, voices, pronunciation assets, gold-standard work.
- brief_artifact_evaluations: machine QA, repair plan, cost, Cody judgment.

## Scope
Feedback is artifact-, desk-, or global-scoped. A revision is a PATCH: every unmentioned approved component is immutable.

## Regression
Violation of a locked rule is a REGRESSION, more severe than a novel failure. Repeated failures increment violation_count and should block autonomous publication.

## Video gates
PREMIUM VIDEO MAY NOT START until:
- script locked
- canonical identity loaded
- canonical voice/performance audio generated
- pronunciation QA passed
- audio duration/end padding passed
- scene requirements + preserve list recorded

POST-VIDEO QA:
- identity continuity
- supplied audio/transcript continuity
- pronunciation
- eyeline/performance
- camera motion vs requested shot
- required/forbidden signage text
- semantic background population
- human scale/perspective
- temporal/physical causality
- ending completeness

A local failure triggers the cheapest local repair. Full rerender is reserved for fundamental performance/scene failure.

## Editorial gates
- facts/evidence
- multi-domain connection
- novelty vs prior premise
- development vs repetition
- desk fit/voice
- Brief-worthiness
- redundancy
- factual final pass

Scores/projections are context, not story theses.

## Autonomy metrics
Track:
- first-pass acceptance
- Cody override rate
- recurring regression count
- machine-caught defects
- Cody-found defects missed by QA
- generations per published video
- credits per published video
- duplicate-premise rate
- post-publication corrections

Graduation path: SUPERVISED -> SHADOW AUTONOMY -> AUTONOMOUS.

## Editorial inline video standard
The proven Sabine/Maracana homepage video implementation is canonical. Reuse its native inline video markup and surrounding package structure exactly before applying only source-specific framing CSS. Do not replace it with a new custom player or alter Sabine while adapting another correspondent. Sabine/Maracana is the regression fixture: changes to editorial video must preserve its behavior exactly.

## Correspondent visual canon
The editor-approved visual identity boards dated 2026-09-28 are authoritative character references for Sabine March, Conrad Sorrell, Maude Gannon, Dashiell Pike, Marnie Kells, and Hollis Crane. The incidental/generated copy printed on those boards is not editorial canon. Their people are canon: face, hair, approximate age, build/proportions, grooming, posture, gesture vocabulary, wardrobe range, accessories, and overall presence. Image/video generation must begin from the relevant approved board or extracted approved references; prose-only recreation is not sufficient when a visual reference can be supplied. Preserve variation within identity: wardrobe and setting may change contextually, but the person must remain recognizably the same character. New correspondents must graduate through an editor-approved visual-canon stage before autonomous production. Marnie's 2026-09-28 board is authoritative over earlier extrapolated styling where they conflict.
