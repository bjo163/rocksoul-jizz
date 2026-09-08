# API

The repository ships a dependency-free Node 22 read-only demonstration API backed by the golden fixture.

Run:

```bash
npm run start
```

Default bind: `127.0.0.1:8787`.

## Endpoints

```text
GET /health
GET /phenomena/:id

GET /phenomena/:id/observations
GET /phenomena/:id/perspectives
GET /phenomena/:id/framings
GET /phenomena/:id/reactions
GET /phenomena/:id/signals
GET /phenomena/:id/changes
GET /phenomena/:id/snapshots
GET /phenomena/:id/insights
GET /phenomena/:id/foreign-references
```

Unknown resources return 404. Non-GET methods return 405.

The API intentionally does not expose `/everything`, `/facts/:id`, or `/world-object/:id`; those routes encourage semantic collapse.

## Production direction

A production service may project the same record contracts into PostgreSQL using `db/001_initial.sql`. API resources should remain semantic even if storage/indexing changes.
