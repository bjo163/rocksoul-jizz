import fs from "node:fs";
import path from "node:path";
import {
  candidateId,
  clean,
  countLifecycle,
  isDuplicateTitle,
  rankResearchIssues,
  stewardDecision,
  wipPressure
} from "../src/research.mjs";

const root = process.cwd();
const repo = process.env.GITHUB_REPOSITORY;
const token = process.env.GITHUB_TOKEN;
if (!repo || !token) throw new Error("GITHUB_REPOSITORY and GITHUB_TOKEN are required");

const topicConfig = JSON.parse(fs.readFileSync(path.join(root, "data/research-scout/topics.json"), "utf8"));
const topicById = new Map(topicConfig.topics.map((topic) => [topic.id, topic]));
const runTimestamp = new Date().toISOString();
const runId = `JIZZ-STEW-${runTimestamp.replace(/[^0-9]/g, "").slice(0, 14)}`;

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
      "user-agent": "rocksoul-jizz-steward/0.3",
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

function candidateCount() {
  return walk(path.join(root, "data/candidates")).filter((item) => item.endsWith(".json")).length;
}

function evaluate(issue, knownTitles) {
  const body = String(issue.body ?? "");
  const title = valueLine(body, "Title") ?? issue.title.replace(/^\[AUTO-RESEARCH\](?:\s+PERSPECTIVE\s+·)?\s*/, "");
  const locator = valueLine(body, "Locator");
  const lane = meta(body, "JIZZ-RESEARCH-LANE") ?? "unknown";
  const baseScore = Number(meta(body, "JIZZ-RESEARCH-SCORE") ?? 0);
  const duplicate = isDuplicateTitle(title, knownTitles);
  const state = meta(body, "ROCKSOUL-RESEARCH-STATE") ?? meta(body, "JIZZ-RESEARCH-STATE") ?? "discovered";
  return { title, locator, lane, duplicate, state, ...stewardDecision({ baseScore, hasLocator: Boolean(locator), duplicate }) };
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

async function patchIssue(issue, { state, decisionLabel, score, duplicate, close = false }) {
  const marker = "## JIZZ Steward review";
  let body = String(issue.body ?? "").split(marker)[0].trim();
  body += [
    "",
    "",
    marker,
    "",
    `- **Steward score:** ${score}/100`,
    `- **Duplicate:** ${duplicate}`,
    `- **Decision:** ${decisionLabel}`,
    `- **Reviewed at:** ${new Date().toISOString()}`,
    "",
    `ROCKSOUL-RESEARCH-STATE:${state}`,
    `JIZZ-RESEARCH-STATE:${decisionLabel}`
  ].join("\n");

  const [owner, name] = repo.split("/");
  await jfetch(`https://api.github.com/repos/${owner}/${name}/issues/${issue.number}`, {
    method: "PATCH",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
      "x-github-api-version": "2022-11-28"
    },
    body: JSON.stringify({ body, ...(close ? { state: "closed", state_reason: "not_planned" } : {}) })
  });
}

function researchSignal(issue, action, before, after, headline, nextGate, evidence = []) {
  return {
    run_id: runId,
    timestamp: new Date().toISOString(),
    slot: "perspective-bootstrap",
    action,
    domain: "PERSPECTIVE",
    repository: "rocksoul-jizz",
    headline,
    why_it_matters: "Progress existing evidence-bearing PERSPECTIVE work before accumulating another discovery envelope.",
    evidence_gain: action === "ADVANCED" || action === "STAGED" ? 10 : 0,
    cross_domain_value: 0,
    novelty: action === "STAGED" ? 5 : 0,
    lifecycle_before: before,
    lifecycle_after: after,
    related_domains: [],
    relationship_handoff: null,
    next_gate: nextGate,
    evidence: [`issue:#${issue.number}`, ...evidence]
  };
}

const [owner, name] = repo.split("/");
const issues = await jfetch(`https://api.github.com/repos/${owner}/${name}/issues?state=open&per_page=100`, {
  headers: {
    authorization: `Bearer ${token}`,
    "x-github-api-version": "2022-11-28"
  }
});

const researchIssues = issues.filter((item) => !item.pull_request && item.title.startsWith("[AUTO-RESEARCH]"));
const knownTitles = existingTitles();
const evaluated = researchIssues.map((issue) => ({ issue, decision: evaluate(issue, knownTitles) }));
const counts = countLifecycle(evaluated.map(({ decision }) => decision.state));
const pressure = wipPressure({ counts, candidateCount: candidateCount() });
const ranked = rankResearchIssues(evaluated.map(({ issue, decision }) => ({
  id: issue.number,
  state: decision.state,
  evidenceGain: decision.locator ? 10 : 0,
  noveltyValue: decision.duplicate ? 0 : 8,
  issue,
  decision
})), { pressure });

let reviewed = 0;
let staged = 0;
let advanced = 0;
const signals = [];

for (const item of ranked) {
  const { issue, decision } = item;
  const currentState = decision.state;

  if (currentState === "source_inspected" && decision.locator && !decision.duplicate) {
    await patchIssue(issue, {
      state: "ready_for_observation",
      decisionLabel: "advance_ready_for_observation",
      score: item.rps,
      duplicate: false
    });
    reviewed += 1;
    advanced += 1;
    signals.push(researchSignal(issue, "ADVANCED", currentState, "ready_for_observation", decision.title, "SOURCE_SCOPED_OBSERVATION", [decision.locator]));
    continue;
  }

  if (currentState !== "discovered") {
    reviewed += 1;
    const nextGate = currentState === "ready_for_observation"
      ? "SOURCE_SCOPED_OBSERVATION"
      : currentState === "needs_sources"
        ? "SOURCE_INSPECTION"
        : "EVIDENCE_GATE_REVIEW";
    signals.push(researchSignal(issue, "BLOCKED", currentState, currentState, decision.title, nextGate, decision.locator ? [decision.locator] : []));
    continue;
  }

  if (pressure.suppressDiscovery) {
    signals.push(researchSignal(issue, "NO_UPDATE", currentState, currentState, decision.title, "PROGRESS_EXISTING_WIP", [
      `actionable:${pressure.actionable}`,
      `candidates:${pressure.candidateCount}`,
      `candidate_lag:${pressure.candidateLag}`
    ]));
    continue;
  }

  const issueState = decision.action === "stage_candidate" ? "needs_sources" : decision.action === "hold" ? "triaged" : decision.action;
  await patchIssue(issue, {
    state: issueState,
    decisionLabel: decision.action,
    score: item.rps,
    duplicate: decision.duplicate,
    close: decision.action === "duplicate"
  });
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
    signals.push(researchSignal(issue, "STAGED", currentState, "needs_sources", decision.title, "SOURCE_INSPECTION", decision.locator ? [decision.locator] : []));
  } else {
    signals.push(researchSignal(issue, decision.action === "duplicate" ? "NO_UPDATE" : "BLOCKED", currentState, issueState, decision.title, issueState === "triaged" ? "TRIAGE_REVIEW" : "SOURCE_INSPECTION", decision.locator ? [decision.locator] : []));
  }
}

console.log(JSON.stringify({ schema_version: "rocksoul.research-signal-batch.v1", run_id: runId, signals }, null, 2));
console.log(`JIZZ steward: reviewed=${reviewed} advanced=${advanced} staged=${staged} actionable=${pressure.actionable} discovery_suppressed=${pressure.suppressDiscovery}`);
