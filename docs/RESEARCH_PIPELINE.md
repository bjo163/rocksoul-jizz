# Research Pipeline

JIZZ uses the same simple staging principle as MFTL: discovery automation creates leads, not truth.

```text
TOPICS
  ↓
SCOUT
  ↓
GITHUB RESEARCH ISSUE
  ↓
STEWARD
  ↓
CANDIDATE
  ↓
SOURCE INSPECTION
  ↓
SOURCE + OBSERVATION
  ↓
PHENOMENON
  ↓
PERSPECTIVE + FRAMING + REACTION
  ↓
SIGNAL + CHANGE
  ↓
SNAPSHOT + INSIGHT
  ↓
INDEX
```

## Automatic portion

The scheduled loop stops here:

```text
DISCOVERED
   ↓
NEEDS_SOURCES
```

Scout and Steward may not promote discovery metadata into canonical observations.

## Candidate lifecycle

```text
discovered
    ↓
needs_sources
    ↓
ready_for_observation
    ↓
merged

or

rejected
```

A merged candidate remains in history so the path from discovery to canonical perspective data stays auditable.

## Issue-first canonical gate

Every `LIVE_RESEARCH` phenomenon must have a parent GitHub research issue before live canonical records are promoted.

```text
DISCOVERY / CURATOR LEAD
        ↓
GITHUB RESEARCH ISSUE
        ↓
SOURCE INSPECTION
        ↓
CANDIDATE / REVIEWABLE EXTRACTION
        ↓
LIVE_RESEARCH
```

This applies to both automated and manually initiated research. CI rejects any `data/live/*.json` bundle that lacks a `research_issue` lineage object.

The first live AI/workforce corpus was created during frontend bootstrap before this rule was enforced; issue #3 records that bootstrap lineage as an explicit backfill. Future live records are not allowed to bypass the issue gate.

## Canonical extraction

Once a source is actually inspected:

1. create/reuse SOURCE;
2. extract source-scoped OBSERVATION;
3. resolve/create PHENOMENON;
4. create PERSPECTIVE only if the observed material supports an actor/context view;
5. create FRAMING and REACTION only when support is explicit;
6. preserve time, language, geography, provenance, and uncertainty;
7. run analytics only after raw perspective records exist.

Never:

```text
ARTICLE METADATA → PERSPECTIVE TRUTH
ARTICLE COUNT    → PUBLIC CONSENSUS
```

## Index

`scripts/build-index.mjs` generates `data/indexes/research-index.json` from candidates and configured research lanes. The index is derived and rebuildable.
