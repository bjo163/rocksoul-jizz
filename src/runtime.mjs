import { readFile, readdir } from "node:fs/promises";

const GOLDEN_URL = new URL("../data/golden/ai-workforce-reduction.json", import.meta.url);
const LIVE_DIR_URL = new URL("../data/live/", import.meta.url);

export async function loadBundle(url = GOLDEN_URL) {
  return JSON.parse(await readFile(url, "utf8"));
}

export async function loadLiveBundles(dirUrl = LIVE_DIR_URL) {
  let entries = [];
  try {
    entries = await readdir(dirUrl, { withFileTypes: true });
  } catch (error) {
    if (error?.code === "ENOENT") return [];
    throw error;
  }

  const files = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
    .map((entry) => entry.name)
    .sort();

  return Promise.all(files.map((name) => loadBundle(new URL(name, dirUrl))));
}

export async function loadCorpus() {
  const live = await loadLiveBundles();
  return live.length ? live : [await loadBundle()];
}

function rowsFor(bundle, key, phenomenonId) {
  const rows = bundle[key] ?? [];
  return rows.filter((row) => row.phenomenon_id === phenomenonId);
}

const ROUTE_TO_KEY = Object.freeze({
  sources: "sources",
  observations: "observations",
  perspectives: "perspectives",
  framings: "framings",
  reactions: "reactions",
  signals: "signals",
  changes: "changes",
  snapshots: "perspective_snapshots",
  insights: "insights",
  methodologies: "methodologies",
  provenance: "provenance",
  "foreign-references": "foreign_references"
});

function asBundles(input) {
  return Array.isArray(input) ? input : [input];
}

function findBundle(input, phenomenonId) {
  return asBundles(input).find((bundle) => bundle.phenomenon?.id === phenomenonId) ?? null;
}

export function route(method, pathname, input) {
  if (method !== "GET") return { status: 405, body: { error: "method_not_allowed" } };
  const bundles = asBundles(input);

  if (pathname === "/health") {
    return {
      status: 200,
      body: {
        status: "ok",
        domain: "PERSPECTIVE",
        schema_version: "jizz.runtime.v0.2",
        live_phenomena: bundles.filter((bundle) => bundle.corpus_kind === "LIVE_RESEARCH").length
      }
    };
  }

  if (pathname === "/phenomena") {
    return {
      status: 200,
      body: {
        count: bundles.length,
        items: bundles.map((bundle) => ({
          ...bundle.phenomenon,
          corpus_kind: bundle.corpus_kind ?? "FIXTURE",
          source_count: bundle.sources?.length ?? 0,
          observation_count: bundle.observations?.length ?? 0,
          perspective_count: bundle.perspectives?.length ?? 0,
          snapshot: bundle.perspective_snapshots?.at(-1) ?? null
        }))
      }
    };
  }

  const match = pathname.match(/^\/phenomena\/([^/]+)(?:\/([^/]+))?$/);
  if (!match) return { status: 404, body: { error: "not_found" } };

  const [, phenomenonId, resource] = match;
  const bundle = findBundle(bundles, phenomenonId);
  if (!bundle) {
    return { status: 404, body: { error: "phenomenon_not_found", id: phenomenonId } };
  }
  if (!resource) {
    return {
      status: 200,
      body: {
        ...bundle.phenomenon,
        corpus_kind: bundle.corpus_kind ?? "FIXTURE"
      }
    };
  }

  const key = ROUTE_TO_KEY[resource];
  if (!key) return { status: 404, body: { error: "resource_not_found", resource } };

  if (["sources", "methodologies", "provenance"].includes(resource)) {
    return { status: 200, body: bundle[key] ?? [] };
  }

  return { status: 200, body: rowsFor(bundle, key, phenomenonId) };
}
