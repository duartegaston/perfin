-- Migration 004: Custom categories per user

-- 1. Convert categoria columns from PostgreSQL enums to TEXT
ALTER TABLE gastos_personales ALTER COLUMN categoria TYPE TEXT;
ALTER TABLE gastos_compartidos ALTER COLUMN categoria TYPE TEXT;

-- 2. Create categorias_usuario table
CREATE TABLE categorias_usuario (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('personal', 'compartido')),
  nombre TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#94a3b8',
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  orden INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, tipo, nombre)
);

-- 3. RLS
ALTER TABLE categorias_usuario ENABLE ROW LEVEL SECURITY;

CREATE POLICY "categorias_select_own" ON categorias_usuario
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "categorias_insert_own" ON categorias_usuario
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "categorias_update_own" ON categorias_usuario
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "categorias_delete_own" ON categorias_usuario
  FOR DELETE USING (user_id = auth.uid());

-- Index
CREATE INDEX idx_categorias_usuario_user_tipo ON categorias_usuario(user_id, tipo);
