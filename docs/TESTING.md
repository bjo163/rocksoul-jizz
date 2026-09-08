# Testing

Run:

```bash
npm install
npm run ci
```

`npm run ci` rebuilds the deterministic research index, validates repository data/contracts, and runs Node tests.

## Research automation tests

Research tests cover:

- GDELT article metadata normalization;
- deterministic candidate IDs;
- discovery scoring;
- duplicate-title detection;
- Steward decisions;
- candidate schema validation through the main validator;
- research-index count consistency.

No network is required for CI. The Scout's external GDELT call occurs only during scheduled/manual research runs.

## Domain isolation

Local records remain `domain: PERSPECTIVE`; EVENT, PERSON, STORY, TEXT, LAW, and correlation ownership remain external.

## Temporal integrity

Tests verify old perspectives remain queryable and stored snapshots can be reconstructed from their temporal raw records.

## Provenance

The golden insight resolves through signal/change to observations and sources with methodology, confidence, coverage, and version information.

## API

Regression tests ensure semantic phenomenon resources exist while generic `/everything` or fact-oracle endpoints do not.
