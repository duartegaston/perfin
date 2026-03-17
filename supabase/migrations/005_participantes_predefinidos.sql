-- Migration 005: Predefined participants
-- Run in Supabase SQL editor

CREATE TABLE IF NOT EXISTS participantes_predefinidos (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  sueldo NUMERIC(12, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE participantes_predefinidos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users can manage own predefined participants"
  ON participantes_predefinidos
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
