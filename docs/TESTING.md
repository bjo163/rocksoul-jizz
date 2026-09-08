# Testing

Run all local checks:

```bash
npm run ci
```

No external repository or network is required.

## Domain isolation

Tests and validation ensure local records remain `domain: PERSPECTIVE`, reject foreign-domain local record types, bound qualified namespaces, and flag suspicious schema/data structures associated with EVENT, PERSON, STORY, TEXT, LAW, or global correlation ownership.

## Temporal integrity

Tests verify:

- older perspectives remain queryable after later perspectives appear;
- validity intervals produce different T1/T2 active sets;
- stored snapshots reconstruct from raw temporal records;
- historical perspective records are not overwritten.

## Provenance

The golden insight must resolve through signal/change to observations and then to sources, with methodology, version, confidence, coverage, and timestamps preserved.

## Identity safety

Qualified foreign namespaces are parsed explicitly. Unsupported namespaces are rejected. Foreign existence is not assumed merely because syntax is valid.

## Interoperability

Local CI validates syntax and local graph integrity without requiring remote owner repositories.

## API

Regression tests ensure semantic phenomenon endpoints exist while generic fact/everything endpoints do not.
