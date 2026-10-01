import {NextResponse} from 'next/server';
import crypto from 'node:crypto';
import {yahooAuthorizationUrl,yahooConfigured} from '../../../../../lib/providers/yahoo';

export const runtime='nodejs';

export async function GET(request){
  if(!yahooConfigured()){
    return NextResponse.json({
      error:'Yahoo OAuth is not configured yet.',
      required:['YAHOO_CLIENT_ID','YAHOO_CLIENT_SECRET','YAHOO_REDIRECT_URI'],
    },{status:503});
  }
  const state=crypto.randomBytes(24).toString('base64url');
  const nonce=crypto.randomBytes(24).toString('base64url');
  const response=NextResponse.redirect(yahooAuthorizationUrl({state,nonce}));
  response.cookies.set('brief_yahoo_oauth_state',state,{httpOnly:true,secure:true,sameSite:'lax',maxAge:600,path:'/'});
  response.cookies.set('brief_yahoo_oauth_nonce',nonce,{httpOnly:true,secure:true,sameSite:'lax',maxAge:600,path:'/'});
  return response;
}
