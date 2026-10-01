import {dbSelect} from './server-db';

export async function getEditionData(slug){
  const tenants=await dbSelect('brief_tenants','slug=eq.'+encodeURIComponent(slug)+'&select=id,slug,name,publication_name,settings');
  const tenant=tenants[0];
  if(!tenant) return null;
  const leagues=await dbSelect('brief_leagues','tenant_id=eq.'+tenant.id+'&status=eq.active&select=id,name,provider,provider_league_key,season,sport,settings,last_synced_at&order=updated_at.desc&limit=1');
  const league=leagues[0];
  if(!league) return {tenant,league:null,snapshots:{}};
  const rows=await dbSelect('brief_league_snapshots','league_id=eq.'+league.id+'&select=snapshot_type,data,created_at&order=created_at.desc&limit=40');
  const snapshots={};
  for(const row of rows){ if(!snapshots[row.snapshot_type]) snapshots[row.snapshot_type]=row; }
  return {tenant,league,snapshots};
}
