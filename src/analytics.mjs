import { activeAt, distribution, observedBy } from "./model.mjs";

export const ANALYTICS_VERSION = "jizz.analytics.v0.1";

export const METRIC_FORMULAS = Object.freeze({
  framing_diversity: "Shannon entropy of active framing dimensions, normalized by ln(k)",
  disagreement: "Shannon entropy of active non-UNKNOWN positions, normalized by ln(k)",
  perspective_diversity: "distinct active framing+position signatures / active perspectives",
  source_diversity: "distinct sources represented by observations / observation count",
  actor_diversity: "distinct actor types / active perspectives",
  geographic_spread: "distinct non-empty geographies / active perspectives",
  divergence: "(framing_diversity + disagreement) / 2",
  convergence: "1 - divergence"
});

export function normalizedEntropy(values) {
  const clean = values.filter((value) => value != null && value !== "UNKNOWN");
  if (clean.length <= 1) return 0;
  const counts = Object.values(distribution(clean));
  if (counts.length <= 1) return 0;
  const n = clean.length;
  const entropy = -counts.reduce((sum, count) => {
    const p = count / n;
    return sum + p * Math.log(p);
  }, 0);
  return entropy / Math.log(counts.length);
}

function distinctRatio(values, denominator) {
  if (!denominator) return 0;
  return new Set(values.filter(Boolean)).size / denominator;
}

function round(value) {
  return Number(value.toFixed(6));
}

export function snapshotFor(bundle, timestamp) {
  const observations = bundle.observations.filter(
    (r) => r.phenomenon_id === bundle.phenomenon.id && observedBy(r, timestamp)
  );
  const perspectives = bundle.perspectives.filter(
    (r) => r.phenomenon_id === bundle.phenomenon.id && activeAt(r, timestamp)
  );
  const perspectiveIds = new Set(perspectives.map((r) => r.id));
  const framings = bundle.framings.filter((r) => perspectiveIds.has(r.perspective_id) && activeAt(r, timestamp));

  const framingDimensions = framings.map((r) => r.dimension);
  const positions = perspectives.map((r) => r.position).filter((v) => v !== "UNKNOWN");
  const actorTypes = perspectives.map((r) => r.actor_type);
  const geographies = perspectives.map((r) => r.geography).filter(Boolean);
  const signatures = perspectives.map((p) => {
    const dims = framings.filter((f) => f.perspective_id === p.id).map((f) => f.dimension).sort();
    return `${dims.join("+")}|${p.position}`;
  });

  const framingDiversity = normalizedEntropy(framingDimensions);
  const disagreement = normalizedEntropy(positions);
  const divergence = (framingDiversity + disagreement) / 2;

  return {
    timestamp,
    phenomenon_id: bundle.phenomenon.id,
    observation_count: observations.length,
    source_count: new Set(observations.map((r) => r.source_id)).size,
    actor_count: new Set(perspectives.map((r) => r.actor_reference)).size,
    geography_count: new Set(geographies).size,
    perspective_count: perspectives.length,
    framing_distribution: distribution(framingDimensions),
    position_distribution: distribution(positions),
    metrics: {
      perspective_diversity: round(distinctRatio(signatures, perspectives.length)),
      framing_diversity: round(framingDiversity),
      actor_diversity: round(distinctRatio(actorTypes, perspectives.length)),
      source_diversity: round(distinctRatio(observations.map((r) => r.source_id), observations.length)),
      geographic_spread: round(distinctRatio(geographies, perspectives.length)),
      disagreement: round(disagreement),
      divergence: round(divergence),
      convergence: round(1 - divergence)
    },
    methodology: {
      algorithm_version: ANALYTICS_VERSION,
      formulas: METRIC_FORMULAS
    }
  };
}

export function calculateChange(previous, current) {
  const metricDelta = {};
  for (const key of Object.keys(current.metrics)) {
    metricDelta[key] = round(current.metrics[key] - (previous.metrics[key] ?? 0));
  }
  const economicBefore = previous.framing_distribution.ECONOMIC ?? 0;
  const economicAfter = current.framing_distribution.ECONOMIC ?? 0;

  return {
    from: previous.timestamp,
    to: current.timestamp,
    dimensions: {
      VOLUME: current.observation_count - previous.observation_count,
      ACTOR_DIVERSITY: current.actor_count - previous.actor_count,
      GEOGRAPHY: current.geography_count - previous.geography_count,
      FRAMING: metricDelta.framing_diversity,
      DISAGREEMENT: metricDelta.disagreement,
      CONVERGENCE: metricDelta.convergence
    },
    metric_delta: metricDelta,
    economic_framing_volume_delta: economicAfter - economicBefore
  };
}

export function detectSignals(previous, current) {
  const change = calculateChange(previous, current);
  const signals = [];
  if (
    change.dimensions.FRAMING > 0 &&
    change.dimensions.DISAGREEMENT > 0 &&
    change.dimensions.VOLUME > 0
  ) {
    signals.push({
      signal_type: "FRAGMENTATION",
      confidence: 0.86,
      rationale: "Framing diversity, disagreement, and observation volume increased together."
    });
  }
  if (current.geography_count > previous.geography_count) {
    signals.push({
      signal_type: "SPREAD",
      confidence: 0.8,
      rationale: "The number of represented geographies increased."
    });
  }
  return signals;
}

export function deriveInsight(previous, current) {
  const change = calculateChange(previous, current);
  if (change.dimensions.VOLUME > 0 && change.dimensions.CONVERGENCE < 0) {
    return "The phenomenon is spreading faster than consensus is forming.";
  }
  return "The perspective field changed, but the configured insight rule did not detect faster spread than consensus formation.";
}
