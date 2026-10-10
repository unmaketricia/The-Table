CREATE SCHEMA IF NOT EXISTS the_table;
CREATE TABLE the_table.entries (id text PRIMARY KEY,kind text NOT NULL CHECK (kind IN ('meal','breakfast','grocery')),data text NOT NULL);
REVOKE ALL ON SCHEMA the_table FROM PUBLIC, anon, authenticated;
ALTER TABLE the_table.entries ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE the_table.entries FROM PUBLIC, anon, authenticated;
