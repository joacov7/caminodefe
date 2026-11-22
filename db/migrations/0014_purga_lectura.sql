-- Para DELETE con WHERE/RETURNING, Postgres exige que las filas también pasen
-- una política de SELECT. Se habilita la lectura ÚNICAMENTE de conversaciones
-- ya vencidas (borradas por su dueño hace > 30 días) y solo en modo
-- mantenimiento. Las conversaciones activas siguen invisibles.
CREATE POLICY conversations_purge_select ON conversations
  FOR SELECT
  USING (
    current_setting('app.maintenance', true) = 'purge'
    AND deleted_at IS NOT NULL
    AND deleted_at < now() - interval '30 days'
  );
