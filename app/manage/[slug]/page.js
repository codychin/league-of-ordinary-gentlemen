import {redirect, notFound} from 'next/navigation';
import {managementSession, managementTenant} from '../../../lib/manage-auth';
import AccountControls from '../AccountControls';
import ManagementConsole from '../ManagementConsole';

export default async function ManageBureau({params}) {
  const {slug} = await params;
  const {db, user, owner} = await managementSession();
  if (!user) redirect('/manage');
  const tenant = await managementTenant(db, slug);
  if (!tenant) notFound();
  const [articles, memories, access] = await Promise.all([
    db.from('brief_publication_articles').select('id,slug,title,dek,body,writer_slug,section,status,published_at').eq('scope', 'league').eq('league_id', tenant.league.id).order('updated_at', {ascending: false}).limit(100),
    db.from('brief_league_memory').select('id,subject_type,subject_key,memory_key,content,status').eq('league_id', tenant.league.id).order('updated_at', {ascending: false}).limit(100),
    owner ? db.from('brief_tenant_access').select('id,email,role,created_at').eq('tenant_id', tenant.id).order('created_at') : Promise.resolve({data: []}),
  ]);
  if (articles.error || memories.error || access.error) throw new Error('Could not load the bureau. Please try again.');
  return <main className="managementMain"><AccountControls email={user.email}/><div className="managementKicker">{tenant.role.toUpperCase()} ACCESS</div><h1>{tenant.name}</h1><p className="managementIntro">{tenant.league.provider.toUpperCase()} · {tenant.league.season} · Shared newsroom, local context.</p><ManagementConsole tenant={tenant} owner={owner} articles={articles.data} memories={memories.data} access={access.data}/></main>;
}
