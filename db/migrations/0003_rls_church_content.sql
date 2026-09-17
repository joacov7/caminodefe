-- RLS para contenido de iglesia (horarios y eventos).
-- Lectura pública; escritura solo para quienes gestionan esa iglesia o el admin
-- de plataforma. Reutiliza los helpers definidos en 0001_rls_policies.sql.

ALTER TABLE service_times ENABLE ROW LEVEL SECURITY;
CREATE POLICY service_times_read ON service_times
  FOR SELECT USING (true);
CREATE POLICY service_times_write ON service_times
  FOR ALL
  USING (app_is_platform_admin() OR app_manages_church(church_id))
  WITH CHECK (app_is_platform_admin() OR app_manages_church(church_id));

ALTER TABLE church_events ENABLE ROW LEVEL SECURITY;
-- Eventos públicos: legibles por todos. Eventos de miembros: gestores/admin.
CREATE POLICY church_events_read ON church_events
  FOR SELECT
  USING (
    visibility = 'public'
    OR app_is_platform_admin()
    OR app_manages_church(church_id)
  );
CREATE POLICY church_events_write ON church_events
  FOR ALL
  USING (app_is_platform_admin() OR app_manages_church(church_id))
  WITH CHECK (app_is_platform_admin() OR app_manages_church(church_id));
