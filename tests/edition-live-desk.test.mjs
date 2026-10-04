import test from 'node:test'
import assert from 'node:assert/strict'
import {editionDatabase,editionContext,deskOpen} from '../supabase/functions/brief-editorial-worker/edition.ts'
test('edition workflow reads and mutations cannot escape the edition',()=>{
 const calls=[]
 const query=new Proxy({}, {get:(_,op)=>(...args)=>{calls.push([op,...args]);return query}})
 const raw={from(name){calls.push(['from',name]);return query}}
 const db=editionDatabase(raw,'sunday-crew')
 db.from('brief_live_desk_posts').select('*')
 assert.deepEqual(calls.splice(0),[['from','brief_edition_live_posts'],['select','*'],['eq','edition_slug','sunday-crew']])
 db.from('brief_editorial_runs').update({edition_slug:'loog',status:'written'})
 assert.deepEqual(calls.splice(0),[['from','brief_edition_editorial_runs'],['update',{status:'written'}],['eq','edition_slug','sunday-crew']])
 db.from('brief_live_desk_posts').insert({edition_slug:'loog',text:'post'})
 assert.deepEqual(calls.splice(0),[['from','brief_edition_live_posts'],['insert',{edition_slug:'sunday-crew',text:'post'}]])
 db.from('brief_editorial_memory').upsert({writer:'gannon'},{onConflict:'writer,premise_key'})
 assert.deepEqual(calls.splice(0),[['from','brief_edition_editorial_memory'],['upsert',{writer:'gannon',edition_slug:'sunday-crew'},{onConflict:'edition_slug,writer,premise_key'}]])
 assert.throws(()=>db.from('brief_live_score_state'),/Unsupported/)
})
test('stale scores and rosters never become current evidence',()=>{
 const now=Date.parse('2026-10-04T17:00:00Z')
 const snapshot={created_at:'2026-10-01T17:00:00Z',data:{secret:'stale'}}
 const context=editionContext({snapshots:{matchups:snapshot,rosters:snapshot,standings:snapshot}},now)
 assert.equal(context.matchups,undefined);assert.equal(context.rosters,undefined)
 assert.equal(context.historical.standings.as_of,snapshot.created_at)
 const fresh=editionContext({snapshots:{matchups:{...snapshot,created_at:'2026-10-04T16:59:00Z'}}},now)
 assert.deepEqual(fresh.matchups.data,snapshot.data)
})
test('desk respects Sunday 12:45 Eastern opening time',()=>{
 assert.equal(deskOpen(new Date('2026-10-04T16:44:00Z')),false)
 assert.equal(deskOpen(new Date('2026-10-04T16:45:00Z')),true)
 assert.equal(deskOpen(new Date('2026-10-05T16:45:00Z')),false)
})
