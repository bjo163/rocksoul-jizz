# Schema Contract

All JIZZ schemas use JSON Schema Draft 2020-12 and carry an explicit `x-jizz-schema-version`.

## v0.1 record versions

```text
jizz.common.v0.1
jizz.source.v0.1
jizz.observation.v0.1
jizz.phenomenon.v0.1
jizz.perspective.v0.1
jizz.framing.v0.1
jizz.reaction.v0.1
jizz.signal.v0.1
jizz.change.v0.1
jizz.snapshot.v0.1
jizz.trend.v0.1
jizz.pattern.v0.1
jizz.insight.v0.1
jizz.foreign-reference.v0.1
jizz.cross-repo-reference.v0.1
jizz.provenance.v0.1
jizz.research-run.v0.1
jizz.methodology.v0.1
```

Persisted records include `schema_version`. Incompatible changes require a new version and an explicit migration path; persisted records must never be silently reinterpreted.

## Structural convention

Where applicable records converge on:

```text
schema_version
id
record_type
domain
metadata
provenance
timestamps
external references
uncertainty / confidence
```

Semantic payloads remain domain-specific.

## Validation layers

Local CI validates:

1. schema documents are parseable Draft 2020-12 contracts;
2. required schema/doc files exist;
3. record IDs are unique;
4. local reference graphs are intact;
5. temporal intervals are coherent;
6. derived snapshots reconstruct from raw temporal records;
7. provenance chains resolve locally;
8. qualified namespaces are bounded;
9. anti-overlap structures do not appear in implementation/data.

External repository availability is not required to compile or validate JIZZ locally.
