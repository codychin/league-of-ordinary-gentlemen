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
Article/homepage correspondent packages use one shared inline-video presentation. New correspondent videos must inherit the Sabine/Maracana container and control policy rather than introducing browser-specific player UX. Inline players use playsInline, suppress fullscreen/remote-playback/download/PiP controls where the browser honors controlsList, and keep duration in the package label. Source-specific framing may be adjusted with scoped CSS, but player behavior is shared.
