import fs from "node:fs";
import path from "node:path";
import { candidateId, clean, isDuplicateTitle, stewardDecision } from "../src/research.mjs";

const root = process.cwd();
const repo = process.env.GITHUB_REPOSITORY;
const token = process.env.GITHUB_TOKEN;
if (!repo || !token) throw new Error("GITHUB_REPOSITORY and GITHUB_TOKEN are required");

const topicConfig = JSON.parse(fs.readFileSync(path.join(root, "data/research-scout/topics.json"), "utf8"));
const topicById = new Map(topicConfig.topics.map((topic) => [topic.id, topic]));

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

function meta(body, key) {
  const matches = [...String(body).matchAll(new RegExp(`${key}:([^\\n]+)`, "g"))];
  return matches.at(-1)?.[1]?.trim() ?? null;
}

function valueLine(body, label) {
  return String(body).match(new RegExp(`\\*\\*${label}:\\*\\* ([^\\n]+)`))?.[1]?.trim() ?? null;
}

async function jfetch(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      accept: "application/json",
      "user-agent": "rocksoul-jizz-steward/0.2",
      ...(options.headers ?? {})
    },
    signal: AbortSignal.timeout(20000)
  });
  if (!response.ok) throw new Error(`HTTP ${response.status} ${url}`);
  return response.json();
}

function existingTitles() {
  const values = [];
  for (const file of walk(path.join(root, "data")).filter((item) => item.endsWith(".json"))) {
    try {
      const data = JSON.parse(fs.readFileSync(file, "utf8"));
      for (const value of [data.title, data.name, data.phenomenon?.title]) if (value) values.push(value);
    } catch {}
  }
  return values;
}

function evaluate(issue, knownTitles) {
  const body = String(issue.body ?? "");
  const title = valueLine(body, "Title") ?? issue.title.replace(/^\[AUTO-RESEARCH\]\s*/, "");
  const locator = valueLine(body, "Locator");
  const lane = meta(body, "JIZZ-RESEARCH-LANE") ?? "unknown";
  const baseScore = Number(meta(body, "JIZZ-RESEARCH-SCORE") ?? 0);
  const duplicate = isDuplicateTitle(title, knownTitles);
  return { title, locator, lane, duplicate, ...stewardDecision({ baseScore, hasLocator: Boolean(locator), duplicate }) };
}

function makeCandidate(issue, decision) {
  const body = String(issue.body ?? "");
  const topic = topicById.get(decision.lane) ?? {};
  const now = new Date().toISOString();
  return {
    schema_version: "jizz.candidate.v0.1",
    candidate_id: candidateId(decision.lane, decision.title),
    domain: "PERSPECTIVE",
    title: decision.title,
    candidate_type: topic.candidate_type ?? "perspective research lead",
    zone_hint: topic.zone_hint ?? "GLOBAL",
    discovery: {
      summary: `Automatically discovered public-discourse lead: ${decision.title}`,
      why_relevant: `JIZZ Steward score ${decision.score}/100. This remains staging metadata until the source is inspected and source-scoped observations are extracted.`,
      discovered_at: now,
      search_terms: [valueLine(body, "Query") ?? decision.lane],
      lane_id: decision.lane
    },
    sources: [{
      title: decision.title,
      locator: decision.locator,
      source_type: "news_metadata",
      authority: "discovery_only",
      publisher: valueLine(body, "Publisher") === "unknown" ? null : valueLine(body, "Publisher"),
      country: valueLine(body, "Country") === "unknown" ? null : valueLine(body, "Country"),
      language: valueLine(body, "Language") === "unknown" ? null : valueLine(body, "Language"),
      published_at: valueLine(body, "Published") === "unknown" ? null : valueLine(body, "Published")
    }],
    duplicate_check: { checked: true, possible_matches: [] },
    status: "needs_sources",
    notes: `Auto-staged from GitHub issue #${issue.number}. Discovery metadata is not a canonical observation or perspective.`
  };
}

async function patchIssue(issue, decision) {
  const marker = "## JIZZ Steward review";
  let body = String(issue.body ?? "").split(marker)[0].trim();
  body += [
    "",
    "",
    marker,
    "",
    `- **Steward score:** ${decision.score}/100`,
    `- **Duplicate:** ${decision.duplicate}`,
    `- **Decision:** ${decision.action}`,
    `- **Reviewed at:** ${new Date().toISOString()}`,
    "",
    `JIZZ-RESEARCH-STATE:${decision.action}`
  ].join("\n");

  const [owner, name] = repo.split("/");
  await jfetch(`https://api.github.com/repos/${owner}/${name}/issues/${issue.number}`, {
    method: "PATCH",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
      "x-github-api-version": "2022-11-28"
    },
    body: JSON.stringify({ body })
  });
}

const [owner, name] = repo.split("/");
const issues = await jfetch(`https://api.github.com/repos/${owner}/${name}/issues?state=open&per_page=100`, {
  headers: {
    authorization: `Bearer ${token}`,
    "x-github-api-version": "2022-11-28"
  }
});

const knownTitles = existingTitles();
let reviewed = 0;
let staged = 0;

for (const issue of issues.filter((item) => !item.pull_request && item.title.startsWith("[AUTO-RESEARCH]"))) {
  const currentState = meta(issue.body, "JIZZ-RESEARCH-STATE");
  if (currentState && currentState !== "discovered") continue;

  const decision = evaluate(issue, knownTitles);
  await patchIssue(issue, decision);
  reviewed += 1;

  if (decision.action === "stage_candidate") {
    const candidate = makeCandidate(issue, decision);
    const file = path.join(root, "data/candidates", `${candidate.candidate_id}.json`);
    if (!fs.existsSync(file)) {
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, JSON.stringify(candidate, null, 2) + "\n");
      knownTitles.push(candidate.title);
      staged += 1;
    }
  }
}

console.log(`JIZZ steward: reviewed=${reviewed} staged=${staged}`);
