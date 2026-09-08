# ROCKSOUL Common Contract

ROCKSOUL repositories need compatible structural conventions, not identical semantics.

```text
ROCKSOUL COMMON CONTRACT
          ↓
DOMAIN-SPECIFIC SCHEMAS
```

## Shared structural concepts

Where practical:

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

JIZZ uses `domain: PERSPECTIVE` for local records and explicit record-level schema versions.

## Compatibility policy

The ecosystem contains multiple schema generations. JIZZ therefore follows:

> **COMPATIBILITY > DESTRUCTIVE UNIFICATION**

JIZZ v0.1 uses Draft 2020-12, but it does not require neighboring repositories to rewrite older contracts merely to match it.

Cross-repository compatibility happens through qualified identifiers, explicit repository/domain ownership, reference resolution state, provenance, and documented migrations.

## Versioning

Breaking semantic changes require a new schema identifier/version. Migrations must preserve the ability to interpret prior persisted records and reconstruct historical analysis.

## Ownership contract

Structural convergence must never erase domain ownership:

```text
RGBL        = TEXT
MFTL        = STORY
LEGEND      = EVENT
SUPERHERO   = PERSON
AWS         = LAW
CORRELATION = RELATIONSHIP
JIZZ        = PERSPECTIVE
```
