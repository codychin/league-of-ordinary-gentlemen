'use client';
import {useEffect, useState} from 'react';
import Link from 'next/link';
import {managementBrowser} from '../../../lib/manage-browser';

export default function ConfirmLogin() {
  const [status, setStatus] = useState('Completing your sign-in…');
  useEffect(() => {
    let active = true;
    (async () => {
      const params = new URLSearchParams(window.location.hash.slice(1));
      const access_token = params.get('access_token');
      const refresh_token = params.get('refresh_token');
      const error = params.get('error_description');
      window.history.replaceState(null, '', '/manage/confirm');
      const db = managementBrowser();
      if (error) {if (active) setStatus('This sign-in link has expired or is invalid. Request a new one.'); return;}
      if (access_token && refresh_token) {
        const {error: sessionError} = await db.auth.setSession({access_token, refresh_token});
        if (sessionError) {if (active) setStatus('This sign-in link could not be verified. Request a new one.'); return;}
      }
      const {data: {user}} = await db.auth.getUser();
      if (user && active) window.location.replace('/manage');
      else if (active) setStatus('This sign-in link could not be verified. Request a new one.');
    })().catch(() => {if (active) setStatus('The login service could not be reached. Please try again.');});
    return () => {active = false;};
  }, []);
  return <main className="managementLogin"><h1>Signing in.</h1><p role="status">{status}</p><Link href="/manage">Return to login</Link></main>;
}
