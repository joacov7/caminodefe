-- RLS de aportes: el usuario ve/crea los suyos; la iglesia destinataria y el
-- responsable financiero de plataforma ven los aportes que les corresponden.
-- Usa helpers de 0001_rls_policies.sql. La suscripción es privada del usuario.

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY subscriptions_owner ON subscriptions
  USING (user_id = app_current_user_id())
  WITH CHECK (user_id = app_current_user_id());

ALTER TABLE contributions ENABLE ROW LEVEL SECURITY;
-- Lectura: el donante, o quien gestiona la iglesia destinataria, o admin.
CREATE POLICY contributions_read ON contributions
  FOR SELECT
  USING (
    user_id = app_current_user_id()
    OR app_is_platform_admin()
    OR (recipient_church_id IS NOT NULL AND app_manages_church(recipient_church_id))
  );
-- Escritura: solo el propio donante crea/modifica sus aportes.
CREATE POLICY contributions_write ON contributions
  FOR ALL
  USING (user_id = app_current_user_id())
  WITH CHECK (user_id = app_current_user_id());
