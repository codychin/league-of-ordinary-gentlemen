import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.cwd(), 'data');
export function loadPronunciations(file = path.join(root, 'voice-pronunciation-canon.json')) {
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (data.schemaVersion !== 1 || !Array.isArray(data.entries)) throw new Error('Unsupported pronunciation canon');
  const seen = new Map();
  for (const entry of data.entries) {
    if (!entry.term || !entry.spoken || entry.status !== 'editor-confirmed') throw new Error('Invalid canon entry: ' + entry.term);
    for (const phrase of [entry.term, ...(entry.alias || [])]) {
      const key = phrase.toLocaleLowerCase('en-US');
      if (seen.has(key) && seen.get(key) !== entry.term) throw new Error('Conflicting canonical term: ' + phrase);
      seen.set(key, entry.term);
    }
  }
  return data;
}
export function findCanonMentions(script, canon) {
  const matches = [];
  const entries = canon.entries.flatMap(entry => [entry.term, ...(entry.alias || [])].map(phrase => ({entry, phrase}))).sort((a,b) => b.phrase.length-a.phrase.length);
  const occupied = [];
  for (const {entry,phrase} of entries) {
    const re = new RegExp('(^|[^\\p{L}\\p{N}])(' + phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')(?=$|[^\\p{L}\\p{N}])', 'giu');
    for (const match of script.matchAll(re)) {
      const start = match.index + match[1].length, end = start + match[2].length;
      if (occupied.some(([a,b]) => start < b && end > a)) continue;
      matches.push({term:entry.term, phrase:match[2], spoken:entry.spoken, start, end, audioApproved:!!entry.audioReference});
      occupied.push([start,end]);
    }
  }
  return matches.sort((a,b) => a.start-b.start);
}
export function validateVoicePreflight(job, canon = loadPronunciations()) {
  const errors = [];
  if (!job || typeof job !== 'object') return {ok:false, errors:['Job is required'], mentions:[]};
  if (!['maude','hollis','conrad','marnie','sabine','dashiell'].includes(job.speaker)) errors.push('Unknown correspondent');
  if (typeof job.script !== 'string' || !job.script.trim()) errors.push('Missing script');
  if (!['global','league'].includes(job.scope)) errors.push('Invalid editorial scope');
  if (job.scope === 'league' && !job.leagueId) errors.push('League ID required');
  if (!job.scriptVersion || !job.voiceProfileVersion || !job.glossaryVersion) errors.push('Missing versioned provenance');
  if (job.scriptApproved !== true) errors.push('Script approval required');
  if (!Number.isFinite(job.budgetCredits) || job.budgetCredits <= 0) errors.push('Positive credit budget required');
  if (job.fullRenderAttempts > 1 && job.additionalRenderApproved !== true) errors.push('Further full render requires approval');
  const mentions = findCanonMentions(typeof job.script === 'string' ? job.script : '', canon);
  const names = Array.isArray(job.properNames) ? job.properNames : [];
  for (const name of names) {
    if (typeof name !== 'string' || !name.trim()) {errors.push('Invalid proper name');continue;}
    const covered = mentions.some(m => m.phrase.toLowerCase() === name.toLowerCase() || m.term.toLowerCase() === name.toLowerCase());
    if (!covered) errors.push('Unverified name: ' + name);
  }
  if (job.audioApproved !== true) errors.push('Audio preview approval required');
  return {ok:errors.length===0, errors, mentions};
}
