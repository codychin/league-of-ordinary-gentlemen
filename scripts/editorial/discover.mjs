#!/usr/bin/env node
/**
 * Zero-credential discovery for The Brief.
 * Public Google News RSS offers leads, not complete X access or verified original embeds.
 * Usage: node scripts/editorial/discover.mjs "Tesla Roadster"
 */
import { pathToFileURL } from "node:url";

const MAX_ITEMS = 45;
const timeoutMs = 9000;
export const xmlText = (input="") => input
  .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,"$1")
  .replace(/<[^>]+>/g,"")
  .replace(/&amp;/g,"&").replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'")
  .replace(/&lt;/g,"<").replace(/&gt;/g,">").trim();

export function parseRss(xml, source) {
  return [...xml.matchAll(/<item(?:\s[^>]*)?>([\s\S]*?)<\/item>/g)].map(([,item])=>{
    const field = (name) => xmlText(item.match(new RegExp("<"+name+"(?:\\s[^>]*)?>([\\s\\S]*?)<\\/"+name+">"))?.[1] ?? "");
    const link = field("link");
    if (!/^https?:\/\//.test(link)) return null;
    return {title:field("title"),url:link,description:field("description"),published:field("pubDate"),source};
  }).filter(Boolean);
}

export function scoreLead(lead, topic) {
  const text = (lead.title+" "+lead.description).toLowerCase();
  const words=topic.toLowerCase().split(/\W+/).filter(w=>w.length>3);
  let score=words.reduce((n,w)=>n+(text.includes(w)?3:0),0);
  for (const [re,weight] of [
    [/meme|parod|satir|jok|absurd|ridicul|funny|viral|reaction/,4],
    [/video|clip|photo|image|post|tweet/,2],
    [/explod|chaos|bizarre|mock|roast|troll/,2],
    [/price|stock|earnings|invest|review|specification/, -3],
  ]) if(re.test(text)) score+=weight;
  const age=Date.now()-Date.parse(lead.published);
  if(Number.isFinite(age) && age>=0 && age<48*3600e3) score+=2;
  return score;
}

export function dedupeAndRank(leads, topic) {
  const seen=new Set();
  return leads.filter(lead=>{
    // News syndication can repeat titles while changing URLs.
    const key=lead.title.toLowerCase().replace(/\s[-|–].*$/,"").replace(/[^a-z0-9]+/g," ").trim();
    if(!key || seen.has(key)) return false;
    seen.add(key);return true;
  }).map(lead=>({...lead,score:scoreLead(lead,topic)}))
    .sort((a,b)=>b.score-a.score || (Date.parse(b.published)||0)-(Date.parse(a.published)||0))
    .slice(0,MAX_ITEMS);
}
export function discoveryUrls(topic) {
  const q=encodeURIComponent(topic);
  // X pages are research links only; do not claim to have read their content.
  return {
    xLatest:"https://x.com/search?q="+q+"&f=live",
    xMedia:"https://x.com/search?q="+encodeURIComponent(topic+" filter:media")+"&f=live",
    reddit:"https://www.reddit.com/search/?q="+q+"&sort=new",
    googleNews:"https://news.google.com/search?q="+q
  };
}
export function feedUrls(topic) {
  const queries=[
    topic+" meme OR joke OR absurd",
    topic+" viral twitter OR reddit",
    topic+" video OR parody",
    'site:reddit.com '+topic
  ];
  return queries.map((q,i)=>({name:["Meme coverage","Social reactions","Visual leads","Community coverage"][i],
    url:"https://news.google.com/rss/search?q="+encodeURIComponent(q)+"&hl=en-US&gl=US&ceid=US:en"}));
}
export async function fetchFeed(feed,fetchFn=fetch) {
  const response=await fetchFn(feed.url,{headers:{"User-Agent":"TheBriefEditorialDiscovery/1.0 (public RSS only)"},signal:AbortSignal.timeout(timeoutMs)});
  if(!response.ok)throw new Error("HTTP "+response.status);
  return parseRss(await response.text(),feed.name);
}
export async function discover(topic,fetchFn=fetch) {
  const feeds=feedUrls(topic);
  const responses=await Promise.allSettled(feeds.map(feed=>fetchFeed(feed,fetchFn)));
  const warnings=responses.flatMap((r,i)=>r.status==="rejected" ? [feeds[i].name+": "+String(r.reason?.message ?? r.reason)] : []);
  const leads=responses.flatMap(r=>r.status==="fulfilled"?r.value:[]);
  return {topic,generatedAt:new Date().toISOString(),method:"public RSS leads; NOT an X feed or verified original tweets",
    reviewLinks:discoveryUrls(topic),leads:dedupeAndRank(leads,topic),warnings,
    editorialChecks:["Open source and verify the actual post/clip","Trace original author and canonical post URL","Check date and avoid recycled memes","Judge joke and relevance manually","Obtain editorial approval before publishing"]};
}
export function markdown(report) {
  const out=["# The Brief — Discovery candidates", "", "**Topic:** "+report.topic,
    "**Generated:** "+report.generatedAt,"**Caveat:** "+report.method,"",
    "## Direct searches (manual editorial review)","",
    ...Object.entries(report.reviewLinks).map(([k,v])=>"- "+k+": "+v),
    "", "## Leads (not approved posts)",""];
  for(const [i,lead] of report.leads.entries()){
    out.push((i+1)+". **"+lead.title.replace(/\*/g,"")+"** (signal "+lead.score+", "+lead.source+")",
      "   - "+lead.url,"   - Published: "+(lead.published||"unknown"));
  }
  if(!report.leads.length)out.push("No public RSS leads retrieved. Try the direct search links.");
  out.push("","## Verification checklist","",...report.editorialChecks.map(s=>"- [ ] "+s));
  if(report.warnings.length)out.push("","## Source errors","",...report.warnings.map(w=>"- "+w));
  return out.join("\n")+"\n";
}
if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href) {
  const topic=process.argv.slice(2).join(" ").trim();
  if(!topic){console.error('Usage: node scripts/editorial/discover.mjs "Tesla Roadster"');process.exitCode=2;}
  else {const result=await discover(topic);console.log(markdown(result));}
}
