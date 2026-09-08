-- JIZZ normalized relational target (PostgreSQL-oriented).
-- Canonical semantics remain in versioned records; this schema is a storage contract, not a truth oracle.

CREATE TABLE research_runs (
  id text PRIMARY KEY,
  schema_version text NOT NULL,
  started_at timestamptz NOT NULL,
  completed_at timestamptz,
  status text NOT NULL,
  coverage numeric,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE methodologies (
  id text PRIMARY KEY,
  schema_version text NOT NULL,
  name text NOT NULL,
  version text NOT NULL,
  formulae jsonb NOT NULL,
  normalization text NOT NULL,
  description text NOT NULL,
  created_at timestamptz NOT NULL
);

CREATE TABLE provenance (
  id text PRIMARY KEY,
  schema_version text NOT NULL,
  research_run_id text REFERENCES research_runs(id),
  notes text,
  created_at timestamptz NOT NULL
);

CREATE TABLE sources (
  id text PRIMARY KEY,
  schema_version text NOT NULL,
  source_type text NOT NULL,
  publisher text NOT NULL,
  author text,
  organization text,
  url text,
  published_at timestamptz NOT NULL,
  retrieved_at timestamptz NOT NULL,
  language text NOT NULL,
  country text,
  region text,
  content_hash text NOT NULL,
  freshness text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  provenance_id text NOT NULL REFERENCES provenance(id)
);

CREATE TABLE phenomena (
  id text PRIMARY KEY,
  schema_version text NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  zone text NOT NULL,
  created_at timestamptz NOT NULL,
  provenance_id text NOT NULL REFERENCES provenance(id)
);

CREATE TABLE observations (
  id text PRIMARY KEY,
  schema_version text NOT NULL,
  source_id text NOT NULL REFERENCES sources(id),
  phenomenon_id text NOT NULL REFERENCES phenomena(id),
  observed_at timestamptz NOT NULL,
  published_at timestamptz NOT NULL,
  observation_type text NOT NULL,
  actor_reference text,
  subject_reference text,
  extracted_signal text,
  raw_reference jsonb NOT NULL,
  language text NOT NULL,
  geography text NOT NULL,
  provenance_id text NOT NULL REFERENCES provenance(id)
);

CREATE TABLE perspectives (
  id text PRIMARY KEY,
  schema_version text NOT NULL,
  phenomenon_id text NOT NULL REFERENCES phenomena(id),
  actor_reference text NOT NULL,
  actor_type text NOT NULL,
  zone text NOT NULL,
  geography text,
  audience_scope text,
  summary text,
  position text NOT NULL,
  salience numeric,
  observed_at timestamptz NOT NULL,
  valid_from timestamptz NOT NULL,
  valid_until timestamptz,
  provenance_id text NOT NULL REFERENCES provenance(id)
);

CREATE TABLE perspective_observations (
  perspective_id text NOT NULL REFERENCES perspectives(id),
  observation_id text NOT NULL REFERENCES observations(id),
  PRIMARY KEY (perspective_id, observation_id)
);

CREATE TABLE framings (
  id text PRIMARY KEY,
  schema_version text NOT NULL,
  phenomenon_id text NOT NULL REFERENCES phenomena(id),
  perspective_id text NOT NULL REFERENCES perspectives(id),
  dimension text NOT NULL,
  label text NOT NULL,
  observed_at timestamptz NOT NULL,
  valid_from timestamptz NOT NULL,
  valid_until timestamptz,
  provenance_id text NOT NULL REFERENCES provenance(id)
);

CREATE TABLE reactions (
  id text PRIMARY KEY,
  schema_version text NOT NULL,
  phenomenon_id text NOT NULL REFERENCES phenomena(id),
  actor_reference text NOT NULL,
  reaction_type text NOT NULL,
  sentiment text,
  observed_at timestamptz NOT NULL,
  provenance_id text NOT NULL REFERENCES provenance(id)
);

CREATE TABLE reaction_observations (
  reaction_id text NOT NULL REFERENCES reactions(id),
  observation_id text NOT NULL REFERENCES observations(id),
  PRIMARY KEY (reaction_id, observation_id)
);

CREATE TABLE signals (
  id text PRIMARY KEY,
  schema_version text NOT NULL,
  phenomenon_id text NOT NULL REFERENCES phenomena(id),
  signal_type text NOT NULL,
  methodology_id text NOT NULL REFERENCES methodologies(id),
  algorithm_version text NOT NULL,
  confidence numeric NOT NULL,
  signal_at timestamptz NOT NULL,
  rationale text,
  provenance_id text NOT NULL REFERENCES provenance(id)
);

CREATE TABLE signal_observations (
  signal_id text NOT NULL REFERENCES signals(id),
  observation_id text NOT NULL REFERENCES observations(id),
  PRIMARY KEY (signal_id, observation_id)
);

CREATE TABLE changes (
  id text PRIMARY KEY,
  schema_version text NOT NULL,
  phenomenon_id text NOT NULL REFERENCES phenomena(id),
  valid_from timestamptz NOT NULL,
  valid_to timestamptz NOT NULL,
  dimensions jsonb NOT NULL,
  methodology_id text NOT NULL REFERENCES methodologies(id),
  algorithm_version text NOT NULL,
  confidence numeric NOT NULL,
  summary text,
  generated_at timestamptz NOT NULL,
  provenance_id text NOT NULL REFERENCES provenance(id)
);

CREATE TABLE perspective_snapshots (
  id text PRIMARY KEY,
  schema_version text NOT NULL,
  phenomenon_id text NOT NULL REFERENCES phenomena(id),
  snapshot_at timestamptz NOT NULL,
  observation_count integer NOT NULL,
  source_count integer NOT NULL,
  actor_count integer NOT NULL,
  geography_count integer NOT NULL,
  perspective_count integer NOT NULL,
  framing_distribution jsonb NOT NULL,
  position_distribution jsonb NOT NULL,
  metrics jsonb NOT NULL,
  uncertainty numeric NOT NULL,
  methodology_id text NOT NULL REFERENCES methodologies(id),
  generated_at timestamptz NOT NULL,
  provenance_id text NOT NULL REFERENCES provenance(id)
);

CREATE TABLE trends (
  id text PRIMARY KEY,
  schema_version text NOT NULL,
  phenomenon_id text NOT NULL REFERENCES phenomena(id),
  state text NOT NULL,
  methodology_id text NOT NULL REFERENCES methodologies(id),
  confidence numeric NOT NULL,
  generated_at timestamptz NOT NULL,
  provenance_id text NOT NULL REFERENCES provenance(id)
);

CREATE TABLE patterns (
  id text PRIMARY KEY,
  schema_version text NOT NULL,
  phenomenon_id text NOT NULL REFERENCES phenomena(id),
  pattern_type text NOT NULL,
  description text NOT NULL,
  methodology_id text NOT NULL REFERENCES methodologies(id),
  confidence numeric NOT NULL,
  generated_at timestamptz NOT NULL,
  provenance_id text NOT NULL REFERENCES provenance(id)
);

CREATE TABLE insights (
  id text PRIMARY KEY,
  schema_version text NOT NULL,
  phenomenon_id text NOT NULL REFERENCES phenomena(id),
  insight_text text NOT NULL,
  methodology_id text NOT NULL REFERENCES methodologies(id),
  algorithm_version text NOT NULL,
  confidence numeric NOT NULL,
  coverage numeric NOT NULL,
  generated_at timestamptz NOT NULL,
  provenance_id text NOT NULL REFERENCES provenance(id)
);

CREATE TABLE foreign_references (
  id text PRIMARY KEY,
  schema_version text NOT NULL,
  repository text NOT NULL,
  external_id text NOT NULL,
  foreign_record_type text NOT NULL,
  relation text NOT NULL,
  resolution text NOT NULL,
  verification_state text NOT NULL,
  verified_at timestamptz,
  provenance_id text NOT NULL REFERENCES provenance(id),
  UNIQUE (repository, external_id, foreign_record_type, relation)
);

CREATE TABLE cross_repo_references (
  id text PRIMARY KEY,
  schema_version text NOT NULL,
  local_record_id text NOT NULL,
  foreign_reference_id text NOT NULL REFERENCES foreign_references(id),
  usage text NOT NULL,
  created_at timestamptz NOT NULL,
  provenance_id text NOT NULL REFERENCES provenance(id)
);

CREATE INDEX observations_phenomenon_time_idx ON observations (phenomenon_id, observed_at);
CREATE INDEX perspectives_phenomenon_validity_idx ON perspectives (phenomenon_id, valid_from, valid_until);
CREATE INDEX framings_perspective_idx ON framings (perspective_id);
CREATE INDEX signals_phenomenon_time_idx ON signals (phenomenon_id, signal_at);
