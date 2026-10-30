import test from 'node:test';
import assert from 'node:assert/strict';
import {CRATE_ARTICLE_TOPICS,CRATE_TOPICS,crateArticle,filterCrateArticles,topicForArticle} from '../lib/crates.mjs';

test('article topics cross correspondent beats rather than inferring from author',()=>{
 assert.equal(topicForArticle({slug:'sabine-michigan-money-privilege-impatience'}),'Money & Power');
 assert.equal(topicForArticle({slug:'sabine-all-ugly-lloyd'}),'Football & Tactics');
 assert.equal(topicForArticle({slug:'upper-east-side-froyo'}),'Culture & Absurdity');
 assert.equal(topicForArticle({slug:'new-recap',section:'WEEK 8 MATCHUP RECAP',author:'march'}),null);
 assert.deepEqual(CRATE_TOPICS.map(t=>Object.values(CRATE_ARTICLE_TOPICS).filter(v=>v===t).length),[20,9,12,22]);
 assert.equal(Object.keys(CRATE_ARTICLE_TOPICS).length,63);
 assert.ok(Object.values(CRATE_ARTICLE_TOPICS).every(t=>CRATE_TOPICS.includes(t)));
});
test('edition cards retain their own route, byline, metadata and dates without transferring body',()=>{
 const a=crateArticle({slug:'local-recap',title:'A game',dek:'The margin',writer_slug:'kells',published_at:'2026-10-29T16:00:00Z',section:'MATCHUP RECAP',week:8,body:['private field not needed for cards']},'/doge');
 assert.equal(a.href,'/doge/articles/local-recap');assert.equal(a.by,'Marnie Kells');assert.equal(a.week,8);assert.equal(a.date,'October 29, 2026');assert.equal(a.body,undefined);
 assert.equal(crateArticle({slug:'undated',title:'Undated'}).date,null);
});
test('search and filters intersect, normalize accents, sort without changing input, and return empty results',()=>{
 const a=[{slug:'a',title:'Née Dimes',dek:'A football column',by:'Maude Gannon',topic:'Football & Tactics',timestamp:10},{slug:'b',title:'Another story',dek:'Dimes',by:'Marnie Kells',topic:'Culture & Absurdity',timestamp:20}];
 assert.deepEqual(filterCrateArticles(a,{query:'nee',author:'Maude Gannon'}).map(x=>x.slug),['a']);
 assert.deepEqual(filterCrateArticles(a,{query:'dimes',topic:'Culture & Absurdity'}).map(x=>x.slug),['b']);
 assert.equal(filterCrateArticles(a,{query:'unmatched'}).length,0);
 assert.deepEqual(filterCrateArticles(a).map(x=>x.slug),['b','a']);
 assert.deepEqual(filterCrateArticles(a,{order:'oldest'}).map(x=>x.slug),['a','b']);assert.equal(a[0].slug,'a');
});

test('global eligibility keeps reviewed shared work and excludes league-local matchups',async()=>{
 const {GLOBAL_ARTICLE_SLUGS,isGlobalArticle}=await import('../lib/editorial-scope.js');
 assert.equal(GLOBAL_ARTICLE_SLUGS.size,40);
 for(const slug of ['conrad-white-coaches-lose-individually','maude-jordan-love-alibis','hollis-body-keeps-score'])assert.equal(isGlobalArticle(slug),true);
 for(const slug of ['marnie-paying-retail','maude-jayden-daniels-elbow','route-22-phones','danir-bench-crime','unknown-new-story'])assert.equal(isGlobalArticle(slug),false);
});
test('cards reuse verified existing photos and retain imageless stories without fabricated media',()=>{
 for(const slug of ['conrad-white-coaches-lose-individually','marnie-cruise-swift-football'])assert.match(crateArticle({slug,title:'Story'}).image,/^\/images\/cache\//);
 assert.equal(crateArticle({slug:'marnie-tee-higgins-ankles',title:'Story'}).image,null);
 assert.equal(crateArticle({slug:'marnie-cruise-swift-football',image:'/original.webp'}).image,'/original.webp');
});
