-- Content Broadcasting System - Database Schema

-- Users table (Principal & Teacher)
CREATE TABLE IF NOT EXISTS users (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  email       VARCHAR(150) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role        VARCHAR(20) NOT NULL CHECK (role IN ('principal', 'teacher')),
  created_at  TIMESTAMP DEFAULT NOW()
);

-- Content table
CREATE TABLE IF NOT EXISTS content (
  id               SERIAL PRIMARY KEY,
  title            VARCHAR(255) NOT NULL,
  description      TEXT,
  subject          VARCHAR(100) NOT NULL,
  file_path        TEXT NOT NULL,
  file_url         TEXT NOT NULL,
  file_type        VARCHAR(20) NOT NULL,
  file_size        INTEGER NOT NULL,
  uploaded_by      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status           VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  rejection_reason TEXT,
  approved_by      INTEGER REFERENCES users(id),
  approved_at      TIMESTAMP,
  start_time       TIMESTAMP,
  end_time         TIMESTAMP,
  rotation_duration INTEGER DEFAULT 5,
  created_at       TIMESTAMP DEFAULT NOW()
);

-- Content Slots table (one slot per subject, acts as a rotation group)
CREATE TABLE IF NOT EXISTS content_slots (
  id         SERIAL PRIMARY KEY,
  subject    VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Content Schedule table (links content to its slot with rotation order)
CREATE TABLE IF NOT EXISTS content_schedules (
  id             SERIAL PRIMARY KEY,
  content_id     INTEGER NOT NULL REFERENCES content(id) ON DELETE CASCADE,
  slot_id        INTEGER NOT NULL REFERENCES content_slots(id) ON DELETE CASCADE,
  rotation_order INTEGER NOT NULL DEFAULT 0,
  duration       INTEGER NOT NULL DEFAULT 5,
  created_at     TIMESTAMP DEFAULT NOW(),
  UNIQUE (content_id, slot_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_content_uploaded_by ON content(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_content_status ON content(status);
CREATE INDEX IF NOT EXISTS idx_content_subject ON content(subject);
CREATE INDEX IF NOT EXISTS idx_content_schedules_slot ON content_schedules(slot_id);
