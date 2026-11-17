import test from 'node:test';
import assert from 'node:assert/strict';
import {publicSitemap, SITE_ORIGIN} from '../lib/public-sitemap.mjs';
import {buildSync} from 'esbuild';

const bundled = buildSync({stdin:{contents:"export {default as sitemap} from './app/sitemap.js'; export {default as robots} from './app/robots.js'; export {articles} from './app/articles/data.js'; export {isGlobalArticle} from './lib/editorial-scope.js';",resolveDir:process.cwd()},bundle:true,write:false,platform:'node',format:'cjs'}).outputFiles[0].text;
const module = {exports:{}};
new Function('module','exports','require',bundled)(module,module.exports,()=>{throw Error('Unexpected external dependency')});
const {sitemap,robots,articles,isGlobalArticle} = module.exports;

test('public sitemap excludes local, staging and redirected alias entries',()=>{
  const result = publicSitemap({live:{},draft:{stagingOnly:true},local:{},'sabine-chest-speculation-statement':{}},slug=>slug!=='local');
  assert.deepEqual(result.map(x=>x.url),[`${SITE_ORIGIN}/`,`${SITE_ORIGIN}/archive`,`${SITE_ORIGIN}/articles/live`]);
  assert.ok(result.every(x=>!('lastModified' in x)));
});
test('route covers exactly the current published global article inventory',()=>{
  const urls=sitemap().map(x=>x.url);
  const expected=Object.entries(articles).filter(([slug,a])=>isGlobalArticle(slug)&&!a.stagingOnly&&slug!=='sabine-chest-speculation-statement');
  assert.equal(urls.length,expected.length+2);
  assert.equal(new Set(urls).size,urls.length);
  for(const [slug] of expected) assert.ok(urls.includes(`${SITE_ORIGIN}/articles/${slug}`));
  assert.ok(urls.includes(`${SITE_ORIGIN}/articles/newsroom-ai-apology`));
  for(const url of urls){assert.equal(new URL(url).origin,SITE_ORIGIN);assert.equal(new URL(url).search,'');}
});
test('robots advertises the canonical sitemap without blocking crawl',()=>{
  assert.deepEqual(robots(),{rules:{userAgent:'*',allow:'/'},sitemap:`${SITE_ORIGIN}/sitemap.xml`});
});
