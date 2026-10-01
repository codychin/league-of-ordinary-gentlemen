import {NextResponse} from 'next/server';
import crypto from 'node:crypto';
import {cookies} from 'next/headers';
import {exchangeYahooCode,extractYahooLeagues,fetchYahooFootballLeagues,yahooConfigured} from '../../../../../lib/providers/yahoo';
import {dbConfigured,dbInsert} from '../../../../../lib/server-db';
import {encryptSecret} from '../../../../../lib/secret-crypto';

export const runtime='nodejs';

export async function GET(request){
  const url=new URL(request.url);
  const code=url.searchParams.get('code');
  const state=url.searchParams.get('state');
  const error=url.searchParams.get('error');
  if(error) return NextResponse.redirect(new URL(`/onboarding?error=${encodeURIComponent(error)}`,url.origin));
  if(!code||!state) return NextResponse.redirect(new URL('/onboarding?error=missing_oauth_response',url.origin));

  const jar=await cookies();
  const expected=jar.get('brief_yahoo_oauth_state')?.value;
  if(!expected||expected!==state) return NextResponse.redirect(new URL('/onboarding?error=invalid_oauth_state',url.origin));
  if(!yahooConfigured()||!dbConfigured()) return NextResponse.redirect(new URL('/onboarding?error=server_not_configured',url.origin));

  try{
    const token=await exchangeYahooCode(code);
    const tenant=await dbInsert('brief_tenants',{
      slug:`yahoo-${crypto.randomUUID().slice(0,8)}`,
      name:'New Yahoo League',
      publication_name:'The Brief',
      settings:{onboarding:true,provider:'yahoo'},
    });

    const fantasy=await fetchYahooFootballLeagues(token.access_token);
    const leagues=extractYahooLeagues(fantasy);

    await dbInsert('brief_provider_connections',{
      tenant_id:tenant.id,
      provider:'yahoo',
      provider_user_id:token.xoauth_yahoo_guid||null,
      access_token_enc:encryptSecret(token.access_token),
      refresh_token_enc:encryptSecret(token.refresh_token),
      token_expires_at:new Date(Date.now()+(Number(token.expires_in)||3600)*1000).toISOString(),
      scopes:[],
      metadata:{league_count:leagues.length},
      status:'active',
    });

    for(const league of leagues){
      await dbInsert('brief_leagues',{
        tenant_id:tenant.id,
        provider:'yahoo',
        provider_league_key:league.provider_league_key,
        name:league.name,
        season:league.season,
        sport:'nfl',
        status:'onboarding',
        settings:{provider_snapshot:league.raw},
      });
    }

    const response=NextResponse.redirect(new URL(`/onboarding?connected=1&tenant=${tenant.id}`,url.origin));
    response.cookies.delete('brief_yahoo_oauth_state');
    response.cookies.delete('brief_yahoo_oauth_nonce');
    return response;
  }catch(e){
    console.error('Yahoo onboarding callback failed',e);
    return NextResponse.redirect(new URL(`/onboarding?error=${encodeURIComponent(e.message||'oauth_failed')}`,url.origin));
  }
}
