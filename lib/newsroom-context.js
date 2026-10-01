// Canonical newsroom identity is global; relationships and recurring referents are league-local.
// Pass league memories with subject_type='correspondent' and subject_key matching the canonical writer slug.

export function correspondentLeagueMemories(memories=[],writerSlug){
  return memories
    .filter(memory=>memory?.status!=='archived')
    .filter(memory=>memory?.subject_type==='correspondent')
    .filter(memory=>memory?.subject_key===writerSlug)
    .sort((a,b)=>String(a.memory_key||'').localeCompare(String(b.memory_key||'')));
}

export function composeNewsroomContext({writer,league,memories=[]}){
  const local=correspondentLeagueMemories(memories,writer.slug);
  return {
    canonical:{
      slug:writer.slug,
      name:writer.name,
      desk:writer.desk||writer.title,
      voice_profile:writer.voice_profile||writer.voice,
      writing_profile:writer.writing_profile||writer.method,
      recurring_methods:writer.recurring_methods||[],
      avoid:writer.avoid||[],
    },
    league:{
      id:league?.id||null,
      name:league?.name||null,
      provider:league?.provider||null,
      season:league?.season||null,
    },
    relationships:local.map(memory=>({
      key:memory.memory_key,
      content:memory.content,
      metadata:memory.metadata||{},
    })),
  };
}
