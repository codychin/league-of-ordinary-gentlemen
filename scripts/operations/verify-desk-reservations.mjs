// Run with a separately installed @electric-sql/pglite@0.3.14; no production dependency.
const {PGlite}=await import(process.env.PGLITE_MODULE || '@electric-sql/pglite');
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const db=new PGlite();
await db.exec(`create table brief_desk_control(id boolean primary key,enabled boolean); insert into brief_desk_control values(true,true); create table brief_desk_budget(period_start date primary key,reserved_cents int default 0); create table brief_desk_events(event_key text primary key); create table brief_desk_usage(id uuid primary key,period_start date,purpose text,model text,reserved_cents int default 10);`);
const sql=readFileSync(new URL('../../docs/sql/brief-desk-daypart-reservations.sql',import.meta.url),'utf8');
// Compile the exact production source first. Only replace its clock in isolated fixtures.
await db.exec(sql);
await db.exec(sql.replaceAll('clock_timestamp()',"current_setting('test.now')::timestamptz"));
const set=async time=>db.query("select set_config('test.now',$1,false)",[time]);
const reset=async()=>db.exec('truncate brief_desk_budget,brief_desk_usage,brief_desk_events; update brief_desk_control set enabled=true');
const pair=async(event=crypto.randomUUID(),id=crypto.randomUUID(),review=crypto.randomUUID())=>(await db.query('select reserve_brief_call($1,$2) ok',[id,JSON.stringify({mode:'draft_review_pair',review_id:review,event_key:event})])).rows[0].ok;
let checks=0;
for(const [time,cap] of [['2026-10-25T14:29:59Z',0],['2026-10-25T14:30Z',70],['2026-10-25T19:59:59Z',70],['2026-10-25T20:00Z',86],['2026-10-26T00:00Z',100],['2026-10-26T03:59:59Z',100],['2026-10-26T04:00Z',0],['2026-10-24T18:00Z',0],['2026-11-01T15:29:59Z',0],['2026-11-01T15:30Z',70],['2026-11-01T21:00Z',86],['2026-11-02T01:00Z',100],['2026-11-02T05:00Z',0],['2027-03-14T14:30Z',70]]){
 await reset();await set(time);
 for(let i=0;i<cap/2;i++)assert.equal(await pair(),true,time);
 assert.equal(await pair(),false,time);checks++;
}
await reset();await set('2026-10-25T17:00Z');
assert.equal(await pair('duplicate'),true);assert.equal(await pair('duplicate'),false);
assert.equal((await db.query('select reserved_cents from brief_desk_budget')).rows[0].reserved_cents,20);
const used=(await db.query('select id from brief_desk_usage limit 1')).rows[0].id;
await assert.rejects(pair('rollback',crypto.randomUUID(),used));
assert.equal((await db.query('select count(*)::int n from brief_desk_events')).rows[0].n,1);
await db.exec('update brief_desk_budget set reserved_cents=690');assert.equal(await pair(),false);
await db.exec('update brief_desk_budget set reserved_cents=0');
for(let i=0;i<34;i++)assert.equal(await pair(),true);
await db.exec('update brief_desk_budget set reserved_cents=0');assert.equal(await pair(),false);
await reset();await set('2026-10-25T17:00Z');
// PGlite queues competing requests: exercise serialized outcomes, not multi-session lock contention.
const contenders=await Promise.all(Array.from({length:60},()=>pair()));assert.equal(contenders.filter(Boolean).length,35);
assert.equal((await db.query('select count(*)::int n from brief_desk_usage')).rows[0].n,70);
await reset();await db.exec('update brief_desk_control set enabled=false');assert.equal(await pair(),false);
console.log('PASS exact SQL compilation; '+checks+' schedule/daypart exhaustion cases; duplicate, rollback, independent cents/calls, disabled, 60 queued contenders => 70 slots. No production test writes.');
await db.close();
