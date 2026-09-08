# Provenance

Derived intelligence must remain traceable.

```text
INSIGHT
   ↓
CHANGE / SIGNAL
   ↓
OBSERVATION
   ↓
SOURCE
```

## Required derived metadata

Signals, changes, snapshots, patterns, trends, and insights carry enough information to identify:

```text
inputs
methodology
algorithm/version
confidence
coverage (where applicable)
generated_at / timestamp
provenance
```

## Research runs

`RESEARCH_RUN` records bound acquisition/analysis work. `METHODOLOGY` records formulas, normalization, expected inputs, and method version. `PROVENANCE` joins raw and derived records to a research run.

## Raw-reference policy

Observation `raw_reference` stores a locator and optional note. It is not a replacement for an owned exact-text corpus. When exact text matters, JIZZ should point to the relevant owning text record rather than becoming a duplicate text archive.

## Mutation policy

Historical observations and perspectives are not overwritten. Corrections should append a new record/version or close a validity interval while retaining prior state, so old snapshots remain reconstructable.
