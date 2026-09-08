# Anti-Overlap Contract

JIZZ is complete only when it can answer **HOW IS THE WORLD SEEING IT?** without taking ownership of the underlying object.

## JIZZ vs RGBL

RGBL owns exact TEXT, work/expression/edition/passage identity, textual assertions, and textual provenance.

JIZZ may record that a source discusses or interprets a text and may qualify a pointer to an RGBL record. It must not define the exact canonical passage or decide what the text authoritatively means.

## JIZZ vs MFTL

MFTL owns STORY / NARRATIVE / MYTH / BELIEF / PRACTICE and narrative integrity.

JIZZ may observe narrative framing and public discourse. It must not mint a canonical narrative identity merely because a framing recurs.

## JIZZ vs LEGEND

LEGEND owns EVENT, historical core, historicity, event evidence, time/place, and event relationships.

JIZZ may measure attention, framing, geographic perception, and reaction around an event. A reaction record is not an event record.

## JIZZ vs SUPERHERO

SUPERHERO owns PERSON, agency, participation, witnessing, authorship, reporting, transmission, translation, interpretation, proximity, and chain of custody.

JIZZ uses actor references and actor types. Same-name actors must not automatically merge, and actor references do not establish canonical person identity.

## JIZZ vs AWS

AWS owns LAW, jurisdiction, legal authority, applicability, legal analysis, legal result, and legal source history.

JIZZ may observe public legal discourse or perceived legal impact. It must never convert public opinion into a legal verdict.

## JIZZ vs ROCKSOUL-CORRELATION

Correlation owns reviewed cross-domain relationship edges, relation semantics, support, counterevidence, alternative explanations, confidence, epistemic status, and reference resolution.

JIZZ owns perspective A, perspective B, perspective C, and measured change between perspective states. Comparing viewpoints does not make JIZZ a second global correlation graph.

```text
CORRELATION = RELATIONSHIP
JIZZ        = PERSPECTIVE
```

## CI drift guards

The implementation/data validator rejects accidental local structures named like:

```text
canonical_events
canonical_people
canonical_stories
scripture_registry
legal_verdicts
historicity_registry
authorship_registry
global_correlation_graph
```

Those names are diagnostic red flags, not JIZZ schema families.
