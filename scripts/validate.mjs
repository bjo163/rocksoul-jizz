import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseQualifiedReference, uniqueIds, validateForeignReference } from "../src/model.mjs";
import { snapshotFor } from "../src/analytics.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const requiredDocs = [
  "DOMAIN.md", "DATA_MODEL.md", "SCHEMA.md", "BOUNDARIES.md", "ANTI_OVERLAP.md", "INTEROP.md",
  "PROVENANCE.md", "ANALYTICS.md", "RESEARCH_PIPELINE.md", "API.md", "TESTING.md",
  "VOCABULARY.md", "COMMON_CONTRACT.md"
];
const requiredSchemas = [
  "common.schema.json", "source.schema.json", "observation.schema.json", "phenomenon.schema.json",
  "perspective.schema.json", "framing.schema.json", "reaction.schema.json", "signal.schema.json",
  "change.schema.json", "perspective-snapshot.schema.json", "trend.schema.json", "pattern.schema.json",
  "insight.schema.json", "foreign-reference.schema.json", "cross-repo-reference.schema.json",
  "provenance.schema.json", "research-run.schema.json", "methodology.schema.json"
];
const forbiddenStructures = [
  "canonical_events", "canonical_people", "canonical_stories", "scripture_registry",
  "legal_verdicts", "historicity_registry", "authorship_registry", "global_correlation_graph"
];

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

async function exists(relative) {
  try { await readFile(path.join(root, relative)); return true; } catch { return false; }
}

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...await walk(full));
    else out.push(full);
  }
  return out;
}

function validateTemporal(record) {
  const start = record.valid_from ?? record.observed_at ?? record.published_at;
  if (record.valid_until && start) invariant(new Date(record.valid_until) > new Date(start), `invalid validity interval: ${record.id}`);
  if (record.retrieved_at && record.published_at) invariant(new Date(record.retrieved_at) >= new Date(record.published_at), `retrieved before published: ${record.id}`);
}

for (const doc of requiredDocs) invariant(await exists(`docs/${doc}`), `missing docs/${doc}`);
for (const schema of requiredSchemas) invariant(await exists(`schemas/${schema}`), `missing schemas/${schema}`);

const schemaFiles = await walk(path.join(root, "schemas"));
for (const file of schemaFiles) {
  const schema = JSON.parse(await readFile(file, "utf8"));
  invariant(schema.$schema === "https://json-schema.org/draft/2020-12/schema", `wrong JSON Schema draft: ${file}`);
  invariant(typeof schema.$id === "string", `schema missing $id: ${file}`);
  invariant(typeof schema["x-jizz-schema-version"] === "string", `schema missing x-jizz-schema-version: ${file}`);
}

const implementationFiles = [
  ...(await walk(path.join(root, "src"))),
  ...(await walk(path.join(root, "scripts"))),
  ...(await walk(path.join(root, "schemas"))),
  ...(await walk(path.join(root, "data")))
];
for (const file of implementationFiles) {
  const text = await readFile(file, "utf8");
  for (const forbidden of forbiddenStructures) invariant(!text.includes(forbidden), `anti-overlap violation '${forbidden}' in ${path.relative(root, file)}`);
  invariant(!text.includes("ArsyBelovedLabs"), `excluded dependency/reference in ${path.relative(root, file)}`);
}

const bundle = JSON.parse(await readFile(path.join(root, "data/golden/ai-workforce-reduction.json"), "utf8"));
invariant(bundle.domain === "PERSPECTIVE", "golden bundle must use PERSPECTIVE domain");
invariant(bundle.phenomenon?.record_type === "PHENOMENON", "golden phenomenon record_type invalid");

const families = [
  "sources", "observations", "perspectives", "framings", "reactions", "signals", "changes",
  "perspective_snapshots", "trends", "patterns", "insights", "foreign_references", "cross_repo_references",
  "provenance", "research_runs", "methodologies"
];
for (const family of families) invariant(Array.isArray(bundle[family]), `missing array: ${family}`);

const allRecords = [bundle.phenomenon, ...families.flatMap((key) => bundle[key])];
const allIds = uniqueIds(allRecords);
for (const record of allRecords) {
  invariant(record.domain === "PERSPECTIVE", `non-PERSPECTIVE local record: ${record.id}`);
  validateTemporal(record);
}

const sourceIds = new Set(bundle.sources.map((r) => r.id));
const observationIds = new Set(bundle.observations.map((r) => r.id));
const perspectiveIds = new Set(bundle.perspectives.map((r) => r.id));
const signalIds = new Set(bundle.signals.map((r) => r.id));
const changeIds = new Set(bundle.changes.map((r) => r.id));
const methodologyIds = new Set(bundle.methodologies.map((r) => r.id));
const foreignIds = new Set(bundle.foreign_references.map((r) => r.id));

for (const obs of bundle.observations) {
  invariant(sourceIds.has(obs.source_id), `observation source missing: ${obs.id}`);
  invariant(obs.phenomenon_id === bundle.phenomenon.id, `observation phenomenon mismatch: ${obs.id}`);
}
for (const p of bundle.perspectives) {
  invariant(p.phenomenon_id === bundle.phenomenon.id, `perspective phenomenon mismatch: ${p.id}`);
  for (const ref of p.observation_refs) invariant(observationIds.has(ref), `perspective observation missing: ${p.id} -> ${ref}`);
}
for (const f of bundle.framings) invariant(perspectiveIds.has(f.perspective_id), `framing perspective missing: ${f.id}`);
for (const r of bundle.reactions) for (const ref of r.observation_refs) invariant(observationIds.has(ref), `reaction observation missing: ${r.id} -> ${ref}`);
for (const s of bundle.signals) {
  invariant(methodologyIds.has(s.methodology_id), `signal methodology missing: ${s.id}`);
  invariant(s.inputs.length > 0, `signal inputs empty: ${s.id}`);
  for (const ref of s.inputs) invariant(observationIds.has(ref), `signal observation input missing: ${s.id} -> ${ref}`);
}
for (const c of bundle.changes) {
  invariant(methodologyIds.has(c.methodology_id), `change methodology missing: ${c.id}`);
  for (const ref of c.input_signal_ids) invariant(signalIds.has(ref), `change signal input missing: ${c.id} -> ${ref}`);
  for (const ref of c.input_observation_ids) invariant(observationIds.has(ref), `change observation input missing: ${c.id} -> ${ref}`);
}
for (const snap of bundle.perspective_snapshots) {
  invariant(methodologyIds.has(snap.methodology_id), `snapshot methodology missing: ${snap.id}`);
  const recomputed = snapshotFor(bundle, snap.timestamp);
  for (const key of ["observation_count", "source_count", "actor_count", "geography_count", "perspective_count"]) invariant(recomputed[key] === snap[key], `snapshot not reconstructable: ${snap.id} field ${key}`);
  for (const [metric, value] of Object.entries(snap.metrics)) invariant(Math.abs(recomputed.metrics[metric] - value) < 0.000001, `snapshot metric drift: ${snap.id} ${metric}`);
}
for (const insight of bundle.insights) {
  invariant(methodologyIds.has(insight.methodology_id), `insight methodology missing: ${insight.id}`);
  invariant(insight.input_signal_ids.every((id) => signalIds.has(id)), `insight signal input missing: ${insight.id}`);
  invariant(insight.input_change_ids.every((id) => changeIds.has(id)), `insight change input missing: ${insight.id}`);
}
for (const ref of bundle.foreign_references) validateForeignReference(ref);
for (const xref of bundle.cross_repo_references) {
  invariant(allIds.has(xref.local_record_id), `cross-repo local record missing: ${xref.id}`);
  invariant(foreignIds.has(xref.foreign_reference_id), `cross-repo foreign record missing: ${xref.id}`);
}

for (const sample of ["mftl:MYTH-X", "legend:EVT-X", "superhero:PER-X", "rgbl:mw:work:x", "aws:LAW-X", "correlation:CORR-X"]) parseQualifiedReference(sample);

console.log(`JIZZ validation passed: ${allRecords.length} records, ${schemaFiles.length} schemas.`);
