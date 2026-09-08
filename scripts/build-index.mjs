import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

function read(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function countBy(items, keyFn) {
  const out = {};
  for (const item of items) {
    const key = keyFn(item) ?? "unknown";
    out[key] = (out[key] ?? 0) + 1;
  }
  return out;
}

const config = read(path.join(root, "data/research-scout/topics.json"));
const candidateFiles = walk(path.join(root, "data/candidates")).filter((file) => file.endsWith(".json"));
const candidates = candidateFiles.map(read).sort((a, b) => String(b.discovery?.discovered_at ?? "").localeCompare(String(a.discovery?.discovered_at ?? "")));
const active = candidates.filter((candidate) => !["merged","rejected"].includes(candidate.status));
const latest = candidates.map((candidate) => candidate.discovery?.discovered_at).filter(Boolean).sort().at(-1) ?? null;

const output = {
  schema_version: "jizz.research-index.v0.1",
  generated_from_latest_candidate_at: latest,
  counts: {
    total: candidates.length,
    active: active.length,
    merged: candidates.filter((candidate) => candidate.status === "merged").length,
    rejected: candidates.filter((candidate) => candidate.status === "rejected").length,
    by_status: countBy(candidates, (candidate) => candidate.status)
  },
  lanes: config.topics.map((topic) => ({
    id: topic.id,
    candidate_type: topic.candidate_type,
    zone_hint: topic.zone_hint,
    active_candidates: active.filter((candidate) => candidate.discovery?.lane_id === topic.id).length
  })),
  candidates: candidates.map((candidate) => ({
    id: candidate.candidate_id,
    title: candidate.title,
    status: candidate.status,
    lane_id: candidate.discovery?.lane_id ?? null,
    zone_hint: candidate.zone_hint,
    source_count: candidate.sources?.length ?? 0,
    discovered_at: candidate.discovery?.discovered_at ?? null
  }))
};

const outDir = path.join(root, "data/indexes");
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, "research-index.json"), JSON.stringify(output, null, 2) + "\n");
console.log(`Generated JIZZ research index: ${candidates.length} candidates, ${active.length} active.`);
