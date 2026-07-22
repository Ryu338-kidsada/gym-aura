CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS workouts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(150) NOT NULL,
  category VARCHAR(80) NOT NULL,
  duration INTEGER NOT NULL CHECK (duration > 0),
  calories INTEGER NOT NULL CHECK (calories >= 0),
  workout_date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS workouts_user_date_idx ON workouts(user_id, workout_date DESC);

-- บัญชีทดลอง: demo@gymaura.com / demo1234
INSERT INTO users (name, email, password_hash)
VALUES ('ออร่า', 'demo@gymaura.com', '$2b$12$pnFP4OMIDox6QBH2MibfzOsrI.l25.2K7aPkMRqykvdscqQoPRyA.')
ON CONFLICT (email) DO NOTHING;
