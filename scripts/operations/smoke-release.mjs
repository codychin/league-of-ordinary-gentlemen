#!/usr/bin/env node
// Release smoke checks: fails closed when the public pages are missing or wrong.
// Usage: BASE_URL=https://preview.example.com node scripts/operations/smoke-release.mjs
const base = process.env.BASE_URL;
if (!base) throw new Error('BASE_URL required — refusing to mark release verified');
const origin = new URL(base);
if (origin.protocol !== 'https:') throw new Error('Smoke test requires an HTTPS origin');
const paths = ['/', '/sunday-crew', '/doge', '/articles/hollis-mike-ditka-juice-box-guy',
 '/sunday-crew/articles/hollis-mike-ditka-juice-box-guy',
 '/doge/articles/hollis-mike-ditka-juice-box-guy'];
let failures=0;
for(const path of paths){
 try{
  const response=await fetch(new URL(path,origin),{redirect:'follow',signal:AbortSignal.timeout(20000),headers:{'cache-control':'no-cache'}});
  const html=await response.text();
  const article=path.includes('hollis-mike-ditka-juice-box-guy');
  const checks=[['HTTP OK',response.ok],['not a missing page',!/(Story not found\.|Sorry, not found|404: This page)/i.test(html)]];
  if(article)checks.push(['title',html.includes('The Juice Box Guy')],['approved subtitle',html.includes('indestructible characters')||html.includes('indestructible%20characters')],['inline video',html.includes('ry1tNGC6npg')]);
  if(path==='/')checks.push(['Ditka global story',html.includes('hollis-mike-ditka-juice-box-guy')],['Jaguars feature',html.includes('dashiell-jaguars-london-future')],['Jaguars before Ditka',html.indexOf('dashiell-jaguars-london-future')<html.indexOf('hollis-mike-ditka-juice-box-guy')]);
  for(const [name,ok] of checks){if(!ok){console.error('FAIL',path,name);failures++}}
  if(checks.every(([,v])=>v))console.log('PASS',path,response.status);
 }catch(e){console.error('FAIL',path,e.message);failures++}
}
if(failures)process.exit(1);
console.log('Release smoke tests passed:',origin.origin);
