import Link from 'next/link';
import {dbConfigured,dbSelect} from '../../lib/server-db';
import {yahooConfigured} from '../../lib/providers/yahoo';

export const dynamic='force-dynamic';

export default async function Onboarding({searchParams}){
  const params=await searchParams;
  const tenant=params?.tenant;
  let leagues=[];
  if(tenant&&dbConfigured()){
    leagues=await dbSelect('brief_leagues',`select=id,name,season,provider,provider_league_key,status&tenant_id=eq.${encodeURIComponent(tenant)}&order=name.asc`);
  }
  const yahooReady=yahooConfigured();
  const error=params?.error;

  return <main style={{maxWidth:920,margin:'0 auto',padding:'48px 22px 80px',fontFamily:'Arial,sans-serif',color:'#11100e'}}>
    <Link href="/" style={{fontSize:12,fontWeight:900,letterSpacing:1.4,color:'#11100e',textDecoration:'none'}}>THE BRIEF OF ORDINARY GENTLEMAN</Link>
    <div style={{marginTop:58,borderTop:'4px solid #11100e',paddingTop:22}}>
      <div style={{fontSize:11,fontWeight:900,letterSpacing:2,color:'#b21f24'}}>CREATE YOUR BRIEF</div>
      <h1 style={{fontFamily:'Georgia,serif',fontSize:'clamp(42px,7vw,78px)',lineHeight:.92,letterSpacing:-3,margin:'14px 0 20px'}}>Your league gets a bureau.</h1>
      <p style={{fontFamily:'Georgia,serif',fontSize:22,lineHeight:1.35,maxWidth:720,margin:0}}>The newsroom is shared. The world it covers is personal. Connect Yahoo and we’ll import the league before we ask for the history, rivalries and bad decisions that make it yours.</p>
    </div>

    {error&&<div style={{marginTop:28,padding:16,border:'1px solid #b21f24',background:'#fff7f7'}}><b>Yahoo connection did not complete.</b><div style={{marginTop:6,fontSize:13}}>{error}</div></div>}

    <section style={{marginTop:46,display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(250px,1fr))',gap:16}}>
      {[['01','Connect Yahoo','Authorize read access to the fantasy leagues attached to your Yahoo account.'],['02','Choose the league','We import teams, managers, rosters and the league identity into its own private bureau.'],['03','Teach us the room','Add rivalries, running jokes, personalities and history. The Brief newsroom stays canonical.']].map(([n,t,d])=><article key={n} style={{border:'1px solid #d8d2c6',padding:20,minHeight:170}}><small style={{fontWeight:900,color:'#b21f24'}}>{n}</small><h2 style={{fontFamily:'Georgia,serif',fontSize:25,margin:'18px 0 9px'}}>{t}</h2><p style={{fontSize:14,lineHeight:1.5,margin:0,color:'#57534c'}}>{d}</p></article>)}
    </section>

    {!tenant&&<div style={{marginTop:38}}>
      <a href="/api/oauth/yahoo/start" style={{display:'inline-block',background:yahooReady?'#11100e':'#777',color:'#fff',padding:'15px 22px',fontSize:12,fontWeight:900,letterSpacing:1.4,textDecoration:'none',pointerEvents:yahooReady?'auto':'none'}}>CONNECT YAHOO →</a>
      {!yahooReady&&<p style={{fontSize:12,color:'#746f66',maxWidth:620,lineHeight:1.5}}>The onboarding UI is installed. To activate Yahoo, add YAHOO_CLIENT_ID, YAHOO_CLIENT_SECRET and YAHOO_REDIRECT_URI to the server environment.</p>}
    </div>}

    {tenant&&<section style={{marginTop:44,borderTop:'1px solid #d8d2c6',paddingTop:24}}>
      <div style={{fontSize:11,fontWeight:900,letterSpacing:2,color:'#b21f24'}}>YAHOO CONNECTED</div>
      <h2 style={{fontFamily:'Georgia,serif',fontSize:36,margin:'10px 0 18px'}}>Choose the league to build.</h2>
      {leagues.length===0?<p>No Yahoo football leagues were returned for this account.</p>:<div style={{display:'grid',gap:12}}>{leagues.map(l=><div key={l.id} style={{border:'1px solid #d8d2c6',padding:18,display:'flex',alignItems:'center',justifyContent:'space-between',gap:20}}><div><b style={{fontFamily:'Georgia,serif',fontSize:22}}>{l.name}</b><div style={{fontSize:12,color:'#746f66',marginTop:5}}>Yahoo • {l.season}</div></div><span style={{fontSize:10,fontWeight:900,letterSpacing:1.2}}>READY FOR IMPORT</span></div>)}</div>}
    </section>}
  </main>
}
