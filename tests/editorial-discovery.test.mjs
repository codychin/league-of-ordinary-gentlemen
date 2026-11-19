import test from "node:test";
import assert from "node:assert/strict";
import {parseRss,scoreLead,dedupeAndRank,discoveryUrls,discover} from "../scripts/editorial/discover.mjs";

const rss=`<rss><channel><item><title><![CDATA[Tesla Roadster meme storm]]></title><link>https://example.com/a</link><description>Funny viral video</description><pubDate>Fri, 16 Oct 2026 12:00:00 GMT</pubDate></item><item><title>Ignored</title><link>javascript:alert(1)</link></item></channel></rss>`;
test("RSS parses legitimate linked entries, ignores malformed schemes",()=>{
 const items=parseRss(rss,"test");
 assert.equal(items.length,1);
 assert.equal(items[0].title,"Tesla Roadster meme storm");
});
test("ranks humor above speculative market content and deduplicates",()=>{
 const a={title:"Tesla Roadster meme storm",description:"Funny viral video"};
 const b={title:"Tesla Roadster stock price",description:"Earnings review"};
 assert.ok(scoreLead(a,"Tesla Roadster")>scoreLead(b,"Tesla Roadster"));
 assert.equal(dedupeAndRank([a,{...a,url:"different"},b],"Tesla Roadster").length,2);
});
test("discovery links are safe and correctly encoded",()=>{
 const urls=discoveryUrls("Tesla & flying car");
 assert.match(urls.xLatest,/Tesla%20%26%20flying%20car/);
 assert.match(urls.xMedia,/filter%3Amedia/);
});
test("graceful partial feed outages, no credential requirements",async()=>{
 const fakeFetch=async()=>({ok:true,text:async()=>rss});
 const result=await discover("Tesla Roadster",fakeFetch);
 assert.equal(result.leads.length,1);
 assert.deepEqual(result.warnings,[]);
 assert.match(result.method,/NOT an X feed/);
});
