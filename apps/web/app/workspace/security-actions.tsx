'use client';
import { useState } from 'react';

export default function AccountActions({csrfToken}:{csrfToken:string}) {
  const[error,setError]=useState('');
  const[busy,setBusy]=useState(false);
  async function logout(){setBusy(true);try{const response=await fetch('/backend/auth/logout',{method:'POST',headers:{'Content-Type':'application/json','X-CSRF-Token':csrfToken},body:'{}'});if(!response.ok&&response.status!==401)throw new Error('Sign-out failed. Please retry.');window.location.assign('/');}catch(cause){setError((cause as Error).message);setBusy(false);}}
  return <>{error&&<p role="alert" className="error">{error}</p>}<button disabled={busy} onClick={()=>void logout()}>Sign out</button></>;
}
