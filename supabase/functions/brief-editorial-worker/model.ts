import {modelEvidence} from './compact.ts'
import {contractInstructions} from './contract.ts'
const OPENAI_URL='https://api.openai.com/v1/responses'
async function callModel(input:any,instructions:string,model='gpt-5.6-sol'){
 const packet=input?.packet||input
 instructions+=contractInstructions(packet.editorial_contract)
 const key=Deno.env.get('OPENAI_API_KEY');if(!key)throw new Error('OPENAI_API_KEY missing')
 const r=await fetch(OPENAI_URL,{signal:AbortSignal.timeout(60000),method:'POST',headers:{Authorization:'Bearer '+key,'Content-Type':'application/json'},body:JSON.stringify({model,instructions,input:'Return valid JSON only. INPUT:\n'+JSON.stringify(modelEvidence(input)),max_output_tokens:4000})})
 const raw=await r.json();if(!r.ok)throw new Error('OpenAI '+r.status+': '+String(raw?.error?.message||'request failed'))
 const txt=raw?.output?.flatMap((x:any)=>x.content||[]).find((x:any)=>x.type==='output_text')?.text
 if(!txt)throw new Error('OpenAI returned no output_text');const a=txt.indexOf('{'),b=txt.lastIndexOf('}');if(a<0||b<=a)throw new Error('OpenAI returned incomplete JSON: '+txt.slice(0,180));return JSON.parse(txt.slice(a,b+1))
}
export async function researchConnections(packet:any){
 return callModel(packet,`You are the research desk of The Brief. Do not pitch or write publication prose. Find 4-6 evidence-backed connections across NFL/player events, fantasy league state, prior newsroom theses, history/lore and public reporting. Scores and projections are context, never stories. Prefer multi-hop joins revealing irony, reversal, confirmation, contradiction, market mispricing, scheme/usage change or human absurdity. Same subject can be a new DEVELOPMENT when today's evidence changes its meaning. Each connection: id, claim, evidence (2+ concrete facts), domains (2+), novelty_reason, possible_desks, confidence. Reject arithmetic scoreboard restatements. Return JSON {"connections":[...]}.`,'gpt-5.6-terra')
}
export async function editorialMeeting(packet:any,connections:any[]=[]){
 return callModel({packet,connections},`You are the Sunday assigning editor of The Brief of Ordinary Gentleman. Think before writing. Generate at most three genuinely different story pitches, each for a different correspondent. Follow packet.assignment: seek earned premises for priority_desks and do not commission cooling_desks. Never change just a byline to manufacture variety. Start from the research connections, not the scoreboard. A fact is not a pitch. A score or projection delta is not a story. Never mention refreshes, polling, snapshots, pipelines or data collection. Do not manufacture significance from elapsed time. Each pitch must have: id, thesis, evidence array, why_it_matters, league_relevance, writer (gannon|pike|crane|kells|march|sorrell), confidence 0-1. Respect newsroom memory and do not repeat a prior thesis. Return JSON object {"pitches":[...]}. It is valid to return fewer pitches if the evidence is weak.`,'gpt-5.6-terra')
}
export async function selectPitch(packet:any,pitches:any[]){
 return callModel({packet,pitches},`You are the ruthless editor of The Brief. Select at most one pitch worth publishing now. Kill facts pretending to be insights, repetitive premises, weak evidence, forced league connections and interchangeable desk assignments. Prefer something specific, surprising, consequential or funny. Return JSON {"publish":true|false,"pitch_id":string|null,"reason":string}.`)
}
export async function writePost(packet:any,pitch:any){
 return callModel({packet,pitch},`Write one short Live Desk post for the assigned journalist. Preserve the approved thesis and only use supplied evidence. Do not mention internal systems, refreshes or editorial process. Do not use reusable/canned paragraphs. Gannon must make an analytical claim supported by numbers. Crane needs an actual investigation/contradiction/human observation, not generic injury philosophy. Kells must have a specific comedic/cultural premise. March should observe social behavior/status. Pike should explain incentives/value/allocation. Sorrell should make a specific argument about power/institutions, not generic quarterback discourse. Return JSON {"writer":"...","tag":"...","subject":"...","text":"...","thread":"..."}.`)
}

export async function reviewPost(packet:any,pitch:any,post:any,recent:any[]){
 return callModel({packet,pitch,post,recent},`You are the final editor of The Brief. Independently critique this draft against every editorial contract rule, its assigned desk, supplied evidence and recent coverage. Identify unsupported claims, borrowed league context, stale or repeated premises, generic jokes, interchangeable voice and weak rhythm. Do not approve merely because the draft is grammatical. Use revise for fixable weaknesses and reject for unsupported or exhausted premises. Return JSON {"verdict":"approve|revise|reject","reason":"specific assessment","issues":["actionable correction"]}. Approve requires zero unresolved issues.`)
}
export async function revisePost(packet:any,pitch:any,post:any,review:any){
 return callModel({packet,pitch,post,review},`Revise this Live Desk draft to address every issue raised by the editor. Keep the assigned writer and approved thesis. Use only supplied evidence. Do not add facts to rescue weak prose. Return JSON {"writer":"...","tag":"...","subject":"...","text":"...","thread":"..."}.`)
}
