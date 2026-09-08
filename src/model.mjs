export const DOMAIN = "PERSPECTIVE";

export const NAMESPACE_TO_REPOSITORY = Object.freeze({
  mftl: "rocksoul-mftl",
  legend: "rocksoul-legend",
  superhero: "rocksoul-superhero",
  rgbl: "rocksoul-rgbl",
  aws: "rocksoul-aws",
  correlation: "rocksoul-correlation"
});

export const REPOSITORY_TO_NAMESPACE = Object.freeze(
  Object.fromEntries(Object.entries(NAMESPACE_TO_REPOSITORY).map(([k, v]) => [v, k]))
);

export const ALLOWED_FOREIGN_RECORD_TYPES = Object.freeze({
  "rocksoul-mftl": new Set(["STORY", "NARRATIVE", "MYTH", "CLAIM", "ENTITY"]),
  "rocksoul-legend": new Set(["EVENT", "CLAIM", "EVIDENCE", "PLACE"]),
  "rocksoul-superhero": new Set(["PERSON"]),
  "rocksoul-rgbl": new Set(["TEXT", "WORK", "EXPRESSION", "EDITION", "PASSAGE", "ASSERTION"]),
  "rocksoul-aws": new Set(["LAW", "JURISDICTION", "LEGAL_AUTHORITY", "LEGAL_ASSESSMENT"]),
  "rocksoul-correlation": new Set(["RELATIONSHIP", "CORRELATION_EDGE"])
});

export const FORBIDDEN_LOCAL_RECORD_TYPES = new Set([
  "EVENT", "PERSON", "STORY", "NARRATIVE", "MYTH", "TEXT", "WORK", "PASSAGE",
  "LAW", "LEGAL_VERDICT", "CORRELATION_EDGE", "CLAIM"
]);

export function parseQualifiedReference(value) {
  if (typeof value !== "string") throw new TypeError("qualified reference must be a string");
  const match = value.match(/^([a-z][a-z0-9_-]*):(.+)$/);
  if (!match) throw new Error(`invalid qualified reference: ${value}`);
  const [, namespace, externalId] = match;
  if (!(namespace in NAMESPACE_TO_REPOSITORY)) throw new Error(`unsupported foreign namespace: ${namespace}`);
  if (!externalId.trim()) throw new Error("foreign reference external id is empty");
  return { namespace, repository: NAMESPACE_TO_REPOSITORY[namespace], externalId };
}

export function validateForeignReference(ref) {
  if (!ref || typeof ref !== "object") throw new Error("foreign reference must be an object");
  const parsed = parseQualifiedReference(ref.external_id);
  if (parsed.repository !== ref.repository) throw new Error(`namespace/repository mismatch for ${ref.id}`);
  const allowed = ALLOWED_FOREIGN_RECORD_TYPES[ref.repository];
  if (!allowed?.has(ref.foreign_record_type)) throw new Error(`foreign_record_type ${ref.foreign_record_type} is not valid for ${ref.repository}`);
  if (!["UNVERIFIED", "VERIFIED", "UNRESOLVED", "REJECTED"].includes(ref.verification_state)) throw new Error(`invalid verification_state for ${ref.id}`);
  return true;
}

export function activeAt(record, instant) {
  const t = new Date(instant).getTime();
  const start = new Date(record.valid_from ?? record.observed_at ?? record.published_at ?? 0).getTime();
  const end = record.valid_until ? new Date(record.valid_until).getTime() : Number.POSITIVE_INFINITY;
  return Number.isFinite(t) && start <= t && t < end;
}

export function observedBy(record, instant) {
  const t = new Date(instant).getTime();
  const at = new Date(record.observed_at ?? record.published_at ?? 0).getTime();
  return Number.isFinite(t) && at <= t;
}

export function distribution(values) {
  const result = {};
  for (const value of values) result[value] = (result[value] ?? 0) + 1;
  return result;
}

export function uniqueIds(records) {
  const seen = new Set();
  for (const record of records) {
    if (!record?.id) throw new Error("record missing id");
    if (seen.has(record.id)) throw new Error(`duplicate id: ${record.id}`);
    seen.add(record.id);
  }
  return seen;
}
