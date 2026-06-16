CREATE TABLE IF NOT EXISTS rooms (
  id           SERIAL PRIMARY KEY,
  name         TEXT NOT NULL,
  slug         TEXT NOT NULL UNIQUE,
  owner_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  canvas_state JSONB NOT NULL DEFAULT '{"nodes":[],"edges":[]}',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
