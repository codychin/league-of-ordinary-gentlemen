import {readFileSync} from 'node:fs';
import {sql,ACTORS,RENDERER,quote} from './local-db.mjs';
// Fails on reinitialization rather than dropping data.
await sql(`create role anon; create role authenticated; create role service_role;
create schema auth;
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
create function auth.role() returns text language sql stable as $$ select current_setting('request.jwt.claim.role',true) $$;
grant usage on schema auth to authenticated,anon,service_role;`);
await sql(readFileSync('scripts/publishing-pilot/schema.sql','utf8'));
await sql(`insert into brief_pilot.head(renderer) values(${quote(RENDERER)});
insert into brief_pilot.access(actor,editions,approver,publisher,verifier) values
('${ACTORS.owner}',array['loog','sunday-crew','doge'],true,true,false),
('${ACTORS.verifier}',array['loog','sunday-crew','doge'],false,false,true),
('${ACTORS.local}',array['doge'],true,true,false);`);
console.log('Initialized disposable, network-disabled Postgres with synthetic test identities.');
