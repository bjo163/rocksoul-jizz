import crypto from "node:crypto";

export function clean(value = "") {
  return String(value).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

export function shortHash(value, length = 12) {
  return crypto.createHash("sha256").update(String(value)).digest("hex").slice(0, length);
}

export function slug(value, max = 54) {
  return clean(value)
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, max);
}

export function parseGdeltDate(value) {
  const text = clean(value);
  const match = text.match(/^(\d{4})(\d{2})(\d{2})T?(\d{2})?(\d{2})?(\d{2})?/);
  if (!match) return null;
  const [, y, m, d, hh = "00", mm = "00", ss = "00"] = match;
  const iso = `${y}-${m}-${d}T${hh}:${mm}:${ss}Z`;
  return Number.isNaN(Date.parse(iso)) ? null : iso;
}

export function normalizeGdeltArticle(article = {}) {
  return {
    title: clean(article.title),
    url: clean(article.url || article.url_mobile),
    publisher: clean(article.domain) || null,
    country: clean(article.sourcecountry) || null,
    language: clean(article.language) || null,
    published_at: parseGdeltDate(article.seendate)
  };
}

export function leadFingerprint(lead) {
  return shortHash([
    clean(lead.url).toLowerCase(),
    clean(lead.title).toLowerCase(),
    lead.published_at ?? ""
  ].join("|"), 16);
}

export function scoreLead(lead) {
  let score = 0;
  if (lead.url) score += 25;
  if (lead.publisher) score += 20;
  if (lead.published_at) score += 20;
  if (lead.country) score += 10;
  if (lead.language) score += 10;
  if (clean(lead.title).length >= 30) score += 15;
  return Math.min(100, score);
}

export function normalizedTitle(value) {
  return clean(value).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

export function isDuplicateTitle(title, existingTitles) {
  const current = normalizedTitle(title);
  if (!current) return false;
  return existingTitles.some((value) => {
    const existing = normalizedTitle(value);
    if (!existing) return false;
    return existing === current || (current.length >= 24 && (existing.includes(current) || current.includes(existing)));
  });
}

export function stewardDecision({ baseScore = 0, hasLocator = false, duplicate = false }) {
  let score = Number(baseScore) || 0;
  if (hasLocator) score += 10;
  if (duplicate) score -= 60;
  score = Math.max(0, Math.min(100, score));
  const action = duplicate ? "duplicate" : score >= 70 ? "stage_candidate" : score >= 50 ? "needs_sources" : "hold";
  return { score, action };
}

export function candidateId(laneId, title) {
  return `CAND-JIZZ-${slug(laneId, 30)}-${shortHash(title, 8).toUpperCase()}`;
}

export const RESEARCH_LIFECYCLE_PRIORITY = Object.freeze({
  ready_for_observation: 100,
  source_inspected: 90,
  needs_sources: 70,
  triaged: 55,
  discovered: 35
});

export function lifecyclePriority(state = "discovered") {
  return RESEARCH_LIFECYCLE_PRIORITY[state] ?? 0;
}

export function countLifecycle(states = []) {
  const counts = {};
  for (const state of states) counts[state] = (counts[state] ?? 0) + 1;
  return counts;
}

export function wipPressure({ counts = {}, candidateCount = 0, softLimit = 8, hardLimit = 16, candidateRatioLimit = 2 } = {}) {
  const actionable = Object.keys(RESEARCH_LIFECYCLE_PRIORITY).reduce((sum, state) => sum + Number(counts[state] ?? 0), 0);
  const inspected = Number(counts.source_inspected ?? 0) + Number(counts.ready_for_observation ?? 0);
  const candidateLag = inspected > Math.max(candidateCount * candidateRatioLimit, candidateRatioLimit);
  const hard = actionable >= hardLimit;
  const soft = actionable >= softLimit;
  return {
    actionable,
    candidateCount,
    inspected,
    candidateLag,
    preferProgression: soft || candidateLag,
    suppressDiscovery: hard || candidateLag
  };
}

export function diversityRedundancyPenalty(sources = []) {
  if (sources.length < 2) return 0;
  const signatures = sources.map((source) => [
    clean(source.publisher).toLowerCase(),
    clean(source.country).toLowerCase(),
    clean(source.language).toLowerCase()
  ].join("|"));
  const unique = new Set(signatures).size;
  const redundancy = 1 - unique / sources.length;
  return Math.round(redundancy * 20);
}

export function rpsV1({
  state = "discovered",
  evidenceGain = 0,
  crossDomainValue = 0,
  freshnessValue = 0,
  noveltyValue = 0,
  diversityPenalty = 0,
  discovery = false,
  pressure = {}
} = {}) {
  const progressionValue = Math.round((lifecyclePriority(state) / 100) * 30);
  const wipPenalty = discovery && pressure.suppressDiscovery ? 30 : discovery && pressure.preferProgression ? 15 : 0;
  const score = progressionValue
    + Math.min(25, Math.max(0, Number(evidenceGain) || 0))
    + Math.min(15, Math.max(0, Number(crossDomainValue) || 0))
    + Math.min(10, Math.max(0, Number(freshnessValue) || 0))
    + Math.min(20, Math.max(0, Number(noveltyValue) || 0))
    - Math.min(20, Math.max(0, Number(diversityPenalty) || 0))
    - wipPenalty;
  return Math.max(0, Math.min(100, score));
}

export function rankResearchIssues(items = [], options = {}) {
  const pressure = options.pressure ?? wipPressure({
    counts: countLifecycle(items.map((item) => item.state ?? "discovered")),
    candidateCount: options.candidateCount ?? 0,
    softLimit: options.softLimit,
    hardLimit: options.hardLimit,
    candidateRatioLimit: options.candidateRatioLimit
  });
  return items
    .map((item) => ({
      ...item,
      rps: rpsV1({
        state: item.state ?? "discovered",
        evidenceGain: item.evidenceGain ?? 0,
        crossDomainValue: item.crossDomainValue ?? 0,
        freshnessValue: item.freshnessValue ?? 0,
        noveltyValue: item.noveltyValue ?? 0,
        diversityPenalty: item.diversityPenalty ?? 0,
        discovery: (item.state ?? "discovered") === "discovered",
        pressure
      })
    }))
    .sort((a, b) => lifecyclePriority(b.state) - lifecyclePriority(a.state) || b.rps - a.rps || String(a.id).localeCompare(String(b.id)));
}
