// Test transport only: synthetic Auth response + real Postgres RPC. NOT Supabase Auth proof.
// Listens only on loopback. Never deploy this file or route it publicly.
import http from 'node:http';
import {call,ACTORS} from './local-db.mjs';
export function tokenFor(actor=ACTORS.owner){const b=o=>Buffer.from(JSON.stringify(o)).toString('base64url');return b({alg:'HS256',typ:'JWT'})+'.'+b({sub:actor,role:'authenticated',exp:4102444800})+'.local-test-only';}
export function sessionCookie(actor=ACTORS.owner){return {name:'sb-127-auth-token',value:'base64-'+Buffer.from(JSON.stringify({access_token:tokenFor(actor),refresh_token:'local-test-only',expires_at:4102444800,expires_in:3600,token_type:'bearer',user:{id:actor,email:'fixture@example.invalid'}})).toString('base64url'),domain:'127.0.0.1',path:'/'};}
export function startGateway(){
 return http.createServer(async(req,res)=>{
  res.setHeader('Content-Type','application/json');res.setHeader('Cache-Control','no-store');
  const actor=Object.values(ACTORS).find(id=>req.headers.authorization==='Bearer '+tokenFor(id));
  if(!actor){res.writeHead(401);res.end(JSON.stringify({message:'Synthetic local session required'}));return;}
  if(req.url==='/auth/v1/user'){res.end(JSON.stringify({id:actor,email:'fixture@example.invalid',email_confirmed_at:'2026-01-01T00:00:00Z',aud:'authenticated',role:'authenticated'}));return;}
  if(req.url!=='/rest/v1/rpc/brief_pilot_command'||req.method!=='POST'){res.writeHead(404);res.end('{}');return;}
  try{let body='';for await(const part of req){body+=part;if(body.length>500000)throw Error('Too large');}const {op,args}=JSON.parse(body);res.end(JSON.stringify(await call(op,args,actor)));}
  catch(error){res.writeHead(400);res.end(JSON.stringify({message:error.message,code:'P0001'}));}
 }).listen(4319,'127.0.0.1');
}
if(process.argv[1]?.endsWith('local-gateway.mjs')){startGateway();console.log('LOCAL TEST gateway: synthetic Auth, real isolated Postgres; 127.0.0.1:4319');}
