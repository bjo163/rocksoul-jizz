import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  candidateId,
  countLifecycle,
  diversityRedundancyPenalty,
  isDuplicateTitle,
  normalizeGdeltArticle,
  parseGdeltDate,
  rankResearchIssues,
  rpsV1,
  scoreLead,
  stewardDecision,
  wipPressure
} from "../src/research.mjs";

test("GDELT article metadata normalizes into a perspective discovery lead", () => {
  const lead = normalizeGdeltArticle({
    title: " Example perspective article ",
    url: "https://example.com/article",
    domain: "example.com",
    sourcecountry: "Indonesia",
    language: "English",
    seendate: "20260908T061500Z"
  });
  assert.equal(lead.publisher, "example.com");
  assert.equal(lead.country, "Indonesia");
  assert.equal(lead.published_at, "2026-09-08T06:15:00Z");
  assert.ok(scoreLead(lead) >= 70);
});

test("research dates and candidate IDs are deterministic", () => {
  assert.equal(parseGdeltDate("20260908T061500Z"), "2026-09-08T06:15:00Z");
  assert.equal(
    candidateId("ai-workforce-discourse", "Example title"),
    candidateId("ai-workforce-discourse", "Example title")
  );
});

test("steward stages strong non-duplicate leads but rejects duplicate ownership", () => {
  assert.equal(stewardDecision({ baseScore: 90, hasLocator: true, duplicate: false }).action, "stage_candidate");
  assert.equal(stewardDecision({ baseScore: 90, hasLocator: true, duplicate: true }).action, "duplicate");
  assert.equal(isDuplicateTitle("AI workforce reduction", ["AI workforce reduction"]), true);
});

test("generic research issue lifecycle maps deterministic Steward decisions", () => {
  const steward = fs.readFileSync(path.join(process.cwd(), "scripts/research-steward.mjs"), "utf8");
  assert.match(steward, /stage_candidate[^\n]+needs_sources/);
  assert.match(steward, /source_inspected/);
  assert.match(steward, /ready_for_observation/);
  assert.match(steward, /ROCKSOUL-RESEARCH-STATE/);
  assert.match(steward, /state_reason[^\n]+not_planned/);
  assert.match(steward, /rocksoul\.research-signal-batch\.v1/);
});

test("progression-first ranking places inspected work ahead of new discovery", () => {
  const ranked = rankResearchIssues([
    { id: 2, state: "discovered", noveltyValue: 20 },
    { id: 1, state: "source_inspected", evidenceGain: 10 }
  ], { candidateCount: 0, softLimit: 8, hardLimit: 16 });
  assert.equal(ranked[0].id, 1);
  assert.equal(ranked[0].state, "source_inspected");
});

test("WIP candidate lag suppresses routine discovery", () => {
  const counts = countLifecycle([
    "source_inspected",
    "source_inspected",
    "source_inspected",
    "ready_for_observation",
    "discovered"
  ]);
  const pressure = wipPressure({ counts, candidateCount: 0 });
  assert.equal(pressure.candidateLag, true);
  assert.equal(pressure.suppressDiscovery, true);
  assert.ok(rpsV1({ state: "discovered", noveltyValue: 20, discovery: true, pressure }) < rpsV1({ state: "source_inspected", evidenceGain: 10, pressure }));
});

test("repeated similar sources do not count as diversity", () => {
  const penalty = diversityRedundancyPenalty([
    { publisher: "example.com", country: "ID", language: "English" },
    { publisher: "example.com", country: "ID", language: "English" },
    { publisher: "example.com", country: "ID", language: "English" }
  ]);
  assert.ok(penalty > 0);
  assert.equal(diversityRedundancyPenalty([{ publisher: "a" }]), 0);
});
