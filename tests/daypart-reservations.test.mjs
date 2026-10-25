import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
const sql=readFileSync(new URL('../docs/sql/brief-desk-daypart-reservations.sql',import.meta.url),'utf8')
// Executable reservation-state model, not a substitute for PostgreSQL integration tests.
const ceiling=t=>t<Date.parse('2026-10-18T13:30Z')||t>=Date.parse('2026-10-19T04:00Z')?0:t<Date.parse('2026-10-18T20:00Z')?70:t<Date.parse('2026-10-19T00:00Z')?86:100
function reserve(s,{time='2026-10-18T17:00Z',event='new',draft='draft',review='review',fail=false}={}){
 const limit=ceiling(Date.parse(time));
 if(!s.enabled||!limit||s.cents+20>limit*10||s.calls+2>limit||s.events.has(event))return false
 const next={...s,events:new Set(s.events),ids:new Set(s.ids)}
 next.events.add(event);next.cents+=20;next.calls+=2
 if(fail||next.ids.has(draft)||next.ids.has(review)||draft===review)throw new Error('constraint')
 next.ids.add(draft);next.ids.add(review);Object.assign(s,next);return true
}
const state=(calls=0,cents=calls*10)=>({enabled:true,calls,cents,events:new Set(),ids:new Set()})
test('SQL preserves exact RPC signature and contains no permission/schema changes',()=>{
 assert.match(sql,/FUNCTION public\.reserve_brief_call\(p_id uuid, p_purpose text\)/)
 assert.doesNotMatch(sql,/\b(?:GRANT|REVOKE|SECURITY DEFINER|ALTER TABLE|CREATE POLICY)\b/i)
 assert.match(sql,/SET search_path TO 'public'/)
})
test('SQL locks before count/check/event claim; inserts both reserved usage rows',()=>{
 assert.ok(sql.indexOf('FOR UPDATE')<sql.indexOf('SELECT count(*)'))
 assert.ok(sql.indexOf('existing_calls + slots > ceiling_calls')<sql.indexOf('INSERT INTO brief_desk_events'))
 assert.match(sql,/ON CONFLICT \(event_key\) DO NOTHING;\s+IF NOT FOUND THEN RETURN false/)
 assert.match(sql,/'draft', 'gpt-5\.4-mini'\),\s+\(review_id, period, 'review', 'gpt-5\.4-mini'/)
 assert.match(sql,/checked_at := clock_timestamp\(\)/)
 assert.doesNotMatch(sql,/EXCEPTION\s+WHEN/i)
})
test('all exact one-day and daypart boundaries',()=>{
 for(const [t,n] of [['2026-10-18T13:29:59.999Z',0],['2026-10-18T13:30Z',70],['2026-10-18T19:59:59.999Z',70],['2026-10-18T20:00Z',86],['2026-10-18T23:59:59.999Z',86],['2026-10-19T00:00Z',100],['2026-10-19T03:59:59.999Z',100],['2026-10-19T04:00Z',0],['2026-10-25T17:00Z',0]])assert.equal(ceiling(Date.parse(t)),n,t)
})
test('pair fits at 68; 69 cannot strand a draft; deferred event remains eligible later',()=>{
 const fit=state(68);assert.equal(reserve(fit),true);assert.equal(fit.calls,70)
 const s=state(69);assert.equal(reserve(s),false);assert.equal(s.events.size,0);assert.equal(s.cents,690)
 assert.equal(reserve(s,{time:'2026-10-18T20:00Z'}),true);assert.equal(s.calls,71)
})
test('calls and cents independently block despite mismatch',()=>{
 assert.equal(reserve(state(69,0)),false);assert.equal(reserve(state(0,690)),false)
})
test('serialized contenders cannot exceed ceiling or double-claim event',()=>{
 const s=state(68);assert.equal(reserve(s),true);assert.equal(reserve(s,{event:'other',draft:'d2',review:'r2'}),false);assert.equal(s.calls,70)
 const d=state();assert.equal(reserve(d),true);assert.equal(reserve(d,{draft:'d2',review:'r2'}),false);assert.equal(d.calls,2)
})
test('constraint failure rolls back event, charge and both usage IDs',()=>{
 const s=state(54);assert.throws(()=>reserve(s,{fail:true}));assert.equal(s.events.size,0);assert.equal(s.cents,540);assert.equal(s.ids.size,0);assert.equal(s.calls,54)
})
test('evening pair boundaries and disabled/closed windows',()=>{
 const s=state(84);assert.equal(reserve(s,{time:'2026-10-18T20:00Z'}),true);assert.equal(s.calls,86)
 assert.equal(reserve(s,{time:'2026-10-18T23:59Z',event:'b'}),false)
 assert.equal(reserve(state(98),{time:'2026-10-19T03:59Z'}),true)
 assert.equal(reserve(state(99),{time:'2026-10-19T03:59Z'}),false)
 assert.equal(reserve({...state(),enabled:false}),false)
 assert.equal(reserve(state(),{time:'2026-10-19T04:00Z'}),false)
})
