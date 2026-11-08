export const AUTH_HEADER='x-vercel-trusted-oidc-idp-token';
const need=(ok,code)=>{if(!ok)throw Error(code);};
export function verifiedOrigin(base,expected){
 let a,b;try{a=new URL(base);b=new URL(expected);}catch{throw Error('INVALID_CANDIDATE_ORIGIN');}
 for(const u of [a,b])need(u.protocol==='https:'&&u.hostname.endsWith('.vercel.app')&&!u.username&&!u.password&&!u.port&&u.pathname==='/'&&!u.search&&!u.hash,'INVALID_CANDIDATE_ORIGIN');
 need(a.origin===b.origin,'CANDIDATE_ORIGIN_MISMATCH');return a.origin;
}
export function scopedHeaders(url,origin,headers,token){
 const target=new URL(url);const output={};
 for(const [key,value] of Object.entries(headers||{}))if(key.toLowerCase()!==AUTH_HEADER)output[key]=value;
 if(target.origin===origin){need(typeof token==='string'&&token.length>20&&!/\s/.test(token),'INVALID_OIDC_TOKEN');output[AUTH_HEADER]=token;}
 return output;
}
export function assertNoRedirect(status){need(!(status>=300&&status<400),'CANDIDATE_REDIRECT_REJECTED');}
