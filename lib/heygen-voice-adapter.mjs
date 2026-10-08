import fs from 'node:fs';
import path from 'node:path';
import {loadPronunciations,validateVoicePreflight} from './voice-preflight.mjs';

// This is an offline request builder, not a network or video-generation function.
// Vendor authorization, final video asset approval and usage accounting live upstream.
export const MAIN_GLOSSARY_ID = 'efaca59a90f74128a87a3d59f94733f5';
export function loadVoiceProfiles(file = path.join(process.cwd(),'data','voice-profiles.json')) {
  const data = JSON.parse(fs.readFileSync(file,'utf8'));
  if (data.schemaVersion !== 1 || !Array.isArray(data.profiles)) throw new Error('Invalid voice profiles schema');
  return data.profiles;
}
export function compareProviderGlossary(providerTerms, canon = loadPronunciations()) {
  const existing = new Map(providerTerms.map(x => [x.term.toLowerCase(),x.pronunciation]));
  const differences = [];
  for (const entry of canon.entries) {
    const terms = [entry.term, ...(entry.alias || [])];
    // The canonical respelling is authoritative for a comparison, not an automatic overwrite:
    // individual vendor renderings must be audio-approved before syncing.
    for (const term of terms) {
      const observed = existing.get(term.toLowerCase());
      if (!observed) differences.push({term,kind:'missing',canonical:entry.spoken});
      else if (observed.toLowerCase() !== entry.spoken.toLowerCase()) differences.push({term,kind:'different',canonical:entry.spoken,provider:observed});
    }
  }
  return differences;
}
export function prepareHeyGenVideoRequest(job,{canon=loadPronunciations(),profiles=loadVoiceProfiles(),glossaryId=MAIN_GLOSSARY_ID}={}) {
  const result = validateVoicePreflight(job,canon);
  if (!result.ok) return {ok:false,errors:result.errors,mentions:result.mentions};
  const profile = profiles.find(x=>x.id===job.speaker);
  const errors = [];
  if (!profile) errors.push('Missing speaker profile');
  if (profile && profile.version !== job.voiceProfileVersion) errors.push('Speaker profile version mismatch');
  if (!job.avatarId && !profile?.avatarId) errors.push('Missing confirmed avatar ID');
  if (!job.voiceId && !profile?.voiceId) errors.push('Missing confirmed voice ID');
  if (job.glossaryVersion !== 'global-v1') errors.push('Unexpected glossary version');
  if (job.glossarySynced !== true) errors.push('Provider glossary sync not verified');
  if (errors.length) return {ok:false,errors,mentions:result.mentions};
  return {ok:true,mentions:result.mentions,provider:'heygen',request:{
    avatarId:job.avatarId||profile.avatarId,voiceId:job.voiceId||profile.voiceId,
    script:job.script,brandGlossaryId:glossaryId,
    title:job.title || 'The Brief — '+job.speaker,
    aspectRatio:'9:16',voiceSettings:{...profile.voiceSettings,locale:profile.locale}
  },provenance:{speaker:profile.id,voiceProfileVersion:profile.version,scriptVersion:job.scriptVersion,glossaryVersion:job.glossaryVersion,scope:job.scope,leagueId:job.scope==='league'?job.leagueId:null}};
}
