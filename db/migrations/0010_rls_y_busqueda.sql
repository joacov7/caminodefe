-- RLS forzada para los nuevos datos PRIVADOS (planes, recordatorios, camino
-- guiado) + índices de búsqueda bíblica y de la caché del asistente.

ALTER TABLE reading_plan_days ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE reading_plan_days FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY reading_plan_days_owner ON reading_plan_days
  USING (user_id = app_current_user_id())
  WITH CHECK (user_id = app_current_user_id());
--> statement-breakpoint
ALTER TABLE reminder_prefs ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE reminder_prefs FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY reminder_prefs_owner ON reminder_prefs
  USING (user_id = app_current_user_id())
  WITH CHECK (user_id = app_current_user_id());
--> statement-breakpoint
ALTER TABLE guided_path_progress ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE guided_path_progress FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY guided_path_progress_owner ON guided_path_progress
  USING (user_id = app_current_user_id())
  WITH CHECK (user_id = app_current_user_id());
--> statement-breakpoint
-- Búsqueda temática en la Biblia (RAG sin referencia explícita).
CREATE INDEX IF NOT EXISTS bible_verses_fts_idx
  ON bible_verses USING gin (to_tsvector('spanish', text));
--> statement-breakpoint
-- Prefiltro por trigramas para la caché/biblioteca del asistente.
CREATE EXTENSION IF NOT EXISTS pg_trgm;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS answer_cache_trgm_idx
  ON answer_cache USING gin (normalized_question gin_trgm_ops);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS answer_library_trgm_idx
  ON answer_library USING gin (normalized_question gin_trgm_ops);
