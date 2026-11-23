'use client';

import { useEffect, useState } from 'react';

type Stage = 'login'|'password'|'enrol'|'mfa'|'codes';
type Result = { stage?: Stage|'full'; csrf_token?: string; recovery_codes?: string[]; secret?: string; detail?: string };

export default function SignIn({ supportEmail }: { supportEmail: string }) {
  const [stage,setStage]=useState<Stage>('login');
  const [email,setEmail]=useState('');
  const [password,setPassword]=useState('');
  const [confirm,setConfirm]=useState('');
  const [csrf,setCsrf]=useState('');
  const [code,setCode]=useState('');
  const [method,setMethod]=useState<'totp'|'recovery'>('totp');
  const [secret,setSecret]=useState('');
  const [codes,setCodes]=useState<string[]>([]);
  const [error,setError]=useState('');
  const [busy,setBusy]=useState(false);

  function accept(result: Result) {
    if(result.csrf_token) setCsrf(result.csrf_token);
    setCode(''); setPassword(''); setConfirm('');
    if(result.recovery_codes) { setCodes(result.recovery_codes); setStage('codes'); }
    else if(result.stage==='full') window.location.assign('/workspace');
    else if(result.stage) setStage(result.stage);
  }

  useEffect(()=>{
    const controller=new AbortController();
    fetch('/backend/auth/session',{signal:controller.signal,cache:'no-store'}).then(async response=>{if(response.ok) accept(await response.json());}).catch(()=>{});
    return()=>controller.abort();
  },[]);

  async function send(path: string, body: object, token=csrf): Promise<Result> {
    const response=await fetch(`/backend/auth${path}`,{method:'POST',headers:{'Content-Type':'application/json','X-CSRF-Token':token},body:JSON.stringify(body)});
    const result=await response.json().catch(()=>({detail:'The service could not be reached. Please retry.'}));
    if(!response.ok) throw new Error(typeof result.detail==='string'?result.detail:'Check the entries and try again.');
    return result;
  }

  async function submit() {
    setBusy(true);setError('');
    try {
      if(stage==='login') {
        const response=await fetch('/backend/auth/csrf',{cache:'no-store'});
        if(!response.ok) throw new Error('The sign-in service is unavailable. Please retry.');
        const challenge=await response.json();
        accept(await send('/login',{email,password},challenge.csrf_token));
      } else if(stage==='password') {
        if(password!==confirm) throw new Error('The passwords do not match.');
        accept(await send('/password',{password}));
      } else if(stage==='enrol') accept(await send('/mfa/confirm',{code,method:'totp'}));
      else if(stage==='mfa') accept(await send('/mfa/verify',{code,method}));
    } catch(cause) { setError((cause as Error).message); }
    finally {setBusy(false);}
  }

  async function setup() {
    setBusy(true);setError('');
    try { const result=await send('/mfa/enrol',{});setSecret(result.secret || ''); }
    catch(cause) {setError((cause as Error).message);}
    finally {setBusy(false);}
  }

  const title={login:'Sign in',password:'Choose your password',enrol:'Set up your authenticator',mfa:'Verify your sign-in',codes:'Save your recovery codes'}[stage];
  return <section className="entrance-panel" aria-labelledby="sign-in-title"><h2 id="sign-in-title">{title}</h2>
    {error&&<p role="alert" className="error">{error}</p>}
    {stage==='codes'?<><p>Keep these codes in a secure place. Each can be used once if you lose access to your authenticator. They will not be shown again.</p><ul className="recovery-codes">{codes.map(value=><li key={value}><code data-testid="recovery-code">{value}</code></li>)}</ul><button onClick={()=>window.location.assign('/workspace')}>I have saved my codes</button></>:<form onSubmit={event=>{event.preventDefault();void submit();}}>
      {stage==='login'&&<><p className="muted">Use the account issued by your organisation.</p><div className="form-field"><label htmlFor="email">Email address</label><input id="email" type="email" autoComplete="username" required value={email} onChange={e=>setEmail(e.target.value)}/></div><div className="form-field"><label htmlFor="password">Password</label><input id="password" type="password" autoComplete="current-password" required maxLength={128} value={password} onChange={e=>setPassword(e.target.value)}/></div></>}
      {stage==='password'&&<><p>Replace your temporary credential with a unique password or passphrase of at least 14 characters.</p><div className="form-field"><label htmlFor="new-password">New password</label><input id="new-password" type="password" autoComplete="new-password" minLength={14} maxLength={128} required value={password} onChange={e=>setPassword(e.target.value)}/></div><div className="form-field"><label htmlFor="confirm-password">Confirm password</label><input id="confirm-password" type="password" autoComplete="new-password" required value={confirm} onChange={e=>setConfirm(e.target.value)}/></div></>}
      {stage==='enrol'&&<><p>Add an account to your authenticator app using the setup key, then enter its current code.</p>{!secret?<button type="button" disabled={busy} onClick={()=>void setup()}>Create setup key</button>:<div className="form-field"><label htmlFor="setup-key">Authenticator setup key</label><input id="setup-key" readOnly value={secret} autoComplete="off" spellCheck={false}/><p className="muted">Time-based code · Six digits · 30-second interval</p></div>}</>}
      {(stage==='enrol'&&secret||stage==='mfa')&&<><div className="form-field"><label htmlFor="verification-code">{method==='recovery'?'Recovery code':'Authenticator code'}</label><input id="verification-code" autoComplete="one-time-code" inputMode={method==='totp'?'numeric':'text'} required value={code} onChange={e=>setCode(e.target.value)} maxLength={100}/></div>{stage==='mfa'&&<button className="text-button" type="button" onClick={()=>{setMethod(method==='totp'?'recovery':'totp');setCode('');}}>{method==='totp'?'Use a recovery code':'Use an authenticator code'}</button>}</>}
      {(stage!=='enrol'||secret)&&<button className="full-width" type="submit" disabled={busy}>{busy?'Checking…':stage==='login'?'Sign in':stage==='password'?'Save password':'Verify code'}</button>}
    </form>}
    <p className="support">Need access or a password reset? {supportEmail?<a href={`mailto:${supportEmail}`}>Contact support</a>:'Contact your system administrator.'}</p>
    <p className="support"><a href="/privacy">Privacy notice</a> · <a href="/terms">Terms of use</a></p>
  </section>;
}
