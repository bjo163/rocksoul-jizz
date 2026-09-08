# Schema Contract

All JIZZ machine contracts use JSON Schema Draft 2020-12 and explicit schema versions.

## Canonical and derived contracts

```text
SOURCE
OBSERVATION
PHENOMENON
PERSPECTIVE
FRAMING
REACTION
SIGNAL
CHANGE
PERSPECTIVE_SNAPSHOT
TREND
PATTERN
INSIGHT
FOREIGN_REFERENCE
CROSS_REPO_REFERENCE
PROVENANCE
RESEARCH_RUN
METHODOLOGY
```

## Research staging contracts

```text
DISCOVERY_CANDIDATE
RESEARCH_TOPICS
RESEARCH_INDEX
```

`DISCOVERY_CANDIDATE` is intentionally outside canonical perspective data. Its source entries use `authority: discovery_only` until the underlying source is inspected.

## Version policy

Persisted records carry a schema version. Incompatible semantic changes require a new version and explicit migration; historical records must not be silently reinterpreted.

## Validation

CI checks:

1. schema files use Draft 2020-12;
2. required docs/contracts exist;
3. Scout topic configuration validates;
4. every candidate validates;
5. candidate IDs are unique;
6. `needs_sources` candidates cannot contain promoted source authority;
7. research index matches candidate count;
8. local perspective graph references remain intact;
9. historical snapshots remain reconstructable;
10. anti-overlap rules remain intact.

External ROCKSOUL repositories are not required for local compilation.
