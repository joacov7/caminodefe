-- Políticas Row Level Security (RLS) — defensa en profundidad.
--
-- El backend autenticado fija el contexto por transacción con:
--   SET LOCAL app.user_id = '<uuid>';
--   SET LOCAL app.is_platform_admin = 'true' | 'false';
-- Las políticas usan esos valores. La autorización primaria vive en
-- server/authz; esto es una segunda barrera a nivel de base de datos.
--
-- Nota: el rol de aplicación NO debe ser superusuario ni BYPASSRLS.

-- Helpers de contexto (devuelven valores seguros si no están seteados).
CREATE OR REPLACE FUNCTION app_current_user_id() RETURNS text AS $$
  SELECT nullif(current_setting('app.user_id', true), '');
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION app_is_platform_admin() RETURNS boolean AS $$
  SELECT coalesce(current_setting('app.is_platform_admin', true) = 'true', false);
$$ LANGUAGE sql STABLE;

-- ¿El usuario actual pertenece (activo) a la iglesia dada?
CREATE OR REPLACE FUNCTION app_is_member_of(target_church_id text)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM church_members m
    WHERE m.church_id = target_church_id
      AND m.user_id = app_current_user_id()
      AND m.status = 'active'
  );
$$ LANGUAGE sql STABLE;

-- ¿El usuario actual tiene un rol de gestión (verificado) en la iglesia dada?
CREATE OR REPLACE FUNCTION app_manages_church(target_church_id text)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles r
    WHERE r.user_id = app_current_user_id()
      AND r.scope = 'church'
      AND r.church_id = target_church_id
      AND r.role IN ('pastor', 'church_leader', 'church_admin')
  );
$$ LANGUAGE sql STABLE;

-- =====================================================================
-- Datos PERSONALES: privados por dueño. Nadie más (ni pastor ni admin).
-- =====================================================================
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY conversations_owner ON conversations
  USING (user_id = app_current_user_id())
  WITH CHECK (user_id = app_current_user_id());

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY messages_owner ON messages
  USING (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = messages.conversation_id
        AND c.user_id = app_current_user_id()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = messages.conversation_id
        AND c.user_id = app_current_user_id()
    )
  );

ALTER TABLE message_citations ENABLE ROW LEVEL SECURITY;
CREATE POLICY message_citations_owner ON message_citations
  USING (
    EXISTS (
      SELECT 1
      FROM messages m
      JOIN conversations c ON c.id = m.conversation_id
      WHERE m.id = message_citations.message_id
        AND c.user_id = app_current_user_id()
    )
  );

-- =====================================================================
-- Solicitudes de contacto: visibles para el usuario que las creó y para
-- quienes gestionan la iglesia destinataria (o admin de plataforma).
-- =====================================================================
ALTER TABLE contact_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY contact_requests_access ON contact_requests
  USING (
    user_id = app_current_user_id()
    OR app_is_platform_admin()
    OR app_manages_church(church_id)
  )
  WITH CHECK (
    user_id = app_current_user_id()
    OR app_is_platform_admin()
    OR app_manages_church(church_id)
  );

-- =====================================================================
-- Membresías de iglesia: el propio usuario, gestores de esa iglesia o admin.
-- =====================================================================
ALTER TABLE church_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY church_members_access ON church_members
  USING (
    user_id = app_current_user_id()
    OR app_is_platform_admin()
    OR app_manages_church(church_id)
  )
  WITH CHECK (
    app_is_platform_admin()
    OR app_manages_church(church_id)
  );

-- =====================================================================
-- Contenido de iglesia: lo publicado es legible por todos; borradores solo
-- por gestores de esa iglesia o admin. Escritura solo gestores/admin.
-- =====================================================================
ALTER TABLE content_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY content_items_read ON content_items
  FOR SELECT
  USING (
    editorial_status = 'published'
    OR app_is_platform_admin()
    OR (church_id IS NOT NULL AND app_manages_church(church_id))
  );
CREATE POLICY content_items_write ON content_items
  FOR ALL
  USING (
    app_is_platform_admin()
    OR (church_id IS NOT NULL AND app_manages_church(church_id))
  )
  WITH CHECK (
    app_is_platform_admin()
    OR (church_id IS NOT NULL AND app_manages_church(church_id))
  );

-- =====================================================================
-- Auditoría: solo lectura para admin de plataforma; inserción desde backend.
-- =====================================================================
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY audit_log_admin_read ON audit_log
  FOR SELECT
  USING (app_is_platform_admin());
CREATE POLICY audit_log_insert ON audit_log
  FOR INSERT
  WITH CHECK (true);
