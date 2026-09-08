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
