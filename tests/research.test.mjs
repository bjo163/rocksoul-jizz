import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  candidateId,
  isDuplicateTitle,
  normalizeGdeltArticle,
  parseGdeltDate,
  scoreLead,
  stewardDecision
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


test("generic research issue lifecycle maps deterministic Steward decisions",()=>{
  const steward=fs.readFileSync(path.join(process.cwd(),"scripts/research-steward.mjs"),"utf8");
  assert.match(steward,/stage_candidate[^\n]+needs_sources/);
  assert.match(steward,/hold[^\n]+triaged/);
  assert.match(steward,/ROCKSOUL-RESEARCH-STATE/);
  assert.match(steward,/state_reason[^\n]+not_planned/);
});
