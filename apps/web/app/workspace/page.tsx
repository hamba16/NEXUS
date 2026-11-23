import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import AccountActions from './security-actions';

export const metadata: Metadata={title:'Your workspace'};
export const dynamic='force-dynamic';

export default async function Workspace() {
  const token=cookies().get('__Host-nexus_session')?.value;
  if(!token) redirect('/');
  const response=await fetch(`${process.env.API_BASE_URL || 'http://127.0.0.1:8000'}/auth/session`,{headers:{Cookie:`__Host-nexus_session=${token}`},cache:'no-store'});
  if(!response.ok) redirect('/');
  const session=await response.json();
  if(session.stage!=='full') redirect('/');
  return <main id="main" className="document"><p className="eyebrow">Your workspace</p><h1>Welcome, {session.account.name}</h1><section className="card"><h2>Your account</h2><dl><dt>Organisation</dt><dd>{session.account.institution_name}</dd><dt>Role</dt><dd>{session.account.role.replaceAll('_',' ').toLowerCase()}</dd><dt>Email</dt><dd>{session.account.email}</dd></dl><AccountActions csrfToken={session.csrf_token}/></section></main>;
}
