'use client';
import {useState} from 'react';
import {managementBrowser} from '../../lib/manage-browser';

export default function Login() {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  async function signInGoogle() {
    setBusy(true); setStatus('');
    try {
      const {error} = await managementBrowser().auth.signInWithOAuth({provider: 'google', options: {redirectTo: `${window.location.origin}/manage/confirm`}});
      if (error) {setStatus('Google sign-in could not start. Please try again.'); setBusy(false);}
    } catch {setStatus('The login service could not be reached. Please try again.'); setBusy(false);}
  }
  async function signIn(event) {
    event.preventDefault(); setBusy(true); setStatus('');
    try {
      const {error} = await managementBrowser().auth.signInWithOtp({email: email.trim(), options: {emailRedirectTo: `${window.location.origin}/manage/confirm`}});
      setStatus(error ? 'Could not send your login email. Please try again, or contact the owner if email delivery has not been configured.' : 'Check your email for a sign-in link.');
    } catch {setStatus('The login service could not be reached. Please try again.');}
    finally {setBusy(false);}
  }
  return <main className="managementLogin"><div className="managementKicker">THE PRIVATE DESK</div><h1>Your bureau.<br/>Your business.</h1><p>Sign in to manage the editions you have been given access to.</p><button type="button" onClick={signInGoogle} disabled={busy}>{busy ? 'Connecting…' : 'Sign in with Google'}</button><p>Use the Google account you have been given access with.</p><details><summary>Email-link sign-in</summary><form onSubmit={signIn}><label>Email address<input type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} required maxLength={254}/></label><button disabled={busy}>{busy ? 'Sending…' : 'Email me a sign-in link'}</button></form></details><p role="status" className="managementStatus">{status}</p></main>;
}
