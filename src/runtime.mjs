import { readFile } from "node:fs/promises";

const GOLDEN_URL = new URL("../data/golden/ai-workforce-reduction.json", import.meta.url);

export async function loadBundle(url = GOLDEN_URL) {
  return JSON.parse(await readFile(url, "utf8"));
}

function rowsFor(bundle, key, phenomenonId) {
  const rows = bundle[key] ?? [];
  return rows.filter((row) => row.phenomenon_id === phenomenonId);
}

const ROUTE_TO_KEY = Object.freeze({
  observations: "observations",
  perspectives: "perspectives",
  framings: "framings",
  reactions: "reactions",
  signals: "signals",
  changes: "changes",
  snapshots: "perspective_snapshots",
  insights: "insights",
  "foreign-references": "foreign_references"
});

export function route(method, pathname, bundle) {
  if (method !== "GET") return { status: 405, body: { error: "method_not_allowed" } };
  if (pathname === "/health") {
    return { status: 200, body: { status: "ok", domain: "PERSPECTIVE", schema_version: "jizz.runtime.v0.1" } };
  }

  const match = pathname.match(/^\/phenomena\/([^/]+)(?:\/([^/]+))?$/);
  if (!match) return { status: 404, body: { error: "not_found" } };

  const [, phenomenonId, resource] = match;
  if (phenomenonId !== bundle.phenomenon.id) {
    return { status: 404, body: { error: "phenomenon_not_found", id: phenomenonId } };
  }
  if (!resource) return { status: 200, body: bundle.phenomenon };

  const key = ROUTE_TO_KEY[resource];
  if (!key) return { status: 404, body: { error: "resource_not_found", resource } };
  return { status: 200, body: rowsFor(bundle, key, phenomenonId) };
}
