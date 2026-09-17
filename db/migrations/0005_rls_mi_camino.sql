-- RLS de "Mi Camino": datos estrictamente PRIVADOS por dueño.
-- Nadie más (ni pastor ni admin de plataforma) puede leerlos ni escribirlos.
-- Usa el helper app_current_user_id() definido en 0001_rls_policies.sql.

ALTER TABLE user_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY user_notes_owner ON user_notes
  USING (user_id = app_current_user_id())
  WITH CHECK (user_id = app_current_user_id());

ALTER TABLE user_journal ENABLE ROW LEVEL SECURITY;
CREATE POLICY user_journal_owner ON user_journal
  USING (user_id = app_current_user_id())
  WITH CHECK (user_id = app_current_user_id());

ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY user_favorites_owner ON user_favorites
  USING (user_id = app_current_user_id())
  WITH CHECK (user_id = app_current_user_id());
