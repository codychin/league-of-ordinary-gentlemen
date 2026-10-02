'use client';
import {useState} from 'react';
import {managementBrowser} from '../../lib/manage-browser';

export default function AccountControls({email, setup = false}) {
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  async function activate(event) {
    event.preventDefault(); setBusy(true); setStatus('');
    const code = new FormData(event.currentTarget).get('code');
    try {
      const response = await fetch('/api/manage', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({action: 'claimOwner', code})});
      const result = await response.json();
      if (!response.ok) setStatus(result.error || 'Setup failed.');
      else window.location.reload();
    } catch {setStatus('Could not reach the management service.');}
    finally {setBusy(false);}
  }
  async function signOut() {
    setBusy(true);
    try {await managementBrowser().auth.signOut({scope: 'local'}); window.location.replace('/manage');}
    catch {setStatus('Could not sign out. Please try again.'); setBusy(false);}
  }
  return <div><div className="managementAccount"><span>{email}</span><button className="managementSecondary" onClick={signOut} disabled={busy}>Sign out</button></div>{setup && <details className="managementSetup"><summary>First-time owner setup</summary><p>Use the one-time setup code supplied to the owner. Signing in alone does not grant management access.</p><form onSubmit={activate}><label>Owner setup code<input name="code" type="password" required autoComplete="off" maxLength={100}/></label><button disabled={busy}>Activate owner access</button></form></details>}<p role="status" className="managementStatus">{status}</p></div>;
}
