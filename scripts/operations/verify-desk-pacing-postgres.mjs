// Isolated native PostgreSQL only. Dependencies installed separately; no project/remote DB URL accepted.
// See docs/live-desk-budget.md for reproducible commands.
import assert from 'node:assert/strict';
import {readFileSync, mkdtempSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
const {default: EmbeddedPostgres}=await import(process.env.EMBEDDED_PG_MODULE || 'embedded-postgres');
const {default: pg}=await import(process.env.PG_MODULE || 'pg');
const dir=mkdtempSync(join(tmpdir(),'desk-pacing-'));
const port=Number(process.env.DESK_TEST_PORT || 55439);
const server=new EmbeddedPostgres({databaseDir:join(dir,'db'),user:'postgres',password:'local-fixture',port,persistent:true,postgresFlags:['-h','127.0.0.1'],onLog(){},onError(){}});
const connect=async()=>{const c=new pg.Client({host:'127.0.0.1',port,user:'postgres',password:'local-fixture',database:'postgres'});await c.connect();return c;};
let db;
const sql=readFileSync(new URL('../../docs/sql/brief-desk-daypart-reservations.sql',import.meta.url),'utf8');
const pair=async(c,event=crypto.randomUUID(),review=crypto.randomUUID())=>(await c.query('select reserve_brief_call($1,$2) ok',[crypto.randomUUID(),JSON.stringify({mode:'draft_review_pair',review_id:review,event_key:event})])).rows[0].ok;
const set=async time=>db.query('update fixture_clock set at=$1',[time]);
const reset=async()=>db.query('truncate brief_desk_usage,brief_desk_events,brief_desk_budget; update brief_desk_control set enabled=true');
const usage=async()=> (await db.query('select count(*)::int calls from brief_desk_usage')).rows[0].calls;
const fill=async n=>{for(let i=0;i<n/2;i++)assert.equal(await pair(db),true);};
let checks=0;
try {
 await server.initialise();await server.start();db=await connect();
 await db.query(`create table brief_desk_control(id boolean primary key,enabled boolean); insert into brief_desk_control values(true,true);
 create table brief_desk_budget(period_start date primary key,reserved_cents int default 0 check(reserved_cents between 0 and 1000));
 create table brief_desk_events(event_key text primary key,status text default 'claimed');
 create table brief_desk_usage(id uuid primary key,period_start date references brief_desk_budget,purpose text,model text,reserved_cents int default 10 check(reserved_cents=10),status text default 'reserved');
 create table fixture_clock(at timestamptz); insert into fixture_clock values('2026-10-26T00:00Z');
 create function fixture_now() returns timestamptz language sql volatile as 'select at from fixture_clock';`);
 await db.query(sql); // Compile the exact candidate before substituting only the test clock.
 await db.query(sql.replaceAll('clock_timestamp()','fixture_now()'));
 // Adversarial stream: same cap regardless of published, declined, rejected or unknown requests.
 await fill(86);
 for(let minute=0;minute<30;minute+=3)assert.equal(await pair(db,'early-'+minute),false);
 assert.equal(await usage(),86);
 for(let step=0;step<7;step++) {
  await set(new Date(Date.parse('2026-10-26T00:30Z')+step*1800000).toISOString());
  const event='evening-'+step;
  assert.equal(await pair(db,event),true);
  await db.query("update brief_desk_events set status=$1 where event_key=$2",[['declined','rejected','claimed'][step%3],event]);
  await db.query("update brief_desk_usage set status='failed' where purpose='draft'");
  assert.equal(await pair(db,event),false); // no regeneration/refund for rejected event
  assert.equal(await pair(db),false); // the next pair stays protected
  assert.equal(await usage(),88+step*2);
 }
 assert.equal(await usage(),100);checks++;
 // A quiet evening carries allowance forward, but it never reserves merely because time passed.
 await reset();await set('2026-10-26T00:30Z');await fill(86);
 await set('2026-10-26T02:30Z');assert.equal(await usage(),86);await fill(10);
 assert.equal(await pair(db),false);checks++;
 // Real competing sessions: one available pair, including simultaneous duplicate event claims.
 const race=async sameEvent=>{
  await reset();await set('2026-10-26T00:30Z');await fill(86);
  const clients=await Promise.all(Array.from({length:12},connect));
  try {
   const outcomes=await Promise.all(clients.map(c=>pair(c,sameEvent?'same-event':crypto.randomUUID())));
   assert.equal(outcomes.filter(Boolean).length,1);assert.equal(await usage(),88);
   assert.equal((await db.query('select reserved_cents from brief_desk_budget')).rows[0].reserved_cents,880);
  } finally {await Promise.all(clients.map(c=>c.end()));}
 };
 await race(false);await race(true);checks+=2;
 // Persist reservations across actual server stop/start; no worker-local token bucket to reset.
 await db.end();db=null;await server.stop();await server.start();db=await connect();
 assert.equal(await usage(),88);assert.equal(await pair(db),false);
 await set('2026-10-26T01:00Z');assert.equal(await pair(db,'after-restart'),true);assert.equal(await pair(db),false);checks++;
 // A reservation waiting on a row lock must re-check the clock AFTER it acquires the lock.
 await reset();await set('2026-10-26T03:59:59Z');await fill(98);
 const holder=await connect(),waiter=await connect();
 try {
  await holder.query('begin');await holder.query('select * from brief_desk_budget for update');
  const pending=pair(waiter,'past-midnight');
  // Synchronize on a real lock wait, not a guessed sleep interval.
  let blocked=false;
  for(let i=0;i<100;i++) {
   const r=await db.query("select wait_event_type from pg_stat_activity where pid=$1",[waiter.processID]);
   if(r.rows[0]?.wait_event_type==='Lock'){blocked=true;break;}
   await new Promise(resolve=>setTimeout(resolve,10));
  }
  assert.equal(blocked,true,'reservation must actually wait for the lock');
  await set('2026-10-26T04:00:00Z');await holder.query('commit');
  assert.equal(await pending,false);assert.equal(await usage(),98);checks++;
 } finally {await holder.query('rollback');await Promise.all([holder.end(),waiter.end()]);}
 // Existing reservations above a newly lowered ceiling must never be reset or refunded.
 await set('2026-10-26T00:30Z');assert.equal(await pair(db),false);assert.equal(await usage(),98);
 await set('2026-10-26T03:30Z');assert.equal(await pair(db),true);assert.equal(await pair(db),false);checks++;
 // Friday period rollover: a new Sunday has its own cap, without altering last week's rows.
 await set('2026-11-01T15:30Z');assert.equal(await pair(db),true);
 assert.deepEqual((await db.query('select period_start::text, reserved_cents from brief_desk_budget order by period_start')).rows,[{period_start:'2026-10-23',reserved_cents:1000},{period_start:'2026-10-30',reserved_cents:20}]);checks++;
 console.log(`PASS ${checks} native PostgreSQL pacing scenarios: burst, rejected/unknown work, carry-forward, two 12-session races, server restart, midnight lock wait, existing over-ceiling state, weekly rollover. Zero provider calls or remote writes.`);
} finally {
 if(db)await db.end();await server.stop();rmSync(dir,{recursive:true,force:true});
}
