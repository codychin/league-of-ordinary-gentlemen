import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
const read=p=>readFileSync(p,'utf8');
const article=JSON.parse(read('app/articles/conrad-allow-me-to-reintroduce-myself.js').replace(/^export const jayZArticle = /,'').replace(/;\s*$/,''));
const front=read('app/components/SharedEditorialFront.js');
test('approved Jay-Z title, subtitle, rumor attribution and exact selection/ending survive',()=>{
 assert.equal(article.title,'Allow Me to Reintroduce Myself');
 assert.equal(article.dek,'Finding someone equal to the occasion is easier when you consider yourself the occasion.');
 assert.equal(article.author,'sorrell');
 assert.match(article.body[0].html,/Dave Brooks’s reporting in Puck/);
 assert.match(article.body[0].html,/The booking remains unconfirmed\.$/);
 assert.equal(article.body[6],'After considering what the world needed to hear, Jay-Z had a name.');
 assert.equal(article.body[7],'Jay-Z.');
 assert.equal(article.body.at(-1),'He could have given the stage to somebody else. Just imagine how selfish that would have been.');
 assert.equal(article.body[10].type,'image');
 assert.match(article.body[10].alt,/Edited internet meme/);
 assert.ok(!article.body[10].caption);
 assert.ok(!JSON.stringify(article).includes('Steady, Jay'));
});
test('new approved lead is globally routed; prior lead shifts into exactly three cards and overflow stays visible',()=>{
 assert.ok(read('lib/editorial-scope.js').includes("'conrad-allow-me-to-reintroduce-myself'"));
 assert.ok(read('app/articles/data.js').includes("'conrad-allow-me-to-reintroduce-myself': jayZArticle"));
 const lead=front.slice(front.indexOf('<section'),front.indexOf('<section className={front.recent}'));
 assert.ok(lead.includes(article.title)&&lead.includes(article.dek));
 assert.match(lead,/sundayFeatureImage storylink \$\{front\.tourHero\}/);
 const recent=front.match(/<section className=\{front\.recent\}[^>]*>([\s\S]*?)<\/section>/)[1];
 assert.equal((recent.match(/<article className=\{front\.card\}/g)||[]).length,3);
 const rest=front.slice(front.indexOf(recent)+recent.length);
 assert.ok(rest.indexOf('/articles/maude-nfc-east-declines-winner')<rest.indexOf('/articles/sabine-and-you-are'));
});
test('Jay-Z and meme are local readable assets, never remote runtime placeholders',()=>{
 assert.ok(existsSync('public'+article.image));
 assert.ok(existsSync('public'+article.body[10].src));
 assert.ok(article.imageCredit?.url);
});

test("final approved copy edits survive publication",()=>{
 const body=JSON.stringify(article.body);
 for(const text of ["knowing they will appreciate the magnitude of the opportunity","on one of the world’s biggest stages","he would have denied"]) assert.ok(body.includes(text));
 for(const text of ["knowing he will appreciate","in front of the world","Most people have to endure the uncertainty of somebody else being impressed.","he might have denied"]) assert.ok(!body.includes(text));
});
