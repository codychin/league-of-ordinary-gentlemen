const API='https://fantasysports.yahooapis.com/fantasy/v2';

export function yahooConfigured(){
  return Boolean(process.env.YAHOO_CLIENT_ID&&process.env.YAHOO_CLIENT_SECRET&&process.env.YAHOO_REDIRECT_URI);
}

export function yahooAuthorizationUrl({state,nonce}){
  const p=new URLSearchParams({
    client_id:process.env.YAHOO_CLIENT_ID,
    redirect_uri:process.env.YAHOO_REDIRECT_URI,
    response_type:'code',
    state,
    nonce,
    language:'en-us',
  });
  return `https://api.login.yahoo.com/oauth2/request_auth?${p}`;
}

export async function exchangeYahooCode(code){
  const credentials=Buffer.from(`${process.env.YAHOO_CLIENT_ID}:${process.env.YAHOO_CLIENT_SECRET}`).toString('base64');
  const body=new URLSearchParams({
    redirect_uri:process.env.YAHOO_REDIRECT_URI,
    code,
    grant_type:'authorization_code',
  });
  const res=await fetch('https://api.login.yahoo.com/oauth2/get_token',{
    method:'POST',
    headers:{
      Authorization:`Basic ${credentials}`,
      'Content-Type':'application/x-www-form-urlencoded',
    },
    body,
    cache:'no-store',
  });
  if(!res.ok) throw new Error(`Yahoo token exchange failed: ${res.status} ${await res.text()}`);
  return res.json();
}

export async function fetchYahooFootballLeagues(accessToken){
  const url=`${API}/users;use_login=1/games;game_codes=nfl/leagues?format=json`;
  const res=await fetch(url,{
    headers:{Authorization:`Bearer ${accessToken}`},
    cache:'no-store',
  });
  if(!res.ok) throw new Error(`Yahoo fantasy league discovery failed: ${res.status} ${await res.text()}`);
  return res.json();
}

export function extractYahooLeagues(payload){
  const found=new Map();
  const visit=value=>{
    if(!value||typeof value!=='object') return;
    if(!Array.isArray(value)&&value.league_key&&value.name){
      found.set(value.league_key,{
        provider_league_key:String(value.league_key),
        name:String(value.name),
        season:Number(value.season)||new Date().getFullYear(),
        raw:value,
      });
    }
    for(const v of Object.values(value)) visit(v);
  };
  visit(payload);
  return [...found.values()];
}
