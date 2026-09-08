<div align="center">

# JIZZ

## JUXTAPOSE · INTELLIGENCE · ZIGZAG · ZONE

### MULTI-PERSPECTIVE INTELLIGENCE

**THE WORLD, FROM EVERY ANGLE.**

</div>

---

> **JIZZ OWNS THE VIEW. NOT THE THING.**

JIZZ is the ROCKSOUL multi-perspective intelligence observatory. It records how a phenomenon is being seen, framed, discussed, and reacted to; compares angles side-by-side; detects shifts over time; and produces explainable derived intelligence without claiming ownership of the underlying TEXT, STORY, EVENT, PERSON, LAW, or reviewed cross-domain RELATIONSHIP.

## Core question

> **HOW IS THE WORLD SEEING IT?**

```text
SOURCE
  ↓
OBSERVATION
  ↓
PHENOMENON
  ↓
PERSPECTIVE
  ↓
FRAMING / REACTION
  ↓
SIGNAL
  ↓
CHANGE
  ↓
PERSPECTIVE SNAPSHOT
  ↓
INSIGHT
```

## ROCKSOUL ownership map

| Domain | Canonical owner | Question |
|---|---|---|
| TEXT | rocksoul-rgbl | What does the exact source text say? |
| STORY | rocksoul-mftl | What was told? |
| EVENT | rocksoul-legend | What happened? |
| PERSON | rocksoul-superhero | Who was involved? |
| LAW | rocksoul-aws | What law applies? |
| RELATIONSHIP | rocksoul-correlation | How do canonical records relate? |
| **PERSPECTIVE** | **rocksoul-jizz** | **How is the world seeing it?** |

Product ownership stays separate: DESIGN → rocksoul-assets, UI → rocksoul-ui, WEB → rocksoul-web, COMMUNITY → rocksoul-community, ADMIN → rocksoul-platform, CONSOLE → rocksoul-crayon.

## Automatic research

JIZZ now uses the same simple research-staging pattern as MFTL:

```text
TOPICS
  ↓
GDELT SCOUT
  ↓
[AUTO-RESEARCH] ISSUE
  ↓
JIZZ STEWARD
  ↓
data/candidates/
  ↓
SOURCE INSPECTION
  ↓
SOURCE + OBSERVATION
  ↓
PHENOMENON + PERSPECTIVE
```

The automation runs daily at **09:17 Asia/Jakarta**. It may discover, score, de-duplicate, open issues, and stage `needs_sources` candidates. It **cannot automatically mint canonical perspective data**.

Research configuration:

```text
data/research-scout/topics.json
```

Current lanes cover AI/workforce discourse, technology regulation, cost of living, climate policy, science/health, geopolitics, and digital culture.

Manual commands:

```bash
npm run research:dry
npm run research:scout
npm run research:steward
npm run index
```

See [Automatic Research](docs/AUTOMATIC_RESEARCH.md), [Automation](docs/AUTOMATION.md), and [Research Policy](docs/RESEARCH_POLICY.md).

## Canonical local ontology

```text
SOURCE
OBSERVATION
PHENOMENON
PERSPECTIVE
FRAMING
REACTION
SIGNAL
CHANGE

Derived:
PERSPECTIVE_SNAPSHOT
TREND
PATTERN
INSIGHT

Interop:
FOREIGN_REFERENCE
CROSS_REPO_REFERENCE

Provenance:
PROVENANCE
RESEARCH_RUN
METHODOLOGY
```

JIZZ deliberately does not use CLAIM as its core abstraction. An observation preserves what was observed without promoting it into a universal fact claim.

## Brand ↔ function

- **JUXTAPOSE** — compare perspectives side-by-side.
- **INTELLIGENCE** — transform observations into explainable, traceable analysis.
- **ZIGZAG** — detect perspective, framing, reaction, attention, actor, and geographic shifts.
- **ZONE** — preserve the context where a perspective exists.

```text
OBSERVE.
JUXTAPOSE.
DETECT THE ZIGZAG.
BUILD INTELLIGENCE.
```

## Quick start

Requires Node.js 22+.

```bash
npm install
npm run ci
npm run start
```

Default server: `http://127.0.0.1:8787`.

Core endpoints:

```text
GET /health
GET /phenomena/:id
GET /phenomena/:id/observations
GET /phenomena/:id/perspectives
GET /phenomena/:id/framings
GET /phenomena/:id/reactions
GET /phenomena/:id/signals
GET /phenomena/:id/changes
GET /phenomena/:id/snapshots
GET /phenomena/:id/insights
GET /phenomena/:id/foreign-references
```

## Golden example

`data/golden/ai-workforce-reduction.json` is a synthetic traceable fixture. It remains a test/teaching case; automatic research candidates live separately under `data/candidates/`.

## Guardrails

```text
OBSERVATION ≠ FACT
PERSPECTIVE ≠ TRUTH
FRAMING ≠ STORY
REACTION ≠ EVENT
ACTOR_REFERENCE ≠ PERSON OWNERSHIP
TEXT_REFERENCE ≠ TEXT OWNERSHIP
LEGAL_PERSPECTIVE ≠ LEGAL VERDICT
SIGNAL ≠ FACT
TREND ≠ HISTORICAL TRUTH
CORRELATION ≠ JIZZ
```

No truth score, winning perspective, world verdict, or universal correct view exists.

## Documentation

- [Domain](docs/DOMAIN.md)
- [Data model](docs/DATA_MODEL.md)
- [Schema](docs/SCHEMA.md)
- [Boundaries](docs/BOUNDARIES.md)
- [Anti-overlap](docs/ANTI_OVERLAP.md)
- [Interoperability](docs/INTEROP.md)
- [Provenance](docs/PROVENANCE.md)
- [Analytics](docs/ANALYTICS.md)
- [Research pipeline](docs/RESEARCH_PIPELINE.md)
- [Automatic research](docs/AUTOMATIC_RESEARCH.md)
- [Automation](docs/AUTOMATION.md)
- [Research policy](docs/RESEARCH_POLICY.md)
- [API](docs/API.md)
- [Testing](docs/TESTING.md)
- [Vocabulary](docs/VOCABULARY.md)
- [Common contract](docs/COMMON_CONTRACT.md)

---

<div align="center">

### READ THE ROOM. SEE THE SHIFT. WATCH THE SIGNAL.

**JIZZ — THE WORLD, FROM EVERY ANGLE.**

</div>
