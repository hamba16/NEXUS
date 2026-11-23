ALTER TABLE public.profile DROP CONSTRAINT profile_role_check;
ALTER TABLE public.profile ALTER COLUMN role TYPE varchar(32);
UPDATE public.profile SET active=false;
UPDATE public.profile SET role=CASE role WHEN 'CONVENER' THEN 'PRESIDENCY_VIEWER' WHEN 'SECRETARIAT' THEN 'DSEMR_ANALYST' WHEN 'MDA_OFFICER' THEN 'MINISTRY_FOCAL' WHEN 'FIELD_MONITOR' THEN 'FIELD_VERIFIER' WHEN 'ANCHOR_ENTITY' THEN 'APEX_SECRETARIAT' WHEN 'OVERSIGHT' THEN 'OVERSIGHT_LIAISON' ELSE role END;
ALTER TABLE public.profile ADD CONSTRAINT profile_role_check CHECK(role IN ('PRESIDENCY_VIEWER','DSEMR_ANALYST','MIU_ANALYST','CABINET_SECRETARIAT','APEX_SECRETARIAT','MINISTRY_FOCAL','ACCOUNTING_OFFICER','FIELD_VERIFIER','OVERSIGHT_LIAISON','DATA_PROTECTION_OFFICER','SYSTEM_ADMINISTRATOR'));
ALTER TABLE public.profile DROP CONSTRAINT profile_is_simulated_check;
ALTER TABLE public.profile RENAME COLUMN is_simulated TO is_sample;
ALTER TABLE public.profile ALTER COLUMN is_sample SET DEFAULT false;
ALTER TABLE public.mda_report DROP CONSTRAINT open_report_simulated;
ALTER TABLE public.mda_report RENAME COLUMN is_simulated TO is_sample;
ALTER TABLE public.mda_report ALTER COLUMN is_sample SET DEFAULT false;
ALTER TABLE public.mda_report ADD COLUMN directive_id uuid REFERENCES public.directive(id);
ALTER TABLE public.mda_report ADD COLUMN district_id uuid;
CREATE INDEX mda_report_directive_idx ON public.mda_report(directive_id);
CREATE INDEX mda_report_district_idx ON public.mda_report(district_id);
ALTER TABLE public.audit_event RENAME COLUMN is_simulated TO is_sample;
ALTER TABLE public.audit_event DROP CONSTRAINT audit_event_is_simulated_check;
ALTER TABLE public.audit_event ALTER COLUMN is_sample SET DEFAULT false;
ALTER TABLE public.report_revision RENAME COLUMN is_simulated TO is_sample;
ALTER TABLE public.report_revision DROP CONSTRAINT report_revision_is_simulated_check;
ALTER TABLE public.report_revision ALTER COLUMN is_sample SET DEFAULT false;
REVOKE INSERT, UPDATE, DELETE ON public.public_context_pack, public.public_context_record FROM nexus_app;
-- statement-break
CREATE TABLE public.district(id uuid PRIMARY KEY, name text NOT NULL UNIQUE, source jsonb NOT NULL DEFAULT '{}');
ALTER TABLE public.mda_report ADD CONSTRAINT report_district_fk FOREIGN KEY(district_id) REFERENCES public.district(id);
ALTER TABLE public.institution ADD COLUMN is_sample boolean NOT NULL DEFAULT false;
ALTER TABLE public.institution ADD COLUMN archived boolean NOT NULL DEFAULT false;
UPDATE public.institution SET is_sample=true,archived=true WHERE provenance='simulated';
CREATE TABLE public.auth_account (
  id uuid PRIMARY KEY REFERENCES public.profile(id),
  email text NOT NULL UNIQUE CHECK(email=lower(email)),
  password_hash text NOT NULL,
  must_change_password boolean NOT NULL DEFAULT true,
  credential_expires_at timestamptz,
  failed_attempts integer NOT NULL DEFAULT 0,
  locked_until timestamptz,
  totp_secret text,
  pending_totp text,
  totp_last_counter bigint NOT NULL DEFAULT -1,
  recovery_hashes jsonb NOT NULL DEFAULT '[]',
  ministry_ids uuid[] NOT NULL DEFAULT '{}',
  district_ids uuid[] NOT NULL DEFAULT '{}',
  directive_ids uuid[] NOT NULL DEFAULT '{}',
  all_ministries boolean NOT NULL DEFAULT false,
  all_directives boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.auth_session (
  token_hash text PRIMARY KEY CHECK(length(token_hash)=64),
  account_id uuid NOT NULL REFERENCES public.auth_account(id),
  stage text NOT NULL CHECK(stage IN ('password','enrol','mfa','full')),
  created_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  idle_expires_at timestamptz NOT NULL
);
CREATE INDEX auth_session_account_idx ON public.auth_session(account_id);
CREATE INDEX auth_session_expiry_idx ON public.auth_session(expires_at);
CREATE TABLE public.auth_throttle(key_hash text PRIMARY KEY,window_start timestamptz NOT NULL DEFAULT now(),attempts integer NOT NULL DEFAULT 1);
CREATE TABLE public.security_event (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  account_id uuid REFERENCES public.profile(id),
  action text NOT NULL,
  detail jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX security_event_account_idx ON public.security_event(account_id,created_at);
CREATE TRIGGER security_event_immutable BEFORE UPDATE OR DELETE ON public.security_event FOR EACH ROW EXECUTE FUNCTION public.deny_mutation();
-- statement-break
ALTER TABLE public.auth_account ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auth_account FORCE ROW LEVEL SECURITY;
ALTER TABLE public.auth_session ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auth_session FORCE ROW LEVEL SECURITY;
ALTER TABLE public.auth_throttle ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auth_throttle FORCE ROW LEVEL SECURITY;
ALTER TABLE public.security_event ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_event FORCE ROW LEVEL SECURITY;
CREATE POLICY auth_account_service ON public.auth_account USING(current_user<>'nexus_app' OR current_setting('app.auth_operation',true)='1') WITH CHECK(current_user<>'nexus_app' OR current_setting('app.auth_operation',true)='1');
CREATE POLICY auth_session_service ON public.auth_session USING(current_user<>'nexus_app' OR current_setting('app.auth_operation',true)='1') WITH CHECK(current_user<>'nexus_app' OR current_setting('app.auth_operation',true)='1');
CREATE POLICY auth_throttle_service ON public.auth_throttle USING(current_user<>'nexus_app' OR current_setting('app.auth_operation',true)='1') WITH CHECK(current_user<>'nexus_app' OR current_setting('app.auth_operation',true)='1');
CREATE POLICY security_event_service ON public.security_event USING(current_user<>'nexus_app' OR current_setting('app.auth_operation',true)='1') WITH CHECK(current_user<>'nexus_app' OR current_setting('app.auth_operation',true)='1');
GRANT SELECT,INSERT,UPDATE,DELETE ON public.auth_account,public.auth_session,public.auth_throttle TO nexus_app;
GRANT SELECT,INSERT ON public.security_event TO nexus_app;
GRANT USAGE ON SEQUENCE public.security_event_id_seq TO nexus_app;
-- statement-break
CREATE FUNCTION public.session_actor() RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $$
  SELECT s.account_id FROM public.auth_session s JOIN public.profile p ON p.id=s.account_id JOIN public.auth_account a ON a.id=s.account_id
  WHERE s.token_hash=encode(public.digest(coalesce(current_setting('app.session_token',true),''),'sha256'),'hex')
  AND s.stage='full' AND s.expires_at>now() AND s.idle_expires_at>now() AND p.active AND NOT a.must_change_password
  AND a.totp_secret IS NOT NULL
$$;
CREATE FUNCTION public.session_role() RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $$
  SELECT role FROM public.profile WHERE id=public.session_actor()
$$;
CREATE FUNCTION public.record_scope(ministry uuid,district uuid,directive uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $$
  SELECT coalesce(bool_or(
    p.role NOT IN ('SYSTEM_ADMINISTRATOR','DATA_PROTECTION_OFFICER')
    AND (a.all_ministries OR ministry=ANY(a.ministry_ids))
    AND directive IS NOT NULL AND (a.all_directives OR directive=ANY(a.directive_ids))
    AND (p.role<>'FIELD_VERIFIER' OR district=ANY(a.district_ids))
  ),false) FROM public.auth_account a JOIN public.profile p ON p.id=a.id WHERE a.id=public.session_actor()
$$;
REVOKE ALL ON FUNCTION public.session_actor(),public.session_role(),public.record_scope(uuid,uuid,uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.session_actor(),public.session_role(),public.record_scope(uuid,uuid,uuid) TO nexus_app;
-- statement-break
ALTER TABLE public.profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile FORCE ROW LEVEL SECURITY;
CREATE POLICY profile_access ON public.profile USING(current_user<>'nexus_app' OR current_setting('app.auth_operation',true)='1' OR id=public.session_actor());
CREATE POLICY profile_insert ON public.profile FOR INSERT WITH CHECK(current_user<>'nexus_app' OR (current_setting('app.auth_operation',true)='1' AND public.session_role()='SYSTEM_ADMINISTRATOR'));
GRANT INSERT,UPDATE ON public.profile TO nexus_app;
GRANT SELECT ON public.district TO nexus_app;
-- statement-break
DROP POLICY report_read ON public.mda_report;
DROP POLICY report_insert ON public.mda_report;
DROP POLICY report_update ON public.mda_report;
DROP POLICY revision_read ON public.report_revision;
DROP POLICY audit_read ON public.audit_event;
CREATE POLICY report_read ON public.mda_report FOR SELECT TO nexus_app USING(public.record_scope(institution_id,district_id,directive_id) AND (public.session_role() NOT IN ('PRESIDENCY_VIEWER','OVERSIGHT_LIAISON','FIELD_VERIFIER') OR state='ACCEPTED'));
CREATE POLICY report_insert ON public.mda_report FOR INSERT TO nexus_app WITH CHECK(public.session_role()='MINISTRY_FOCAL' AND actor_id=public.session_actor() AND public.record_scope(institution_id,district_id,directive_id) AND state='DRAFT');
CREATE POLICY report_update ON public.mda_report FOR UPDATE TO nexus_app USING(public.record_scope(institution_id,district_id,directive_id) AND public.session_role() IN ('MINISTRY_FOCAL','DSEMR_ANALYST','MIU_ANALYST','CABINET_SECRETARIAT','APEX_SECRETARIAT','ACCOUNTING_OFFICER')) WITH CHECK(public.record_scope(institution_id,district_id,directive_id));
CREATE POLICY revision_read ON public.report_revision FOR SELECT TO nexus_app USING(EXISTS(SELECT 1 FROM public.mda_report r WHERE r.id=report_id));
CREATE POLICY audit_read ON public.audit_event FOR SELECT TO nexus_app USING(public.session_role() IN ('SYSTEM_ADMINISTRATOR','DATA_PROTECTION_OFFICER') OR EXISTS(SELECT 1 FROM public.mda_report r WHERE r.id=record_id));
-- statement-break
CREATE OR REPLACE FUNCTION public.enforce_report_write() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog AS $$
DECLARE role_name text := public.session_role();
BEGIN
  IF TG_OP='INSERT' THEN
    IF NEW.version<>1 OR NEW.state<>'DRAFT' OR NEW.directive_id IS NULL THEN RAISE EXCEPTION 'New report requires a directive and draft version 1'; END IF;
    RETURN NEW;
  END IF;
  IF NEW.id<>OLD.id OR NEW.institution_id<>OLD.institution_id OR NEW.actor_id<>OLD.actor_id OR NEW.created_at<>OLD.created_at OR NEW.is_sample<>OLD.is_sample OR NEW.directive_id IS DISTINCT FROM OLD.directive_id OR NEW.district_id IS DISTINCT FROM OLD.district_id THEN RAISE EXCEPTION 'Report identity and scope are immutable'; END IF;
  IF NEW.version<>OLD.version+1 THEN RAISE EXCEPTION 'Version must increase by one'; END IF;
  IF role_name='MINISTRY_FOCAL' THEN
    IF OLD.state NOT IN ('DRAFT','RETURNED') OR NEW.state NOT IN (OLD.state,'SUBMITTED') OR NEW.review_comment<>OLD.review_comment THEN RAISE EXCEPTION 'Officer transition is not allowed'; END IF;
  ELSIF role_name IN ('DSEMR_ANALYST','MIU_ANALYST','CABINET_SECRETARIAT','APEX_SECRETARIAT','ACCOUNTING_OFFICER') THEN
    IF NEW.title<>OLD.title OR NEW.period<>OLD.period OR NEW.narrative<>OLD.narrative THEN RAISE EXCEPTION 'Reviewer cannot rewrite report content'; END IF;
    IF NOT ((OLD.state IN ('SUBMITTED','AI_SUMMARISED') AND NEW.state='UNDER_REVIEW') OR (OLD.state='UNDER_REVIEW' AND NEW.state IN ('ACCEPTED','RETURNED'))) THEN RAISE EXCEPTION 'Review transition is not allowed'; END IF;
    IF NEW.state='RETURNED' AND length(trim(NEW.review_comment))=0 THEN RAISE EXCEPTION 'Return requires comment'; END IF;
  ELSE RAISE EXCEPTION 'Role cannot update reports'; END IF;
  NEW.updated_at=clock_timestamp();
  RETURN NEW;
END $$;
-- statement-break
CREATE OR REPLACE FUNCTION public.audit_report_change() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE previous text; content_hash text; action_name text; actor uuid;
BEGIN
  actor := public.session_actor();
  IF actor IS NULL THEN RAISE EXCEPTION 'An authenticated account is required'; END IF;
  PERFORM pg_advisory_xact_lock(180406);
  SELECT event_hash INTO previous FROM public.audit_event ORDER BY id DESC LIMIT 1;
  previous := coalesce(previous,repeat('0',64));
  content_hash := encode(public.digest(to_jsonb(NEW)::text,'sha256'),'hex');
  action_name := TG_OP || ':' || NEW.state;
  INSERT INTO public.audit_event(actor_id,action,record_id,payload_hash,previous_hash,event_hash,is_sample)
  VALUES(actor,action_name,NEW.id,content_hash,previous,encode(public.digest(previous || '|' || actor::text || '|' || action_name || '|' || NEW.id::text || '|' || content_hash,'sha256'),'hex'),NEW.is_sample);
  INSERT INTO public.report_revision(report_id,institution_id,version,snapshot,is_sample) VALUES(NEW.id,NEW.institution_id,NEW.version,to_jsonb(NEW),NEW.is_sample);
  RETURN NEW;
END $$;
