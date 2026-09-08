# Interoperability

## Qualified references

Accepted namespace prefixes:

```text
mftl:
legend:
superhero:
rgbl:
aws:
correlation:
```

Examples of syntactically qualified references:

```text
mftl:MYTH-...
legend:EVT-...
superhero:PER-...
rgbl:mw:work:...
aws:LAW-...
correlation:CORR-...
```

Syntax acceptance is not existence verification.

## Foreign reference fields

```text
repository
external_id
foreign_record_type
relation
resolution
verification_state
verified_at
provenance_id
```

Verification state is explicit. JIZZ must not infer canonical identity from name, spelling, URL, title, keyword overlap, or vector similarity alone.

## Cross-repo references

A `CROSS_REPO_REFERENCE` connects one local JIZZ record to one stored foreign reference for a bounded use:

```text
SUBJECT
ACTOR
CONTEXT
CORRELATION_POINTER
```

This is a pointer contract, not a relationship research graph.

## Availability policy

Local CI validates namespace syntax and local reference integrity without network access. External existence can be checked during research, audit, scheduled validation, or release certification.

A temporarily unavailable owning repository must not break local schema compilation.
