import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const content=readFileSync('app/articles/data.js','utf8');
const front=readFileSync('app/components/SharedEditorialFront.js','utf8');
const article=readFileSync('app/articles/[slug]/page.js','utf8');
const slugs=[...front.matchAll(/root\+"\/articles\/([a-z0-9-]+)"/g)].map(m=>m[1]);

test('every featured editorial link has a published article record',()=>{
 assert.ok(slugs.length>=5,'unexpectedly empty featured article list');
 for(const slug of slugs){
  assert.ok(content.includes(JSON.stringify(slug)+':')||content.includes("'"+slug+"':"),`Missing article record for homepage link: ${slug}`);
 }
});

test('approved featured story appears first global below standalone Jaguars dispatch',()=>{
 const j=front.indexOf('aria-label="On Assignment: Dashiell Pike in London"');
 const grid=front.indexOf('aria-label="Recent stories"');
 const feature=front.indexOf('aria-label="Marnie Kells on Jeremy Hecklinski"');
 const ditka=front.indexOf('aria-label="Hollis Crane remembers Mike Ditka"');
 const next=front.indexOf('aria-label="Marnie Kells on the Time-Traveling Goblin Paradox"');
 assert.ok(j>=0&&grid>j&&feature>grid&&ditka>feature&&next>ditka,'global editorial ordering changed');
});

test('Ditka media is inline and story is present',()=>{
 assert.match(content,/"hollis-mike-ditka-juice-box-guy":/);
 assert.match(content,/"id":"ry1tNGC6npg"/);
 assert.match(content,/His players will remember the leader they knew/);
 assert.match(article,/p\?\.type==="youtube"/);
 assert.doesNotMatch(article,/WATCH THE JUICE BOX EXCHANGE/);
});

test('global article carousel must have exactly three stories',()=>{
 const section=front.match(/<section className=\{front\.recent\}[^>]*>([\s\S]*?)<\/section>/);
 assert.ok(section,'global story carousel must exist');
 const cards=section[1].match(/<article className=\{front\.card\}/g)||[];
 assert.equal(cards.length,3,'homepage carousel is limited to three articles; move displaced stories to archive');
});

test('Use Your Words video is last and cannot spoil homepage',()=>{
 assert.match(content, /"marnie-hecklinski-use-your-words":/);
 const story=content.split('"marnie-hecklinski-use-your-words":')[1].split(',"marnie-')[0];
 assert.match(story, /"type":"xclip","id":"2108815586281099617"/);
 assert.match(article, /p\?\.type==="xclip"/);
 assert.doesNotMatch(front, /FUCKING JUMP/);
});
