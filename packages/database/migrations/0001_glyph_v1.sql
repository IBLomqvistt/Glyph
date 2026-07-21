CREATE TYPE claim_kind AS ENUM (
  'PAPER_FACT',
  'AUTHOR_CLAIM',
  'GLYPH_CALCULATION',
  'GLYPH_INTERPRETATION',
  'INVESTMENT_HYPOTHESIS'
);

CREATE TABLE papers (
  id text PRIMARY KEY,
  schema_version integer NOT NULL,
  title text NOT NULL,
  source_type text NOT NULL,
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
  asset_reference text NOT NULL,
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
  editor_approved_at timestamptz
);

CREATE TABLE evidence_spans (
  id text PRIMARY KEY,
  schema_version integer NOT NULL,
  paper_version_id text NOT NULL REFERENCES paper_versions(id),
  page_number integer NOT NULL CHECK (page_number > 0),
  section text NOT NULL,
  exact_text text NOT NULL,
  boxes jsonb NOT NULL,
  retrieval_text text,
  embedding real[]
);

CREATE TABLE claims (
  id text PRIMARY KEY,
  schema_version integer NOT NULL,
  report_id text NOT NULL REFERENCES reports(id),
  kind claim_kind NOT NULL,
  material boolean NOT NULL,
  support_status text NOT NULL,
  text text NOT NULL
);

CREATE TABLE claim_evidence (
  claim_id text NOT NULL REFERENCES claims(id),
  evidence_span_id text NOT NULL REFERENCES evidence_spans(id),
  PRIMARY KEY (claim_id, evidence_span_id)
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
  updated_at timestamptz NOT NULL
);

CREATE TABLE ai_generation_records (
  id text PRIMARY KEY,
  schema_version integer NOT NULL,
  task text NOT NULL,
  model text NOT NULL,
  prompt_version text NOT NULL,
  output_schema_version integer NOT NULL CHECK (output_schema_version > 0),
  generated_at timestamptz NOT NULL,
  source_paper_version_id text REFERENCES paper_versions(id),
  result jsonb NOT NULL
);

CREATE TABLE report_sections (
  id text PRIMARY KEY,
  schema_version integer NOT NULL,
  report_id text NOT NULL REFERENCES reports(id),
  kind text NOT NULL,
  depth text NOT NULL,
  "order" integer NOT NULL CHECK ("order" >= 0),
  payload jsonb NOT NULL
);

CREATE TABLE concepts (
  id text PRIMARY KEY,
  schema_version integer NOT NULL,
  name text NOT NULL,
  payload jsonb NOT NULL
);

CREATE TABLE report_concepts (
  report_id text NOT NULL REFERENCES reports(id),
  concept_id text NOT NULL REFERENCES concepts(id),
  PRIMARY KEY (report_id, concept_id)
);

CREATE TABLE visual_specs (
  id text PRIMARY KEY,
  schema_version integer NOT NULL,
  title text NOT NULL,
  payload jsonb NOT NULL
);

CREATE TABLE report_visuals (
  report_id text NOT NULL REFERENCES reports(id),
  visual_spec_id text NOT NULL REFERENCES visual_specs(id),
  PRIMARY KEY (report_id, visual_spec_id)
);

CREATE TABLE market_metrics (
  id text PRIMARY KEY,
  schema_version integer NOT NULL,
  report_id text NOT NULL REFERENCES reports(id),
  source_url text NOT NULL,
  retrieval_date date NOT NULL,
  model_or_product_version text NOT NULL,
  value real NOT NULL,
  unit text NOT NULL,
  denominator text NOT NULL,
  conditions text NOT NULL,
  relevance text NOT NULL,
  comparison_limitations text NOT NULL
);

CREATE TABLE glyph_users (
  id text PRIMARY KEY,
  schema_version integer NOT NULL,
  role text NOT NULL,
  preferences jsonb NOT NULL
);

CREATE TABLE saved_concepts (
  user_id text NOT NULL REFERENCES glyph_users(id),
  concept_id text NOT NULL REFERENCES concepts(id),
  saved_at timestamptz NOT NULL,
  PRIMARY KEY (user_id, concept_id)
);

CREATE TABLE question_answers (
  id text PRIMARY KEY,
  schema_version integer NOT NULL,
  report_id text NOT NULL REFERENCES reports(id),
  question text NOT NULL,
  outcome text NOT NULL,
  answer_text text,
  generated_at timestamptz NOT NULL,
  validated_at timestamptz NOT NULL,
  CHECK (
    (outcome = 'ANSWER' AND answer_text IS NOT NULL)
    OR (outcome = 'INSUFFICIENT_EVIDENCE' AND answer_text IS NULL)
  )
);

CREATE TABLE question_answer_evidence (
  question_answer_id text NOT NULL REFERENCES question_answers(id),
  evidence_span_id text NOT NULL REFERENCES evidence_spans(id),
  PRIMARY KEY (question_answer_id, evidence_span_id)
);
