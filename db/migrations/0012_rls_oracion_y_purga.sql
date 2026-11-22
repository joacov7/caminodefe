-- Pedidos de oración: privados por defecto; compartidos SOLO con el equipo
-- pastoral de la iglesia (verificada) que la persona eligió.
ALTER TABLE prayer_requests
  ADD CONSTRAINT prayer_requests_scope_chk CHECK (scope IN ('private', 'church'));
--> statement-breakpoint
ALTER TABLE prayer_requests
  ADD CONSTRAINT prayer_requests_status_chk CHECK (status IN ('open', 'praying', 'answered'));
--> statement-breakpoint
-- ¿El usuario actual gestiona esta iglesia Y la iglesia está verificada?
CREATE OR REPLACE FUNCTION app_manages_verified_church(target_church_id text)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles r JOIN churches c ON c.id = r.church_id
    WHERE r.user_id = app_current_user_id()
      AND r.scope = 'church'
      AND r.church_id = target_church_id
      AND r.role IN ('pastor', 'church_leader', 'church_admin')
      AND c.status = 'verified'
  );
$$ LANGUAGE sql STABLE;
--> statement-breakpoint
ALTER TABLE prayer_requests ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE prayer_requests FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY prayer_requests_owner ON prayer_requests
  USING (user_id = app_current_user_id())
  WITH CHECK (user_id = app_current_user_id());
--> statement-breakpoint
CREATE POLICY prayer_requests_pastoral_read ON prayer_requests
  FOR SELECT
  USING (scope = 'church' AND church_id IS NOT NULL AND app_manages_verified_church(church_id));
--> statement-breakpoint
CREATE POLICY prayer_requests_pastoral_update ON prayer_requests
  FOR UPDATE
  USING (scope = 'church' AND church_id IS NOT NULL AND app_manages_verified_church(church_id))
  WITH CHECK (scope = 'church' AND church_id IS NOT NULL AND app_manages_verified_church(church_id));
--> statement-breakpoint
-- Quien no es el dueño solo puede cambiar el estado a "praying" (nunca el
-- texto, el alcance ni la iglesia). Defensa en la base además del servidor.
CREATE OR REPLACE FUNCTION prayer_requests_guard() RETURNS trigger AS $$
BEGIN
  IF app_current_user_id() IS DISTINCT FROM OLD.user_id THEN
    IF NEW.body IS DISTINCT FROM OLD.body
       OR NEW.scope IS DISTINCT FROM OLD.scope
       OR NEW.church_id IS DISTINCT FROM OLD.church_id
       OR NEW.user_id IS DISTINCT FROM OLD.user_id
       OR NEW.answer_note IS DISTINCT FROM OLD.answer_note
       OR NEW.status NOT IN ('open', 'praying')
    THEN
      RAISE EXCEPTION 'Solo la persona puede modificar su pedido de oración';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint
CREATE TRIGGER prayer_requests_guard_trg
  BEFORE UPDATE ON prayer_requests
  FOR EACH ROW EXECUTE FUNCTION prayer_requests_guard();
--> statement-breakpoint
-- Purga de conversaciones borradas (retención: 30 días, docs/15). Con FORCE RLS
-- ni el rol dueño ve filas ajenas; esta política permite ÚNICAMENTE borrar
-- conversaciones ya eliminadas por su dueño hace más de 30 días, y solo cuando
-- el proceso de mantenimiento fija app.maintenance = 'purge' en su transacción.
CREATE POLICY conversations_purge ON conversations
  FOR DELETE
  USING (
    current_setting('app.maintenance', true) = 'purge'
    AND deleted_at IS NOT NULL
    AND deleted_at < now() - interval '30 days'
  );
