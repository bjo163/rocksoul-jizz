import test from "node:test";
import assert from "node:assert/strict";
import { loadBundle } from "../src/runtime.mjs";
import { activeAt } from "../src/model.mjs";
import { snapshotFor } from "../src/analytics.mjs";

test("old perspectives remain queryable after later perspectives appear", async () => {
  const bundle = await loadBundle();
  const old = bundle.perspectives.filter((p) => activeAt(p, "2026-01-15T12:00:00Z"));
  const current = bundle.perspectives.filter((p) => activeAt(p, "2026-02-15T12:00:00Z"));
  assert.equal(old.length, 3);
  assert.equal(current.length, 6);
  assert.ok(bundle.perspectives.length > current.length);
  assert.ok(old.every((p) => bundle.perspectives.some((candidate) => candidate.id === p.id)));
});

test("persisted snapshots are reconstructable from temporal records", async () => {
  const bundle = await loadBundle();
  for (const stored of bundle.perspective_snapshots) {
    const rebuilt = snapshotFor(bundle, stored.timestamp);
    assert.equal(rebuilt.perspective_count, stored.perspective_count);
    assert.deepEqual(rebuilt.framing_distribution, stored.framing_distribution);
    assert.deepEqual(rebuilt.position_distribution, stored.position_distribution);
    assert.deepEqual(rebuilt.metrics, stored.metrics);
  }
});
