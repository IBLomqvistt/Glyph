CREATE TABLE ingested_documents (
  id text PRIMARY KEY,
  fingerprint text NOT NULL UNIQUE,
  source_id text NOT NULL REFERENCES sources(id),
  paper_version_id text REFERENCES paper_versions(id),
  eligibility text NOT NULL,
  payload jsonb NOT NULL,
  created_at timestamptz NOT NULL
);

CREATE TABLE source_scans (
  id text PRIMARY KEY,
  trigger text NOT NULL,
  status text NOT NULL,
  payload jsonb NOT NULL,
  started_at timestamptz NOT NULL,
  completed_at timestamptz
);

CREATE TABLE paper_label_ontologies (
  id text PRIMARY KEY,
  version integer NOT NULL,
  status text NOT NULL,
  payload jsonb NOT NULL,
  approved_at timestamptz
);

CREATE TABLE agent_runs (
  id text PRIMARY KEY,
  run_id text NOT NULL,
  paper_version_id text NOT NULL REFERENCES paper_versions(id),
  agent text NOT NULL,
  status text NOT NULL,
  payload jsonb NOT NULL,
  started_at timestamptz NOT NULL,
  completed_at timestamptz
);

CREATE TABLE runtime_workflows (
  id text PRIMARY KEY,
  status text NOT NULL,
  selected_paper_version_id text REFERENCES paper_versions(id),
  editorial_package_id text,
  payload jsonb NOT NULL,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL
);

CREATE TABLE editorial_packages (
  id text PRIMARY KEY,
  paper_version_id text NOT NULL REFERENCES paper_versions(id),
  workflow_run_id text NOT NULL REFERENCES runtime_workflows(id),
  status text NOT NULL,
  payload jsonb NOT NULL,
  created_at timestamptz NOT NULL,
  approved_at timestamptz,
  published_at timestamptz
);

CREATE INDEX ingested_documents_paper_version_idx
  ON ingested_documents (paper_version_id);
CREATE INDEX agent_runs_workflow_idx ON agent_runs (run_id, started_at);
CREATE INDEX runtime_workflows_status_idx ON runtime_workflows (status);
CREATE INDEX editorial_packages_workflow_idx
  ON editorial_packages (workflow_run_id);
