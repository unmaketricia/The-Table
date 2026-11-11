CREATE SCHEMA IF NOT EXISTS the_table;
CREATE TABLE IF NOT EXISTS the_table.entries (id text PRIMARY KEY,kind text NOT NULL CHECK (kind IN ('meal','breakfast','grocery')),data text NOT NULL);
ALTER TABLE the_table.entries ADD COLUMN IF NOT EXISTS user_id text;
CREATE INDEX IF NOT EXISTS entries_user_id_idx ON the_table.entries(user_id);
CREATE TABLE IF NOT EXISTS the_table.users (
  id text PRIMARY KEY,
  email text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS the_table.sessions (
  token_hash text PRIMARY KEY,
  user_id text NOT NULL REFERENCES the_table.users(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON the_table.sessions(user_id);
REVOKE ALL ON SCHEMA the_table FROM PUBLIC, anon, authenticated;
ALTER TABLE the_table.entries ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE the_table.entries FROM PUBLIC, anon, authenticated;
ALTER TABLE the_table.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE the_table.sessions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE the_table.users, the_table.sessions FROM PUBLIC, anon, authenticated;
