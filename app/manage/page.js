import Link from 'next/link';
import {managementSession} from '../../lib/manage-auth';
import Login from './Login';
import AccountControls from './AccountControls';

export default async function ManagementHome() {
  let session;
  try {session = await managementSession();} catch {return <main className="managementMain"><h1>Desk temporarily unavailable.</h1><p>Please try again in a moment.</p></main>;}
  if (!session.user) return <Login/>;
  const {data: tenants, error} = await session.db.from('brief_tenants').select('id,slug,name,publication_name').order('name');
  return <main className="managementMain"><AccountControls email={session.user.email} setup={!session.owner}/><div className="managementKicker">{session.owner ? 'OWNER DESK' : 'YOUR EDITIONS'}</div><h1>Open a bureau.</h1>{error ? <p role="alert">Could not load your editions. Please try again.</p> : !tenants?.length ? <div className="managementEmpty"><h2>No management access yet.</h2><p>The owner needs to grant access to this email address.</p></div> : <div className="managementBureaus">{tenants.map(tenant => <Link className="managementBureau" href={`/manage/${tenant.slug}`} key={tenant.id}><span className="managementKicker">{session.owner ? 'OWNER ACCESS' : 'ASSIGNED EDITION'}</span><h2>{tenant.name}</h2><p>{tenant.publication_name}</p><b>Open bureau →</b></Link>)}</div>}</main>;
}
