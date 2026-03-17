-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enums
CREATE TYPE categoria_personal AS ENUM (
  'alimentacion', 'transporte', 'salud', 'entretenimiento',
  'ropa', 'tecnologia', 'gym', 'suscripciones', 'impuestos', 'otros'
);

CREATE TYPE categoria_compartida AS ENUM (
  'alquiler', 'expensas', 'servicios', 'supermercado',
  'limpieza', 'mascotas', 'salidas', 'viajes', 'otros'
);

-- Usuarios
CREATE TABLE usuarios (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  nombre TEXT,
  sueldo_neto NUMERIC(12, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Meses
CREATE TABLE meses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  anio INTEGER NOT NULL,
  mes INTEGER NOT NULL CHECK (mes BETWEEN 1 AND 12),
  cerrado BOOLEAN NOT NULL DEFAULT FALSE,
  sueldo_mensual NUMERIC(12, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, anio, mes)
);

-- Gastos Personales
CREATE TABLE gastos_personales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mes_id UUID NOT NULL REFERENCES meses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  categoria categoria_personal NOT NULL DEFAULT 'otros',
  descripcion TEXT NOT NULL,
  monto NUMERIC(12, 2) NOT NULL CHECK (monto > 0),
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  es_fijo BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Gastos Compartidos
CREATE TABLE gastos_compartidos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mes_id UUID NOT NULL REFERENCES meses(id) ON DELETE CASCADE,
  categoria categoria_compartida NOT NULL DEFAULT 'otros',
  descripcion TEXT NOT NULL,
  monto_total NUMERIC(12, 2) NOT NULL CHECK (monto_total > 0),
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Participantes de Gasto
CREATE TABLE participantes_gasto (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gasto_compartido_id UUID NOT NULL REFERENCES gastos_compartidos(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  sueldo NUMERIC(12, 2) NOT NULL CHECK (sueldo > 0),
  es_usuario_actual BOOLEAN NOT NULL DEFAULT FALSE,
  monto_a_aportar NUMERIC(12, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Resumenes Mensuales
CREATE TABLE resumenes_mensuales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mes_id UUID NOT NULL REFERENCES meses(id) ON DELETE CASCADE,
  resumen_texto TEXT NOT NULL,
  recomendaciones_texto TEXT NOT NULL,
  generado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (mes_id)
);

-- Indexes
CREATE INDEX idx_meses_user_id ON meses(user_id);
CREATE INDEX idx_gastos_personales_mes_id ON gastos_personales(mes_id);
CREATE INDEX idx_gastos_compartidos_mes_id ON gastos_compartidos(mes_id);
CREATE INDEX idx_participantes_gasto_id ON participantes_gasto(gasto_compartido_id);

-- Trigger: recalculate monto_a_aportar when sueldo_mensual changes on meses
CREATE OR REPLACE FUNCTION recalcular_aportes()
RETURNS TRIGGER AS $$
DECLARE
  gasto RECORD;
  suma_sueldos NUMERIC;
BEGIN
  -- For each shared expense in the month, recalculate all participant contributions
  FOR gasto IN
    SELECT gc.id, gc.monto_total
    FROM gastos_compartidos gc
    WHERE gc.mes_id = NEW.id
  LOOP
    SELECT SUM(sueldo) INTO suma_sueldos
    FROM participantes_gasto
    WHERE gasto_compartido_id = gasto.id;

    IF suma_sueldos > 0 THEN
      UPDATE participantes_gasto
      SET monto_a_aportar = ROUND((sueldo / suma_sueldos) * gasto.monto_total, 2)
      WHERE gasto_compartido_id = gasto.id;
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_recalcular_aportes
AFTER UPDATE OF sueldo_mensual ON meses
FOR EACH ROW
EXECUTE FUNCTION recalcular_aportes();

-- Trigger: recalculate when monto_total changes on gastos_compartidos
CREATE OR REPLACE FUNCTION recalcular_aportes_por_monto()
RETURNS TRIGGER AS $$
DECLARE
  suma_sueldos NUMERIC;
BEGIN
  SELECT SUM(sueldo) INTO suma_sueldos
  FROM participantes_gasto
  WHERE gasto_compartido_id = NEW.id;

  IF suma_sueldos > 0 THEN
    UPDATE participantes_gasto
    SET monto_a_aportar = ROUND((sueldo / suma_sueldos) * NEW.monto_total, 2)
    WHERE gasto_compartido_id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_recalcular_aportes_por_monto
AFTER INSERT OR UPDATE OF monto_total ON gastos_compartidos
FOR EACH ROW
EXECUTE FUNCTION recalcular_aportes_por_monto();

-- Trigger: recalculate when participant sueldo changes
CREATE OR REPLACE FUNCTION recalcular_aportes_por_participante()
RETURNS TRIGGER AS $$
DECLARE
  monto_total_gasto NUMERIC;
  suma_sueldos NUMERIC;
BEGIN
  SELECT monto_total INTO monto_total_gasto
  FROM gastos_compartidos
  WHERE id = NEW.gasto_compartido_id;

  SELECT SUM(sueldo) INTO suma_sueldos
  FROM participantes_gasto
  WHERE gasto_compartido_id = NEW.gasto_compartido_id;

  IF suma_sueldos > 0 AND monto_total_gasto IS NOT NULL THEN
    UPDATE participantes_gasto
    SET monto_a_aportar = ROUND((sueldo / suma_sueldos) * monto_total_gasto, 2)
    WHERE gasto_compartido_id = NEW.gasto_compartido_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_recalcular_aportes_por_participante
AFTER INSERT OR UPDATE OF sueldo ON participantes_gasto
FOR EACH ROW
EXECUTE FUNCTION recalcular_aportes_por_participante();
