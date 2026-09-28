const OPENAI_URL='https://api.openai.com/v1/responses'
async function callModel(input:any,instructions:string){
 const key=Deno.env.get('OPENAI_API_KEY');if(!key)throw new Error('OPENAI_API_KEY missing')
 const r=await fetch(OPENAI_URL,{method:'POST',headers:{Authorization:'Bearer '+key,'Content-Type':'application/json'},body:JSON.stringify({model:'gpt-5.6-sol',instructions,input:JSON.stringify(input),text:{format:{type:'json_object'}},max_output_tokens:3500})})
 const raw=await r.json();if(!r.ok)throw new Error('OpenAI '+r.status+': '+String(raw?.error?.message||'request failed'))
 const txt=raw?.output?.flatMap((x:any)=>x.content||[]).find((x:any)=>x.type==='output_text')?.text
 if(!txt)throw new Error('OpenAI returned no output_text');return JSON.parse(txt)
}
export async function editorialMeeting(packet:any){
 return callModel(packet,`You are the Sunday assigning editor of The Brief of Ordinary Gentleman. Think before writing. Generate 6 to 8 genuinely different story pitches from the evidence packet. A fact is not a pitch. Never mention refreshes, polling, snapshots, pipelines or data collection. Do not manufacture significance from elapsed time. Each pitch must have: id, thesis, evidence array, why_it_matters, league_relevance, writer (gannon|pike|crane|kells|march|sorrell), confidence 0-1. Respect newsroom memory and do not repeat a prior thesis. Return JSON object {"pitches":[...]}. It is valid to return fewer pitches if the evidence is weak.`)
}
export async function selectPitch(packet:any,pitches:any[]){
 return callModel({packet,pitches},`You are the ruthless editor of The Brief. Select at most one pitch worth publishing now. Kill facts pretending to be insights, repetitive premises, weak evidence, forced league connections and interchangeable desk assignments. Prefer something specific, surprising, consequential or funny. Return JSON {"publish":true|false,"pitch_id":string|null,"reason":string}.`)
}
export async function writePost(packet:any,pitch:any){
 return callModel({packet,pitch},`Write one short Live Desk post for the assigned journalist. Preserve the approved thesis and only use supplied evidence. Do not mention internal systems, refreshes or editorial process. Do not use reusable/canned paragraphs. Gannon must make an analytical claim supported by numbers. Crane needs an actual investigation/contradiction/human observation, not generic injury philosophy. Kells must have a specific comedic/cultural premise. March should observe social behavior/status. Pike should explain incentives/value/allocation. Sorrell should make a specific argument about power/institutions, not generic quarterback discourse. Return JSON {"writer":"...","tag":"...","subject":"...","text":"...","thread":"..."}.`)
}
