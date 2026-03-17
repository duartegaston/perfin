-- Enable RLS on all tables
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE meses ENABLE ROW LEVEL SECURITY;
ALTER TABLE gastos_personales ENABLE ROW LEVEL SECURITY;
ALTER TABLE gastos_compartidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE participantes_gasto ENABLE ROW LEVEL SECURITY;
ALTER TABLE resumenes_mensuales ENABLE ROW LEVEL SECURITY;

-- usuarios: only own row
CREATE POLICY "usuarios_select_own" ON usuarios
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "usuarios_insert_own" ON usuarios
  FOR INSERT WITH CHECK (id = auth.uid());

CREATE POLICY "usuarios_update_own" ON usuarios
  FOR UPDATE USING (id = auth.uid());

-- meses: only own months
CREATE POLICY "meses_select_own" ON meses
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "meses_insert_own" ON meses
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "meses_update_own" ON meses
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "meses_delete_own" ON meses
  FOR DELETE USING (user_id = auth.uid());

-- gastos_personales: only own expenses
CREATE POLICY "gastos_personales_select_own" ON gastos_personales
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "gastos_personales_insert_own" ON gastos_personales
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "gastos_personales_update_own" ON gastos_personales
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "gastos_personales_delete_own" ON gastos_personales
  FOR DELETE USING (user_id = auth.uid());

-- gastos_compartidos: via meses join
CREATE POLICY "gastos_compartidos_select_own" ON gastos_compartidos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM meses
      WHERE meses.id = gastos_compartidos.mes_id
        AND meses.user_id = auth.uid()
    )
  );

CREATE POLICY "gastos_compartidos_insert_own" ON gastos_compartidos
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM meses
      WHERE meses.id = gastos_compartidos.mes_id
        AND meses.user_id = auth.uid()
    )
  );

CREATE POLICY "gastos_compartidos_update_own" ON gastos_compartidos
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM meses
      WHERE meses.id = gastos_compartidos.mes_id
        AND meses.user_id = auth.uid()
    )
  );

CREATE POLICY "gastos_compartidos_delete_own" ON gastos_compartidos
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM meses
      WHERE meses.id = gastos_compartidos.mes_id
        AND meses.user_id = auth.uid()
    )
  );

-- participantes_gasto: via gastos_compartidos → meses join
CREATE POLICY "participantes_select_own" ON participantes_gasto
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM gastos_compartidos gc
      JOIN meses m ON m.id = gc.mes_id
      WHERE gc.id = participantes_gasto.gasto_compartido_id
        AND m.user_id = auth.uid()
    )
  );

CREATE POLICY "participantes_insert_own" ON participantes_gasto
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM gastos_compartidos gc
      JOIN meses m ON m.id = gc.mes_id
      WHERE gc.id = participantes_gasto.gasto_compartido_id
        AND m.user_id = auth.uid()
    )
  );

CREATE POLICY "participantes_update_own" ON participantes_gasto
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM gastos_compartidos gc
      JOIN meses m ON m.id = gc.mes_id
      WHERE gc.id = participantes_gasto.gasto_compartido_id
        AND m.user_id = auth.uid()
    )
  );

CREATE POLICY "participantes_delete_own" ON participantes_gasto
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM gastos_compartidos gc
      JOIN meses m ON m.id = gc.mes_id
      WHERE gc.id = participantes_gasto.gasto_compartido_id
        AND m.user_id = auth.uid()
    )
  );

-- resumenes_mensuales: via meses join
CREATE POLICY "resumenes_select_own" ON resumenes_mensuales
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM meses
      WHERE meses.id = resumenes_mensuales.mes_id
        AND meses.user_id = auth.uid()
    )
  );

CREATE POLICY "resumenes_insert_own" ON resumenes_mensuales
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM meses
      WHERE meses.id = resumenes_mensuales.mes_id
        AND meses.user_id = auth.uid()
    )
  );

CREATE POLICY "resumenes_update_own" ON resumenes_mensuales
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM meses
      WHERE meses.id = resumenes_mensuales.mes_id
        AND meses.user_id = auth.uid()
    )
  );
