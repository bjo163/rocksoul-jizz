import test from "node:test";
import assert from "node:assert/strict";
import { loadBundle } from "../src/runtime.mjs";
import { FORBIDDEN_LOCAL_RECORD_TYPES, parseQualifiedReference } from "../src/model.mjs";

test("golden JIZZ records do not take ownership of foreign domains", async () => {
  const bundle = await loadBundle();
  const records = [
    bundle.phenomenon,
    ...Object.values(bundle).filter(Array.isArray).flat()
  ].filter((x) => x && typeof x === "object");
  for (const record of records) {
    assert.equal(record.domain, "PERSPECTIVE");
    assert.equal(FORBIDDEN_LOCAL_RECORD_TYPES.has(record.record_type), false, record.id);
  }
});

test("qualified namespaces are bounded and invalid namespaces are rejected", () => {
  assert.equal(parseQualifiedReference("legend:EVT-123").repository, "rocksoul-legend");
  assert.throws(() => parseQualifiedReference("unknown:EVT-123"), /unsupported foreign namespace/);
  assert.throws(() => parseQualifiedReference("not-qualified"), /invalid qualified reference/);
});
