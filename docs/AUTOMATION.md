# JIZZ Steward Automation

JIZZ follows a simple MFTL-style automation on `main`:

```text
TOPICS
  ↓
SCOUT
  ↓
RESEARCH ISSUE
  ↓
STEWARD TRIAGE
  ↓
NEEDS_SOURCES CANDIDATE
  ↓
VALIDATE + INDEX + TEST
```

## Scout

`scripts/research-scout.mjs`:

- rotates configured queries;
- searches GDELT DOC 2.0;
- normalizes article metadata;
- scores completeness;
- fingerprints and de-duplicates prior issues;
- opens at most a small number of `[AUTO-RESEARCH]` issues.

## Steward

`scripts/research-steward.mjs`:

- reviews only newly discovered auto-research issues;
- checks duplicate titles against repository data;
- performs a small deterministic score;
- records `duplicate`, `hold`, `needs_sources`, or `stage_candidate`;
- writes only `needs_sources` candidates when the lead clears the gate.

## Canonical boundary

No scheduled step promotes a candidate to SOURCE, OBSERVATION, PHENOMENON, PERSPECTIVE, FRAMING, or REACTION.

That promotion requires actual source inspection and provenance-bearing extraction.

## Workflow

`.github/workflows/automatic-research.yml` runs daily at 09:17 Asia/Jakarta. If Steward creates candidate files, the workflow validates them, rebuilds the research index, and commits only candidate/index changes.

## Hourly Steward cadence

JIZZ has two different automation layers and they must not be conflated:

```text
JIZZ STEWARD
→ hourly
→ intelligence / queue / change review
→ may act on routed leads, open research work, source changes, and perspective-state changes

GDELT SCOUT
→ daily scheduled discovery fallback
→ broad public-discourse lead discovery
→ discovery metadata only
```

The Steward is hourly because PERSPECTIVE is ROCKSOUL's highest-velocity research domain. The Scout does not need to perform a full broad crawl every hour.

Every hourly Steward run obeys a no-op guard:

```text
NO meaningful new source
AND NO routed lead
AND NO queue item
AND NO freshness change
AND NO perspective development
→ NO_UPDATE
```

Hourly execution must not manufacture activity. It exists to reduce detection latency for real PERSPECTIVE changes.

Correlation remains downstream and event-driven:

```text
PERSPECTIVE change
→ possible relationship candidate
→ Correlation review queue
→ reviewed RELATIONSHIP only after support/counterevidence/provenance review
```

High-frequency observation does not imply high-frequency edge publication.


## Ecosystem bootstrap mode

JIZZ's hourly Steward is now part of the ecosystem-wide **BOOTSTRAP** topology defined canonically in `rocksoul-crayon/contracts/research-steward-topology.v1.json`.

All five scheduled intelligence slots run hourly while the research corpus is still sparse:

```text
:00  Ecosystem Bootstrap   → CRAYON
:10  Story-History         → MFTL / LEGEND isolated passes
:20  Attestation           → RGBL / SUPERHERO isolated passes
:30  LAW                   → AWS
:40  PERSPECTIVE           → JIZZ
```

JIZZ receives the largest per-run discovery allowance because PERSPECTIVE is the highest-velocity domain. When queues are thin, the Steward may actively triage up to two strong non-duplicate perspective leads per run, preferring diversity across actor classes, geographies, languages, framings, reactions, and phenomena.

The separate GDELT Scout remains a daily broad-discovery fallback. Hourly JIZZ does not require a full broad crawl every hour.

Bootstrap does not weaken the canonical boundary:

```text
DISCOVERY
→ issue / needs_sources candidate
→ source inspection
→ provenance-bearing extraction
→ canonical JIZZ records

NOT:
internet → AI → truth
```

Correlation remains event-driven downstream.
