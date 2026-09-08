import test from "node:test";
import assert from "node:assert/strict";
import { loadBundle, route } from "../src/runtime.mjs";

test("semantic API exposes phenomenon resources without an everything endpoint", async () => {
  const bundle = await loadBundle();
  assert.equal(route("GET", `/phenomena/${bundle.phenomenon.id}`, bundle).status, 200);
  assert.equal(route("GET", `/phenomena/${bundle.phenomenon.id}/perspectives`, bundle).body.length, bundle.perspectives.length);
  assert.equal(route("GET", `/phenomena/${bundle.phenomenon.id}/signals`, bundle).body.length, bundle.signals.length);
  assert.equal(route("GET", "/everything", bundle).status, 404);
  assert.equal(route("GET", "/facts/123", bundle).status, 404);
});
