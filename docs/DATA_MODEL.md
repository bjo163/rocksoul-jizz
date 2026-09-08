# Data Model

JIZZ uses small domain-specific record families rather than a universal world-object table.

## Canonical records

### SOURCE
Where an observation originates. Source freshness and retrieval state are recorded, but source freshness is not truth.

### OBSERVATION
Something observed from a source at a point in time. The record preserves source linkage, phenomenon linkage, actor/subject references, raw locator metadata, language, geography, and provenance.

### PHENOMENON
A clustering subject for observations and perspectives.

### PERSPECTIVE
The core JIZZ record: actor + context + position + framing references + time + evidence trail.

### FRAMING
The angle from which the phenomenon is presented. Supported dimensions include economic, political, security, humanitarian, technological, scientific, cultural, religious, environmental, legal, social, ethical, historical, identity, local, and global.

### REACTION
Observed response such as support, criticism, rejection, amplification, satire, boycott, adoption, warning, correction, defense, questioning, or silence.

### SIGNAL
A derived pattern such as emergence, surge, decline, revival, divergence, convergence, mutation, spread, fragmentation, or recurrence. Signals require inputs, methodology, version, confidence, and timestamp.

### CHANGE
A derived comparison between temporal states. Dimensions can include volume, velocity, geography, framing, position, actor/source/perspective diversity, disagreement, and convergence.

## Derived records

`PERSPECTIVE_SNAPSHOT` captures the state of the perspective field at a time. `TREND`, `PATTERN`, and `INSIGHT` interpret measured signal/change while retaining derivation references.

Derived records are rebuildable analysis, not raw truth.

## Interoperability

`FOREIGN_REFERENCE` stores a qualified pointer to an owning repository. `CROSS_REPO_REFERENCE` attaches such a pointer to a JIZZ-local record for subject, actor, context, or correlation-pointer use.

Reference resolution is explicit; same spelling, same URL, same title, keyword similarity, or embedding similarity is insufficient for identity.

## Relational target

`db/001_initial.sql` defines normalized tables:

```text
sources
observations
phenomena
perspectives
perspective_observations
framings
reactions
reaction_observations
signals
signal_observations
changes

perspective_snapshots
trends
patterns
insights

foreign_references
cross_repo_references

provenance
research_runs
methodologies
```

JSON/JSONL fixtures are repository-portable research artifacts; relational storage is an operational projection and must not silently mutate semantic history.
