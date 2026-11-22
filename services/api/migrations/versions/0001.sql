CREATE EXTENSION IF NOT EXISTS pgcrypto;
-- statement-break
DO $$ BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'nexus_app') THEN
    CREATE ROLE nexus_app LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS;
  END IF;
  IF EXISTS (SELECT FROM pg_roles WHERE rolname='nexus_app' AND (rolsuper OR rolbypassrls OR rolcreaterole OR rolcreatedb)) THEN
    RAISE EXCEPTION 'Unsafe pre-existing nexus_app role';
  END IF;
END $$;
-- statement-break
REVOKE CREATE ON SCHEMA public FROM PUBLIC;
-- statement-break
CREATE TABLE public.institution (
  id uuid PRIMARY KEY,
  name varchar(200) NOT NULL,
  provenance varchar(16) NOT NULL CHECK (provenance IN ('published','simulated','unverified')),
  source jsonb NOT NULL DEFAULT '{}',
  CHECK (provenance <> 'published' OR (source ? 'url' AND source ? 'retrieved_on' AND source ? 'page'))
);
-- statement-break
CREATE TABLE public.profile (
  id uuid PRIMARY KEY,
  name varchar(100) NOT NULL,
  role varchar(24) NOT NULL CHECK (role IN ('CONVENER','SECRETARIAT','MDA_OFFICER','FIELD_MONITOR','ANCHOR_ENTITY','OVERSIGHT')),
  institution_id uuid NOT NULL REFERENCES public.institution(id),
  is_simulated boolean NOT NULL DEFAULT true CHECK (is_simulated),
  active boolean NOT NULL DEFAULT true
);
CREATE INDEX profile_institution_id_idx ON public.profile(institution_id);
-- statement-break
CREATE TABLE public.mda_report (
  id uuid PRIMARY KEY,
  institution_id uuid NOT NULL REFERENCES public.institution(id),
  actor_id uuid NOT NULL REFERENCES public.profile(id),
  period varchar(20) NOT NULL CHECK (period ~ '^FY20[0-9]{2}/[0-9]{2} Q[1-4]$'),
  title varchar(200) NOT NULL CHECK (length(title) BETWEEN 5 AND 200),
  narrative text NOT NULL CHECK (length(narrative) BETWEEN 20 AND 20000),
  review_comment text NOT NULL DEFAULT '',
  state varchar(20) NOT NULL DEFAULT 'DRAFT' CONSTRAINT report_state CHECK (state IN ('DRAFT','SUBMITTED','AI_SUMMARISED','UNDER_REVIEW','RETURNED','ACCEPTED')),
  version integer NOT NULL DEFAULT 1 CONSTRAINT report_version CHECK (version > 0),
  is_simulated boolean NOT NULL DEFAULT true CONSTRAINT open_report_simulated CHECK (is_simulated),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX mda_report_institution_id_idx ON public.mda_report(institution_id);
CREATE INDEX mda_report_actor_id_idx ON public.mda_report(actor_id);
CREATE INDEX mda_report_state_idx ON public.mda_report(state, created_at);
-- statement-break
CREATE TABLE public.report_revision (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  report_id uuid NOT NULL REFERENCES public.mda_report(id),
  institution_id uuid NOT NULL REFERENCES public.institution(id),
  version integer NOT NULL,
  snapshot jsonb NOT NULL,
  is_simulated boolean NOT NULL DEFAULT true CHECK (is_simulated),
  UNIQUE (report_id, version)
);
CREATE INDEX report_revision_institution_id_idx ON public.report_revision(institution_id);
-- statement-break
CREATE TABLE public.audit_event (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  actor_id uuid NOT NULL REFERENCES public.profile(id),
  action text NOT NULL,
  record_id uuid NOT NULL,
  payload_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  previous_hash text NOT NULL,
  event_hash text NOT NULL,
  is_simulated boolean NOT NULL DEFAULT true CHECK (is_simulated)
);
CREATE INDEX audit_event_actor_id_idx ON public.audit_event(actor_id);
CREATE INDEX audit_event_record_id_idx ON public.audit_event(record_id);
-- statement-break
ALTER TABLE public.mda_report ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mda_report FORCE ROW LEVEL SECURITY;
ALTER TABLE public.report_revision ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_revision FORCE ROW LEVEL SECURITY;
ALTER TABLE public.audit_event ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_event FORCE ROW LEVEL SECURITY;
-- statement-break
CREATE POLICY report_read ON public.mda_report FOR SELECT TO nexus_app USING (
  (SELECT current_setting('app.role',true)) = 'SECRETARIAT'
  OR ((SELECT current_setting('app.role',true))='MDA_OFFICER' AND institution_id::text=(SELECT current_setting('app.mda_id',true)))
  OR ((SELECT current_setting('app.role',true))='ANCHOR_ENTITY' AND state='ACCEPTED')
);
CREATE POLICY report_insert ON public.mda_report FOR INSERT TO nexus_app WITH CHECK (
  (SELECT current_setting('app.role',true))='MDA_OFFICER'
  AND institution_id::text=(SELECT current_setting('app.mda_id',true))
  AND actor_id::text=(SELECT current_setting('app.actor_id',true))
  AND state='DRAFT' AND is_simulated
);
CREATE POLICY report_update ON public.mda_report FOR UPDATE TO nexus_app USING (
  (SELECT current_setting('app.role',true))='SECRETARIAT'
  OR ((SELECT current_setting('app.role',true))='MDA_OFFICER' AND institution_id::text=(SELECT current_setting('app.mda_id',true)) AND state IN ('DRAFT','RETURNED'))
) WITH CHECK (
  (SELECT current_setting('app.role',true))='SECRETARIAT'
  OR ((SELECT current_setting('app.role',true))='MDA_OFFICER' AND institution_id::text=(SELECT current_setting('app.mda_id',true)) AND state IN ('DRAFT','RETURNED','SUBMITTED'))
);
-- statement-break
CREATE POLICY revision_read ON public.report_revision FOR SELECT TO nexus_app USING (
  (SELECT current_setting('app.role',true))='SECRETARIAT'
  OR ((SELECT current_setting('app.role',true))='MDA_OFFICER' AND institution_id::text=(SELECT current_setting('app.mda_id',true)))
);
CREATE POLICY audit_read ON public.audit_event FOR SELECT TO nexus_app USING ((SELECT current_setting('app.role',true)) IN ('SECRETARIAT','OVERSIGHT'));
-- statement-break
CREATE FUNCTION public.deny_mutation() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog AS $$
BEGIN RAISE EXCEPTION 'Append-only record'; END $$;
CREATE TRIGGER audit_immutable BEFORE UPDATE OR DELETE ON public.audit_event FOR EACH ROW EXECUTE FUNCTION public.deny_mutation();
CREATE TRIGGER revision_immutable BEFORE UPDATE OR DELETE ON public.report_revision FOR EACH ROW EXECUTE FUNCTION public.deny_mutation();
-- statement-break
CREATE FUNCTION public.enforce_report_write() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog AS $$
DECLARE role_name text := current_setting('app.role',true);
BEGIN
  IF TG_OP='INSERT' THEN
    IF NEW.version<>1 OR NEW.state<>'DRAFT' THEN RAISE EXCEPTION 'New report must be draft version 1'; END IF;
    RETURN NEW;
  END IF;
  IF NEW.id<>OLD.id OR NEW.institution_id<>OLD.institution_id OR NEW.actor_id<>OLD.actor_id OR NEW.created_at<>OLD.created_at OR NEW.is_simulated<>OLD.is_simulated THEN
    RAISE EXCEPTION 'Report identity and provenance are immutable';
  END IF;
  IF NEW.version<>OLD.version+1 THEN RAISE EXCEPTION 'Version must increase by one'; END IF;
  IF role_name='MDA_OFFICER' THEN
    IF OLD.state NOT IN ('DRAFT','RETURNED') OR NEW.state NOT IN (OLD.state,'SUBMITTED') OR NEW.review_comment<>OLD.review_comment THEN
      RAISE EXCEPTION 'MDA transition is not allowed';
    END IF;
  ELSIF role_name='SECRETARIAT' THEN
    IF NEW.title<>OLD.title OR NEW.period<>OLD.period OR NEW.narrative<>OLD.narrative THEN RAISE EXCEPTION 'Reviewer cannot rewrite MDA narrative'; END IF;
    IF NOT ((OLD.state IN ('SUBMITTED','AI_SUMMARISED') AND NEW.state='UNDER_REVIEW') OR (OLD.state='UNDER_REVIEW' AND NEW.state IN ('ACCEPTED','RETURNED'))) THEN
      RAISE EXCEPTION 'Review transition is not allowed';
    END IF;
    IF NEW.state='RETURNED' AND length(trim(NEW.review_comment))=0 THEN RAISE EXCEPTION 'Return requires comment'; END IF;
  ELSE RAISE EXCEPTION 'Role cannot update reports';
  END IF;
  NEW.updated_at=clock_timestamp();
  RETURN NEW;
END $$;
CREATE TRIGGER report_write_guard BEFORE INSERT OR UPDATE ON public.mda_report FOR EACH ROW EXECUTE FUNCTION public.enforce_report_write();
-- statement-break
CREATE FUNCTION public.audit_report_change() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE previous text; content_hash text; action_name text; actor uuid;
BEGIN
  actor := nullif(current_setting('app.actor_id',true),'')::uuid;
  IF actor IS NULL THEN RAISE EXCEPTION 'Actor context is required'; END IF;
  PERFORM pg_advisory_xact_lock(180406);
  SELECT event_hash INTO previous FROM public.audit_event ORDER BY id DESC LIMIT 1;
  previous := coalesce(previous,repeat('0',64));
  content_hash := encode(public.digest(to_jsonb(NEW)::text,'sha256'),'hex');
  action_name := TG_OP || ':' || NEW.state;
  INSERT INTO public.audit_event(actor_id,action,record_id,payload_hash,previous_hash,event_hash)
  VALUES(actor,action_name,NEW.id,content_hash,previous,encode(public.digest(previous || '|' || actor::text || '|' || action_name || '|' || NEW.id::text || '|' || content_hash,'sha256'),'hex'));
  INSERT INTO public.report_revision(report_id,institution_id,version,snapshot) VALUES(NEW.id,NEW.institution_id,NEW.version,to_jsonb(NEW));
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.audit_report_change() FROM PUBLIC;
CREATE TRIGGER report_audit AFTER INSERT OR UPDATE ON public.mda_report FOR EACH ROW EXECUTE FUNCTION public.audit_report_change();
-- statement-break
GRANT USAGE ON SCHEMA public TO nexus_app;
GRANT SELECT ON public.institution, public.profile, public.mda_report, public.report_revision, public.audit_event TO nexus_app;
GRANT INSERT, UPDATE ON public.mda_report TO nexus_app;
