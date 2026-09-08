# Research Pipeline

Target research flow:

```text
DISCOVER
  ↓
INGEST
  ↓
NORMALIZE
  ↓
DE-DUPLICATE
  ↓
EXTRACT OBSERVATION
  ↓
RESOLVE PHENOMENON
  ↓
EXTRACT PERSPECTIVE
  ↓
EXTRACT FRAMING
  ↓
EXTRACT REACTION
  ↓
DETECT SIGNAL
  ↓
CALCULATE CHANGE
  ↓
GENERATE SNAPSHOT
  ↓
GENERATE INSIGHT
  ↓
PROVENANCE AUDIT
  ↓
INDEX
```

Never:

```text
RAW CONTENT → TRUTH
```

## Stage rules

**Discover / ingest** preserve acquisition metadata and freshness.

**Normalize / de-duplicate** remove transport duplication without merging identities based only on superficial similarity.

**Observation extraction** records what was observed, not an asserted universal fact.

**Phenomenon resolution** groups relevant observations while retaining uncertainty and external references.

**Perspective / framing / reaction extraction** remains source- and actor-scoped.

**Signal / change / snapshot / insight** are derived and must identify method + inputs.

**Provenance audit** runs before an analysis record is accepted into a release-quality corpus.

## Freshness

Acquisition state may be `FRESH`, `AGING`, `STALE`, or `UNAVAILABLE`. Freshness says how current/retrievable the research source is; it does not say whether the source is correct.
