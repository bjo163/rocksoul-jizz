# Automatic Research Scout

JIZZ owns a small continuous discovery loop for **public perspective leads**.

The scheduled workflow runs daily at **02:17 UTC / 09:17 Asia/Jakarta** and can also be triggered manually.

```text
GDELT NEWS DISCOVERY
        ↓
[AUTO-RESEARCH] ISSUE
        ↓
JIZZ STEWARD
        ↓
DISCOVERY CANDIDATE
        ↓
SOURCE INSPECTION
        ↓
SOURCE + OBSERVATION
        ↓
PHENOMENON RESOLUTION
        ↓
PERSPECTIVE / FRAMING / REACTION
        ↓
SIGNAL / CHANGE / SNAPSHOT / INSIGHT
```

## Hard boundary

Scout and Steward may automatically discover, de-duplicate, score, open issues, and stage `needs_sources` candidates.

They do **not** automatically create canonical observations or perspectives, declare an article correct, infer consensus, or turn article volume into truth.

## Discovery provider

The v0.2 Scout uses the GDELT DOC 2.0 article-list API because JIZZ studies how public discourse is framed across publishers, countries, and languages.

GDELT metadata is discovery input only. The underlying article still requires inspection before canonical extraction.

## Lanes

Research lanes live in `data/research-scout/topics.json`. They are configuration, not ontology. New lanes can be added without changing JIZZ's core schemas when they still produce perspective research leads.
