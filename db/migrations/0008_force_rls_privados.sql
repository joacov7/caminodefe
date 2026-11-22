-- Activa la RLS en tiempo de ejecución para los datos PRIVADOS.
--
-- Hallazgo de auditoría (docs/10 §2.1): la app se conecta como dueña de las
-- tablas y el dueño ignora la RLS salvo que se use FORCE. Con FORCE, incluso
-- el rol dueño queda sujeto a las políticas: la app DEBE fijar app.user_id
-- (ver db/index.ts → withUserContext) para leer o escribir estas filas.
--
-- Nota: los superusuarios siempre ignoran la RLS. En Neon el rol de la app
-- (p. ej. neondb_owner) NO es superusuario, por lo que FORCE aplica.
ALTER TABLE conversations FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE messages FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE message_citations FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE user_notes FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE user_journal FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE user_favorites FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
-- message_citations solo tenía política de lectura (USING). Al insertar con
-- FORCE se necesita WITH CHECK explícito para el dueño.
DROP POLICY IF EXISTS message_citations_owner ON message_citations;
--> statement-breakpoint
CREATE POLICY message_citations_owner ON message_citations
  USING (
    EXISTS (
      SELECT 1 FROM messages m JOIN conversations c ON c.id = m.conversation_id
      WHERE m.id = message_citations.message_id
        AND c.user_id = app_current_user_id()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM messages m JOIN conversations c ON c.id = m.conversation_id
      WHERE m.id = message_citations.message_id
        AND c.user_id = app_current_user_id()
    )
  );
--> statement-breakpoint
-- Eventos "solo miembros": también legibles por miembros activos (antes solo
-- gestores/admin; hallazgo docs/10 §2.6).
DROP POLICY IF EXISTS church_events_read ON church_events;
--> statement-breakpoint
CREATE POLICY church_events_read ON church_events
  FOR SELECT
  USING (
    visibility = 'public'
    OR app_is_platform_admin()
    OR app_manages_church(church_id)
    OR app_is_member_of(church_id)
  );
