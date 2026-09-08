# Analytics Contract

JIZZ analytics are explainable and versioned. Every metric must expose formula, inputs, normalization, methodology version, and confidence where a confidence judgment is involved.

Current implementation version: `jizz.analytics.v0.1`.

## Metrics

| Metric | v0.1 formula |
|---|---|
| framing diversity | normalized Shannon entropy of active framing dimensions |
| disagreement | normalized Shannon entropy of active non-UNKNOWN positions |
| perspective diversity | distinct active framing+position signatures / active perspective count |
| actor diversity | distinct actor types / active perspective count |
| source diversity | distinct sources represented / cumulative observations through snapshot |
| geographic spread | distinct non-empty geographies / active perspective count |
| divergence | (framing diversity + disagreement) / 2 |
| convergence | 1 - divergence |

Raw counts remain alongside normalized metrics. No metric is a truth score.

## Signal rules

The v0.1 golden rule emits `FRAGMENTATION` when framing diversity, disagreement, and observation volume all increase between snapshots. `SPREAD` can be emitted when represented geography count increases.

These are declared analytical rules, not historical facts.

## ZIGZAG

ZIGZAG detects movement in:

```text
PERSPECTIVE_SHIFT
FRAMING_SHIFT
REACTION_SHIFT
ATTENTION_SHIFT
ACTOR_SHIFT
GEOGRAPHIC_SHIFT
```

A pattern is stored only with explicit inputs and methodology.

## Golden fixture

At T1 the synthetic AI workforce-reduction field contains 3 active perspectives. At T2 it contains 6. The reconstructed metrics show increased framing diversity and disagreement, lower convergence, and broader geography. The derived result is:

```text
SIGNAL: FRAGMENTATION
CHANGE: economic framing volume increased while consensus decreased
INSIGHT: The phenomenon is spreading faster than consensus is forming.
```

Every line is traceable to the fixture observations.
