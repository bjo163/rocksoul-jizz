import test from "node:test";
import assert from "node:assert/strict";
import { loadBundle } from "../src/runtime.mjs";

test("insight retains a complete derivation chain to observations and sources", async () => {
  const bundle = await loadBundle();
  const insight = bundle.insights[0];
  assert.ok(insight.input_signal_ids.length > 0);
  assert.ok(insight.input_change_ids.length > 0);

  const signals = bundle.signals.filter((s) => insight.input_signal_ids.includes(s.id));
  const changes = bundle.changes.filter((c) => insight.input_change_ids.includes(c.id));
  assert.ok(signals.length > 0 && changes.length > 0);

  const observationIds = new Set(signals.flatMap((s) => s.inputs));
  assert.ok(observationIds.size > 0);
  const observations = bundle.observations.filter((o) => observationIds.has(o.id));
  assert.equal(observations.length, observationIds.size);

  const sourceIds = new Set(observations.map((o) => o.source_id));
  assert.ok(bundle.sources.filter((s) => sourceIds.has(s.id)).length > 0);
  assert.ok(insight.methodology_id);
  assert.ok(insight.algorithm_version);
  assert.equal(typeof insight.confidence, "number");
  assert.equal(typeof insight.coverage, "number");
});
