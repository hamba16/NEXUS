"""Restrict account profile mutations and directive reads.

Revision ID: 0006
"""
from alembic import op

revision='0006'
down_revision='0005'
branch_labels=None
depends_on=None


def upgrade():
    op.execute('DROP POLICY profile_access ON public.profile')
    op.execute("CREATE POLICY profile_read ON public.profile FOR SELECT USING(current_user<>'nexus_app' OR current_setting('app.auth_operation',true)='1' OR id=public.session_actor())")
    op.execute("CREATE POLICY profile_update ON public.profile FOR UPDATE USING(current_user<>'nexus_app' OR (current_setting('app.auth_operation',true)='1' AND public.session_role()='SYSTEM_ADMINISTRATOR')) WITH CHECK(current_user<>'nexus_app' OR (current_setting('app.auth_operation',true)='1' AND public.session_role()='SYSTEM_ADMINISTRATOR'))")
    op.execute("""CREATE FUNCTION public.directive_scope(record_id uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $$
      SELECT coalesce(bool_or(p.role='SYSTEM_ADMINISTRATOR' OR a.all_directives OR record_id=ANY(a.directive_ids)),false)
      FROM public.auth_account a JOIN public.profile p ON p.id=a.id WHERE a.id=public.session_actor()
    $$""")
    op.execute('REVOKE ALL ON FUNCTION public.directive_scope(uuid) FROM PUBLIC')
    op.execute('GRANT EXECUTE ON FUNCTION public.directive_scope(uuid) TO nexus_app')
    op.execute('ALTER TABLE public.directive ENABLE ROW LEVEL SECURITY')
    op.execute('ALTER TABLE public.directive FORCE ROW LEVEL SECURITY')
    op.execute("CREATE POLICY directive_read ON public.directive FOR SELECT USING(current_user<>'nexus_app' OR public.directive_scope(id))")
    op.execute("CREATE POLICY directive_owner_write ON public.directive FOR ALL USING(current_user<>'nexus_app') WITH CHECK(current_user<>'nexus_app')")


def downgrade():
    raise RuntimeError('Scope controls require a reviewed forward migration or database restore.')
