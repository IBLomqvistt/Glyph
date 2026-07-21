CREATE TYPE claim_kind AS ENUM (
  'PAPER_FACT',
  'MEASURED_RESULT',
  'AUTHOR_CLAIM',
  'GLYPH_CALCULATION',
  'GLYPH_INTERPRETATION',
  'INVESTMENT_HYPOTHESIS',
  'INSUFFICIENT_EVIDENCE'
);

CREATE TABLE sources (
  id text PRIMARY KEY,
  schema_version integer NOT NULL,
  name text NOT NULL,
  kind text NOT NULL,
  base_url text NOT NULL,
  enabled boolean NOT NULL,
  priority integer NOT NULL CHECK (priority BETWEEN 1 AND 100),
  rights text NOT NULL,
  connector_key text NOT NULL,
  payload jsonb NOT NULL,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  CHECK (NOT (enabled AND rights = 'PROHIBITED'))
);

CREATE TABLE source_audit_events (
  id text PRIMARY KEY,
  schema_version integer NOT NULL,
  source_id text NOT NULL REFERENCES sources(id),
  actor_id text NOT NULL,
  action text NOT NULL,
  outcome text NOT NULL,
  detail text NOT NULL,
  occurred_at timestamptz NOT NULL,
  payload jsonb NOT NULL
);

CREATE TABLE papers (
  id text PRIMARY KEY,
  schema_version integer NOT NULL,
  source_id text NOT NULL REFERENCES sources(id),
  title text NOT NULL,
  canonical_url text NOT NULL,
  payload jsonb NOT NULL
);

CREATE TABLE paper_versions (
  id text PRIMARY KEY,
  schema_version integer NOT NULL,
  paper_id text NOT NULL REFERENCES papers(id),
  checksum_sha256 text NOT NULL UNIQUE,
  version_label text NOT NULL,
  licence_status text NOT NULL,
  publication_date date NOT NULL,
  revision_date date NOT NULL,
  page_count integer NOT NULL CHECK (page_count > 0),
  asset_reference text,
  payload jsonb NOT NULL
);

CREATE TABLE reports (
  id text PRIMARY KEY,
  schema_version integer NOT NULL,
  paper_version_id text NOT NULL REFERENCES paper_versions(id),
  slug text NOT NULL UNIQUE,
  status text NOT NULL,
  reading_time_minutes integer NOT NULL CHECK (reading_time_minutes > 0),
  payload jsonb NOT NULL,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  editor_approved_at timestamptz
);

CREATE TABLE report_sections (
  id text PRIMARY KEY,
  schema_version integer NOT NULL,
  report_id text NOT NULL REFERENCES reports(id),
  kind text NOT NULL,
  depth text NOT NULL,
  sort_order integer NOT NULL CHECK (sort_order >= 0),
  payload jsonb NOT NULL
);

CREATE TABLE evidence_spans (
  id text PRIMARY KEY,
  schema_version integer NOT NULL,
  paper_version_id text NOT NULL REFERENCES paper_versions(id),
  page_number integer NOT NULL CHECK (page_number > 0),
  section text NOT NULL,
  exact_text text NOT NULL,
  boxes jsonb NOT NULL
);

CREATE TABLE claims (
  id text PRIMARY KEY,
  schema_version integer NOT NULL,
  report_id text NOT NULL REFERENCES reports(id),
  kind claim_kind NOT NULL,
  material boolean NOT NULL,
  support_status text NOT NULL,
  claim_text text NOT NULL
);

CREATE TABLE claim_evidence (
  claim_id text NOT NULL REFERENCES claims(id),
  evidence_span_id text NOT NULL REFERENCES evidence_spans(id),
  PRIMARY KEY (claim_id, evidence_span_id)
);

CREATE TABLE concepts (
  id text PRIMARY KEY,
  schema_version integer NOT NULL,
  name text NOT NULL,
  payload jsonb NOT NULL
);

CREATE TABLE visual_specs (
  id text PRIMARY KEY,
  schema_version integer NOT NULL,
  title text NOT NULL,
  payload jsonb NOT NULL
);

CREATE TABLE market_metrics (
  id text PRIMARY KEY,
  schema_version integer NOT NULL,
  report_id text NOT NULL REFERENCES reports(id),
  source_url text NOT NULL,
  retrieval_date date NOT NULL,
  payload jsonb NOT NULL
);

CREATE TABLE pipeline_runs (
  id text PRIMARY KEY,
  schema_version integer NOT NULL,
  paper_version_id text NOT NULL REFERENCES paper_versions(id),
  stage text NOT NULL,
  attempt integer NOT NULL CHECK (attempt > 0),
  idempotency_key text NOT NULL UNIQUE,
  status text NOT NULL,
  result jsonb,
  error jsonb,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  payload jsonb NOT NULL
);

CREATE INDEX source_audit_source_time_idx
  ON source_audit_events (source_id, occurred_at);
CREATE INDEX reports_paper_version_idx ON reports (paper_version_id);
CREATE INDEX evidence_paper_page_idx
  ON evidence_spans (paper_version_id, page_number);
CREATE INDEX claims_report_idx ON claims (report_id);
CREATE INDEX pipeline_runs_paper_stage_idx
  ON pipeline_runs (paper_version_id, stage);
