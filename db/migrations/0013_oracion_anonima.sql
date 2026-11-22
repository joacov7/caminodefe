ALTER TABLE "prayer_requests" ADD COLUMN "anonymous" boolean DEFAULT false NOT NULL;--> statement-breakpoint
-- El anonimato también es solo decisión de la persona.
CREATE OR REPLACE FUNCTION prayer_requests_guard() RETURNS trigger AS $$
BEGIN
  IF app_current_user_id() IS DISTINCT FROM OLD.user_id THEN
    IF NEW.body IS DISTINCT FROM OLD.body
       OR NEW.scope IS DISTINCT FROM OLD.scope
       OR NEW.church_id IS DISTINCT FROM OLD.church_id
       OR NEW.user_id IS DISTINCT FROM OLD.user_id
       OR NEW.answer_note IS DISTINCT FROM OLD.answer_note
       OR NEW.anonymous IS DISTINCT FROM OLD.anonymous
       OR NEW.status NOT IN ('open', 'praying')
    THEN
      RAISE EXCEPTION 'Solo la persona puede modificar su pedido de oración';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
