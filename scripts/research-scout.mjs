import fs from "node:fs";
import path from "node:path";
import { clean, leadFingerprint, normalizeGdeltArticle, scoreLead } from "../src/research.mjs";

const root = process.cwd();
const config = JSON.parse(fs.readFileSync(path.join(root, "data/research-scout/topics.json"), "utf8"));
const repo = process.env.GITHUB_REPOSITORY;
const token = process.env.GITHUB_TOKEN;
const laneFilter = process.env.RESEARCH_SCOUT_LANE ?? "";
const maxNew = Number(process.env.RESEARCH_SCOUT_MAX_NEW ?? config.max_new_issues_per_run ?? 4);
const outputPath = process.env.RESEARCH_SCOUT_OUTPUT ?? "";
const dryRun = process.env.RESEARCH_SCOUT_DRY_RUN === "1" || (!outputPath && (!repo || !token));
const findings = [];

async function jfetch(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      accept: "application/json",
      "user-agent": "rocksoul-jizz-scout/0.2",
      ...(options.headers ?? {})
    },
    signal: AbortSignal.timeout(20000)
  });
  if (!response.ok) throw new Error(`HTTP ${response.status} ${url}`);
  return response.json();
}

async function gdelt(query) {
  const url = new URL("https://api.gdeltproject.org/api/v2/doc/doc");
  url.searchParams.set("query", query);
  url.searchParams.set("mode", "artlist");
  url.searchParams.set("format", "json");
  url.searchParams.set("sort", "datedesc");
  url.searchParams.set("maxrecords", "40");
  url.searchParams.set("timespan", config.timespan ?? "7d");
  const data = await jfetch(url);
  return (data.articles ?? []).map(normalizeGdeltArticle).filter((item) => item.title && item.url);
}

async function seenFingerprints() {
  const seen = new Set();
  if (dryRun || outputPath) return seen;
  const [owner, name] = repo.split("/");
  for (let page = 1; page <= 5; page += 1) {
    const issues = await jfetch(`https://api.github.com/repos/${owner}/${name}/issues?state=all&per_page=100&page=${page}`, {
      headers: {
        authorization: `Bearer ${token}`,
        "x-github-api-version": "2022-11-28"
      }
    });
    for (const issue of issues) {
      for (const match of String(issue.body ?? "").matchAll(/(?:ROCKSOUL-RESEARCH-FP|JIZZ-RESEARCH-FP):([a-f0-9]{16})/g)) {
        seen.add(match[1]);
      }
    }
    if (issues.length < 100) break;
  }
  return seen;
}

function issueBody(topic, query, lead, fingerprint) {
  return [
    "![ROCKSOUL PERSPECTIVE research](https://raw.githubusercontent.com/bjo163/rocksoul-assets/main/moonwitness/cinematic-hero-pack/png/data-observatory.png)",
    "",
    "## Research Card",
    "",
    "| Field | Value |",
    "|---|---|",
    "| Domain | **PERSPECTIVE** |",
    "| Canonical owner | \`rocksoul-jizz\` |",
    "| State | \`discovered\` |",
    `| Lane | \`${topic.id}\` |`,
    "| Origin | \`jizz-gdelt-scout\` |",
    "",
    "## Research Question",
    "",
    "> **How is the world seeing it?**",
    "",
    `Observe whether **${clean(lead.title)}** contributes a distinct actor/context view within the ${topic.id} lane.`,
    "",
    "## Why This Matters",
    "",
    "This lead may reveal a new framing, reaction, actor position, attention shift, or geographic/language perspective. Discovery metadata is not enough for canonical extraction.",
    "",
    "## Discovery Snapshot",
    "",
    `- **Title:** ${clean(lead.title)}`,
    `- **Publisher:** ${lead.publisher ?? "unknown"}`,
    `- **Country:** ${lead.country ?? "unknown"}`,
    `- **Language:** ${lead.language ?? "unknown"}`,
    `- **Published:** ${lead.published_at ?? "unknown"}`,
    `- **Locator:** ${lead.url}`,
    `- **Discovery score:** ${scoreLead(lead)}`,
    `- **Query:** ${query}`,
    "",
    "## Source Candidates",
    "",
    "| Source | Actor / publisher | Geography | Language | Link / locator | What it may support |",
    "|---|---|---|---|---|---|",
    `| ${clean(lead.title).replace(/\\|/g,"\\\\|")} | ${lead.publisher ?? "unknown"} | ${lead.country ?? "unknown"} | ${lead.language ?? "unknown"} | ${lead.url} | Source-scoped observation / framing candidate |`,
    "",
    "## PERSPECTIVE Lens",
    "",
    `- **Suggested candidate type:** ${topic.candidate_type}`,
    `- **Zone hint:** ${topic.zone_hint}`,
    "- Inspect actor class, audience, framing, position, reaction, salience, language and geography.",
    "- Do not infer consensus from article count or publisher repetition.",
    "",
    "## Counterevidence & Uncertainty",
    "",
    "- Actual article/source content not yet inspected.",
    "- Headline and metadata may misrepresent the full framing.",
    "- Missing context, counter-statements and alternative actor views remain unknown.",
    "",
    "## Coverage Gaps / Missing Voices",
    "",
    "- Check whether the field overrepresents one geography, language, publisher class or institutional viewpoint.",
    "- Seek materially different actor classes when the phenomenon is promoted.",
    "",
    "## Duplicate Check",
    "",
    "- [ ] Existing research issues checked",
    "- [ ] Existing candidates checked",
    "- [ ] Existing phenomena checked",
    "- [ ] Existing perspective records checked",
    "",
    "## Cross-Domain Routing",
    "",
    "Route STORY/EVENT/PERSON/TEXT/LAW questions to their owners. Queue possible RELATIONSHIP work for Correlation only after domain evidence exists.",
    "",
    "## Steward Gate",
    "",
    "- [x] Issue exists before candidate work",
    "- [ ] Actual source content inspected",
    "- [x] Discovery metadata marked non-canonical",
    "- [x] PERSPECTIVE ownership boundary preserved",
    "",
    "## Suggested Next Action",
    "",
    "- [x] Steward triage required",
    "- [ ] Stage needs_sources candidate",
    "- [ ] Inspect source",
    "- [ ] Extract SOURCE + OBSERVATION",
    "- [ ] Resolve PHENOMENON",
    "- [ ] Prepare PERSPECTIVE / FRAMING / REACTION",
    "- [ ] Reject / duplicate",
    "",
    "## Machine Metadata",
    "",
    "\`\`\`text",
    "ROCKSOUL-RESEARCH-CONTRACT:v1",
    "ROCKSOUL-RESEARCH-DOMAIN:PERSPECTIVE",
    "ROCKSOUL-RESEARCH-OWNER:rocksoul-jizz",
    "ROCKSOUL-RESEARCH-ORIGIN:jizz-gdelt-scout",
    `ROCKSOUL-RESEARCH-FP:${fingerprint}`,
    "ROCKSOUL-RESEARCH-STATE:discovered",
    `JIZZ-RESEARCH-FP:${fingerprint}`,
    `JIZZ-RESEARCH-LANE:${topic.id}`,
    `JIZZ-RESEARCH-SCORE:${scoreLead(lead)}`,
    "JIZZ-RESEARCH-STATE:discovered",
    "\`\`\`",
    "",
    "> **ISSUE FIRST. SOURCE SECOND. CANON LAST.**"
  ].join("\\n");
}

async function createIssue(topic, query, lead, fingerprint) {
  const finding = { topic, query, lead, fingerprint, score: scoreLead(lead) };
  if (outputPath) {
    findings.push(finding);
    return;
  }

  const payload = {
    title: `[AUTO-RESEARCH] PERSPECTIVE · ${clean(lead.title).slice(0, 92)}`,
    body: issueBody(topic, query, lead, fingerprint)
  };

  if (dryRun) {
    console.log(JSON.stringify(payload, null, 2));
    return;
  }

  const [owner, name] = repo.split("/");
  await jfetch(`https://api.github.com/repos/${owner}/${name}/issues`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
      "x-github-api-version": "2022-11-28"
    },
    body: JSON.stringify(payload)
  });
}

const seen = await seenFingerprints();
const topics = config.topics.filter((topic) => !laneFilter || topic.id === laneFilter);
const day = Math.floor(Date.now() / 86400000);
const offset = topics.length ? day % topics.length : 0;
const orderedTopics = laneFilter ? topics : [...topics.slice(offset), ...topics.slice(0, offset)];
let created = 0;

for (const topic of orderedTopics) {
  if (created >= maxNew) break;
  const query = topic.queries[(day + topic.id.length) % topic.queries.length];

  let pool = [];
  try {
    pool = await gdelt(query);
  } catch (error) {
    console.error(`Scout lane ${topic.id} failed: ${error.message}`);
    continue;
  }

  const unique = new Map();
  for (const lead of pool.sort((a, b) => scoreLead(b) - scoreLead(a))) {
    const key = lead.url.toLowerCase();
    if (!unique.has(key)) unique.set(key, lead);
  }

  for (const lead of unique.values()) {
    const fingerprint = leadFingerprint(lead);
    if (seen.has(fingerprint)) continue;
    await createIssue(topic, query, lead, fingerprint);
    seen.add(fingerprint);
    created += 1;
    break;
  }
}

if (outputPath) {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(findings, null, 2) + "\n");
}

console.log(`JIZZ scout: lane=${laneFilter || "all"} created=${created} dry_run=${dryRun}`);
