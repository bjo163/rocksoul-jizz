import test from "node:test";
import assert from "node:assert/strict";
import { loadBundle } from "../src/runtime.mjs";
import { calculateChange, deriveInsight, detectSignals, snapshotFor } from "../src/analytics.mjs";

test("golden snapshots expose increasing diversity and disagreement", async () => {
  const bundle = await loadBundle();
  const t1 = snapshotFor(bundle, "2026-01-15T12:00:00Z");
  const t2 = snapshotFor(bundle, "2026-02-15T12:00:00Z");
  assert.equal(t1.perspective_count, 3);
  assert.equal(t2.perspective_count, 6);
  assert.ok(t2.metrics.framing_diversity > t1.metrics.framing_diversity);
  assert.ok(t2.metrics.disagreement > t1.metrics.disagreement);
  assert.ok(t2.actor_count > t1.actor_count);
});

test("zigzag change produces fragmentation and explainable insight", async () => {
  const bundle = await loadBundle();
  const t1 = snapshotFor(bundle, "2026-01-15T12:00:00Z");
  const t2 = snapshotFor(bundle, "2026-02-15T12:00:00Z");
  const change = calculateChange(t1, t2);
  assert.ok(change.dimensions.VOLUME > 0);
  assert.ok(change.dimensions.CONVERGENCE < 0);
  assert.ok(detectSignals(t1, t2).some((s) => s.signal_type === "FRAGMENTATION"));
  assert.equal(deriveInsight(t1, t2), "The phenomenon is spreading faster than consensus is forming.");
});
