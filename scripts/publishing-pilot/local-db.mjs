// Disposable local Postgres only: network-disabled Docker container, no remote credentials.
import {readFileSync} from 'node:fs';
import {spawn} from 'node:child_process';
export const CONTAINER='brief-pilot-postgres';
export const ACTORS={owner:'00000000-0000-4000-8000-000000000001',verifier:'00000000-0000-4000-8000-000000000002',local:'00000000-0000-4000-8000-000000000003',stranger:'00000000-0000-4000-8000-000000000004'};
export const RENDERER=readFileSync('.next/BUILD_ID','utf8').trim();
export const quote=s=>"'"+String(s).replaceAll("'","''")+"'";
export function sql(query){return new Promise((resolve,reject)=>{
 const p=spawn('docker',['exec','-i',CONTAINER,'psql','-U','postgres','-d','postgres','-X','-qAt','-v','ON_ERROR_STOP=1'],{stdio:['pipe','pipe','pipe']});let out='',err='';
 p.stdout.on('data',b=>out+=b);p.stderr.on('data',b=>err+=b);p.on('error',reject);p.on('close',code=>code?reject(Error(err.trim())):resolve(out.trim()));p.stdin.end(query);
});}
export async function call(op,args={},actor=ACTORS.owner,role='authenticated'){
 if(!['authenticated','anon','service_role'].includes(role))throw Error('Invalid test role');
 const query=`begin; set local role ${role}; select set_config('request.jwt.claim.sub',${quote(actor)},true); select set_config('request.jwt.claim.role',${quote(role)},true); select public.brief_pilot_command(${quote(op)},${quote(JSON.stringify({scope:'staging',renderer:RENDERER,...args}))}::jsonb); commit;`;
 const lines=(await sql(query)).split('\n');return JSON.parse(lines.at(-1));
}
