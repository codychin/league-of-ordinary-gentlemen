'use client';

import { useEffect, useState } from 'react';
import { OPT_OUT_KEY } from '../../lib/web-analytics.mjs';

export default function Preferences() {
  const [excluded, setExcluded] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    function read() {
      try { setExcluded(localStorage.getItem(OPT_OUT_KEY) === '1'); }
      catch { setError('Browser storage is unavailable. Analytics are suppressed while storage is unavailable.'); }
    }
    read();
    window.addEventListener('storage', read);
    return () => window.removeEventListener('storage', read);
  }, []);
  function change(value) {
    try {
      if (value) localStorage.setItem(OPT_OUT_KEY, '1');
      else localStorage.removeItem(OPT_OUT_KEY);
      setExcluded(value);
      setError('');
    } catch { setError('Could not save this preference. Check your browser storage settings.'); }
  }
  return <>
    <p role="status">{excluded === null ? 'Checking this browser…' : excluded ? 'This browser is excluded from pageview analytics.' : 'This browser is not excluded from pageview analytics.'}</p>
    {error && <p role="alert">{error}</p>}
    <button disabled={excluded === null} onClick={() => change(!excluded)}>{excluded ? 'Allow pageview analytics in this browser' : 'Exclude this browser'}</button>
  </>;
}
