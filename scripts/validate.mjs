import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { parseQualifiedReference, uniqueIds, validateForeignReference } from "../src/model.mjs";
import { snapshotFor } from "../src/analytics.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ajv = new Ajv2020({ allErrors: true, strict: false });
addFormats(ajv);

const requiredDocs = [
  "DOMAIN.md", "DATA_MODEL.md", "SCHEMA.md", "BOUNDARIES.md", "ANTI_OVERLAP.md", "INTEROP.md",
  "PROVENANCE.md", "ANALYTICS.md", "RESEARCH_PIPELINE.md", "RESEARCH_POLICY.md", "AUTOMATIC_RESEARCH.md",
  "AUTOMATION.md", "API.md", "TESTING.md", "VOCABULARY.md", "COMMON_CONTRACT.md"
];
const requiredSchemas = [
  "common.schema.json", "source.schema.json", "observation.schema.json", "phenomenon.schema.json",
  "perspective.schema.json", "framing.schema.json", "reaction.schema.json", "signal.schema.json",
  "change.schema.json", "perspective-snapshot.schema.json", "trend.schema.json", "pattern.schema.json",
  "insight.schema.json", "foreign-reference.schema.json", "cross-repo-reference.schema.json",
  "provenance.schema.json", "research-run.schema.json", "methodology.schema.json",
  "discovery-candidate.schema.json", "research-topics.schema.json", "research-index.schema.json"
];
const forbiddenStructures = [
  "canonical_events", "canonical_people", "canonical_stories", "scripture_registry",
  "legal_verdicts", "historicity_registry", "authorship_registry", "global_correlation_graph"
];

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function exists(relative) {
  return fs.existsSync(path.join(root, relative));
}

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

function readJson(relative) {
  return JSON.parse(fs.readFileSync(path.join(root, relative), "utf8"));
}

function validateTemporal(record) {
  const start = record.valid_from ?? record.observed_at ?? record.published_at;
  if (record.valid_until && start) invariant(new Date(record.valid_until) > new Date(start), `invalid validity interval: ${record.id}`);
  if (record.retrieved_at && record.published_at) invariant(new Date(record.retrieved_at) >= new Date(record.published_at), `retrieved before published: ${record.id}`);
}

function validateAgainstSchema(data, schemaName, label) {
  const schema = readJson(`schemas/${schemaName}`);
  const validate = ajv.compile(schema);
  if (!validate(data)) {
    throw new Error(`${label} failed ${schemaName}: ${JSON.stringify(validate.errors)}`);
  }
}

for (const doc of requiredDocs) invariant(exists(`docs/${doc}`), `missing docs/${doc}`);
for (const schema of requiredSchemas) invariant(exists(`schemas/${schema}`), `missing schemas/${schema}`);
invariant(exists("data/research-scout/topics.json"), "missing research scout topics");
invariant(exists("data/indexes/research-index.json"), "missing research index");
invariant(exists(".github/workflows/automatic-research.yml"), "missing automatic research workflow");

const schemaFiles = walk(path.join(root, "schemas"));
for (const file of schemaFiles) {
  const schema = JSON.parse(fs.readFileSync(file, "utf8"));
  invariant(schema.$schema === "https://json-schema.org/draft/2020-12/schema", `wrong JSON Schema draft: ${file}`);
  invariant(typeof schema.$id === "string", `schema missing $id: ${file}`);
  invariant(typeof schema["x-jizz-schema-version"] === "string", `schema missing x-jizz-schema-version: ${file}`);
}

const implementationFiles = [
  ...walk(path.join(root, "src")),
  ...walk(path.join(root, "schemas")),
  ...walk(path.join(root, "data"))
];
for (const file of implementationFiles) {
  const text = fs.readFileSync(file, "utf8");
  for (const forbidden of forbiddenStructures) invariant(!text.includes(forbidden), `anti-overlap violation '${forbidden}' in ${path.relative(root, file)}`);
  invariant(!text.includes("ArsyBelovedLabs"), `excluded dependency/reference in ${path.relative(root, file)}`);
}

const topics = readJson("data/research-scout/topics.json");
validateAgainstSchema(topics, "research-topics.schema.json", "research topics");
invariant(new Set(topics.topics.map((topic) => topic.id)).size === topics.topics.length, "duplicate research lane id");

const candidateFiles = walk(path.join(root, "data/candidates")).filter((file) => file.endsWith(".json"));
const candidateIds = new Set();
for (const file of candidateFiles) {
  const candidate = JSON.parse(fs.readFileSync(file, "utf8"));
  validateAgainstSchema(candidate, "discovery-candidate.schema.json", path.relative(root, file));
  invariant(!candidateIds.has(candidate.candidate_id), `duplicate candidate id: ${candidate.candidate_id}`);
  candidateIds.add(candidate.candidate_id);
  if (candidate.status === "needs_sources") {
    invariant(candidate.sources.every((source) => source.authority === "discovery_only"), `needs_sources candidate contains promoted source authority: ${candidate.candidate_id}`);
  }
}

const researchIndex = readJson("data/indexes/research-index.json");
validateAgainstSchema(researchIndex, "research-index.schema.json", "research index");
invariant(researchIndex.counts.total === candidateFiles.length, "research index candidate count drift");

const bundle = readJson("data/golden/ai-workforce-reduction.json");
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

const sourceIds = new Set(bundle.sources.map((record) => record.id));
const observationIds = new Set(bundle.observations.map((record) => record.id));
const perspectiveIds = new Set(bundle.perspectives.map((record) => record.id));
const signalIds = new Set(bundle.signals.map((record) => record.id));
const changeIds = new Set(bundle.changes.map((record) => record.id));
const methodologyIds = new Set(bundle.methodologies.map((record) => record.id));
const foreignIds = new Set(bundle.foreign_references.map((record) => record.id));

for (const observation of bundle.observations) {
  invariant(sourceIds.has(observation.source_id), `observation source missing: ${observation.id}`);
  invariant(observation.phenomenon_id === bundle.phenomenon.id, `observation phenomenon mismatch: ${observation.id}`);
}
for (const perspective of bundle.perspectives) {
  invariant(perspective.phenomenon_id === bundle.phenomenon.id, `perspective phenomenon mismatch: ${perspective.id}`);
  for (const ref of perspective.observation_refs) invariant(observationIds.has(ref), `perspective observation missing: ${perspective.id} -> ${ref}`);
}
for (const framing of bundle.framings) invariant(perspectiveIds.has(framing.perspective_id), `framing perspective missing: ${framing.id}`);
for (const reaction of bundle.reactions) for (const ref of reaction.observation_refs) invariant(observationIds.has(ref), `reaction observation missing: ${reaction.id} -> ${ref}`);
for (const signal of bundle.signals) {
  invariant(methodologyIds.has(signal.methodology_id), `signal methodology missing: ${signal.id}`);
  invariant(signal.inputs.length > 0, `signal inputs empty: ${signal.id}`);
  for (const ref of signal.inputs) invariant(observationIds.has(ref), `signal observation input missing: ${signal.id} -> ${ref}`);
}
for (const change of bundle.changes) {
  invariant(methodologyIds.has(change.methodology_id), `change methodology missing: ${change.id}`);
  for (const ref of change.input_signal_ids) invariant(signalIds.has(ref), `change signal input missing: ${change.id} -> ${ref}`);
  for (const ref of change.input_observation_ids) invariant(observationIds.has(ref), `change observation input missing: ${change.id} -> ${ref}`);
}
for (const snapshot of bundle.perspective_snapshots) {
  invariant(methodologyIds.has(snapshot.methodology_id), `snapshot methodology missing: ${snapshot.id}`);
  const recomputed = snapshotFor(bundle, snapshot.timestamp);
  for (const key of ["observation_count", "source_count", "actor_count", "geography_count", "perspective_count"]) {
    invariant(recomputed[key] === snapshot[key], `snapshot not reconstructable: ${snapshot.id} field ${key}`);
  }
  for (const [metric, value] of Object.entries(snapshot.metrics)) {
    invariant(Math.abs(recomputed.metrics[metric] - value) < 0.000001, `snapshot metric drift: ${snapshot.id} ${metric}`);
  }
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

for (const sample of ["mftl:MYTH-X", "legend:EVT-X", "superhero:PER-X", "rgbl:mw:work:x", "aws:LAW-X", "correlation:CORR-X"]) {
  parseQualifiedReference(sample);
}

console.log(`JIZZ validation passed: ${allRecords.length} canonical/derived fixture records, ${candidateFiles.length} candidates, ${schemaFiles.length} schemas.`);
