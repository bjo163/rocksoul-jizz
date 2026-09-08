# JIZZ Steward Automation

JIZZ follows a simple MFTL-style automation on `main`:

```text
TOPICS
  ↓
SCOUT
  ↓
RESEARCH ISSUE
  ↓
STEWARD TRIAGE
  ↓
NEEDS_SOURCES CANDIDATE
  ↓
VALIDATE + INDEX + TEST
```

## Scout

`scripts/research-scout.mjs`:

- rotates configured queries;
- searches GDELT DOC 2.0;
- normalizes article metadata;
- scores completeness;
- fingerprints and de-duplicates prior issues;
- opens at most a small number of `[AUTO-RESEARCH]` issues.

## Steward

`scripts/research-steward.mjs`:

- reviews only newly discovered auto-research issues;
- checks duplicate titles against repository data;
- performs a small deterministic score;
- records `duplicate`, `hold`, `needs_sources`, or `stage_candidate`;
- writes only `needs_sources` candidates when the lead clears the gate.

## Canonical boundary

No scheduled step promotes a candidate to SOURCE, OBSERVATION, PHENOMENON, PERSPECTIVE, FRAMING, or REACTION.

That promotion requires actual source inspection and provenance-bearing extraction.

## Workflow

`.github/workflows/automatic-research.yml` runs daily at 09:17 Asia/Jakarta. If Steward creates candidate files, the workflow validates them, rebuilds the research index, and commits only candidate/index changes.
