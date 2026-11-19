// Narrow content-only boundary for one audited, JSON-backed article module.
// No eval, Function, dynamic import, or execution of either candidate source.
export const NEWSROOM_COPY_PATH = 'app/articles/newsroom-ai-apology.js';
const TOP_KEYS = ['week','section','title','dek','image','imageAlt','date','author','collectiveByline','body'];
const signatureKeys = ['name','src','width','height','maxWidth'];
const clipKeys = ['type','id','url','videoSrc','caption','showCaption'];
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const exactKeys = (value,keys) => object(value) && Object.keys(value).length === keys.length && keys.every(key=>Object.hasOwn(value,key));
const text = value => typeof value === 'string' && value.length > 0 && value.length <= 20_000;
// The renderer interprets *emphasis*. These characters and line/control breaks
// are outside a plain-copy change, even though some would render inertly.
const plain = value => text(value) && value.trim().length > 0 && !/[<>*\x00-\x1f\x7f]/.test(value);
const positive = value => Number.isFinite(value) && value > 0;
function validArticle(article) {
  if (!exactKeys(article,TOP_KEYS) || !Number.isInteger(article.week) || article.week < 1 ||
      !plain(article.title) || !plain(article.dek) || !Array.isArray(article.body) || !article.body.length ||
      !['section','image','imageAlt','date','author','collectiveByline'].every(key=>text(article[key]))) return false;
  return article.body.every(block => {
    if (typeof block === 'string') return plain(block);
    if (!object(block)) return false;
    if (block.type === 'break') return exactKeys(block,['type']);
    if (block.type === 'xclip') return exactKeys(block,clipKeys) &&
      ['id','url','videoSrc','caption'].every(key=>text(block[key])) && typeof block.showCaption === 'boolean';
    if (block.type === 'signatures') return exactKeys(block,['type','signatures']) &&
      Array.isArray(block.signatures) && block.signatures.length > 0 &&
      block.signatures.every(signature=>exactKeys(signature,signatureKeys) &&
        text(signature.name) && text(signature.src) && ['width','height','maxWidth'].every(key=>positive(signature[key])));
    return false;
  });
}
function equal(a,b) {
  if (a === b) return true;
  if (Array.isArray(a)) return Array.isArray(b) && a.length === b.length && a.every((value,i)=>equal(value,b[i]));
  if (!object(a) || !object(b)) return false;
  const keys=Object.keys(a);
  return keys.length === Object.keys(b).length && keys.every(key=>Object.hasOwn(b,key) && equal(a[key],b[key]));
}
function parseStrictJson(input) {
  // JSON.parse silently accepts duplicate keys; detect them before returning a
  // value so an ambiguous module cannot qualify for reduced validation.
  let at=0;
  const space=()=>{while(/[ \t\r\n]/.test(input[at]||'x'))at++;};
  function string() {
    if(input[at] !== '"')throw Error('JSON string required');
    const start=at++;
    while(at<input.length) {
      const c=input[at++];
      if(c==='"')return JSON.parse(input.slice(start,at));
      if(c==='\\')at++;
    }
    throw Error('Unterminated string');
  }
  function value(depth=0) {
    if(depth>64)throw Error('Nesting limit');
    space();const c=input[at];
    if(c==='"')return string();
    if(c==='{') {
      at++;space();const result=Object.create(null),keys=new Set();
      if(input[at]==='}'){at++;return result;}
      while(true) {
        space();const key=string();
        if(keys.has(key)||['__proto__','constructor','prototype'].includes(key))throw Error('Ambiguous object');
        keys.add(key);space();if(input[at++]!==':')throw Error('Colon required');
        result[key]=value(depth+1);space();const end=input[at++];
        if(end==='}')return result;if(end!==',')throw Error('Comma required');
      }
    }
    if(c==='[') {
      at++;space();const result=[];if(input[at]===']'){at++;return result;}
      while(true){result.push(value(depth+1));space();const end=input[at++];if(end===']')return result;if(end!==',')throw Error('Comma required');}
    }
    const token=/^(?:true|false|null|-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?)/.exec(input.slice(at));
    if(!token)throw Error('Invalid value');at+=token[0].length;return JSON.parse(token[0]);
  }
  const result=value();space();if(at!==input.length)throw Error('Trailing JSON');return result;
}
function parseModule(source) {
  if(typeof source!=='string'||source.length>1_000_000)throw Error('Invalid source size');
  const match=/^\s*export\s+const\s+newsroomApologyArticle\s*=\s*(\{[\s\S]*\})\s*;\s*$/.exec(source);
  if(!match)throw Error('Unknown module form');
  const article=parseStrictJson(match[1]);
  if(!validArticle(article))throw Error('Unknown article schema');
  return article;
}
export function isNewsroomCopyOnlyChange(beforeSource,afterSource) {
  try {
    const before=parseModule(beforeSource),after=parseModule(afterSource);
    // Every top-level field other than two literal text fields is immutable.
    for(const key of TOP_KEYS)if(!['title','dek','body'].includes(key) && !equal(before[key],after[key]))return false;
    if(before.body.length!==after.body.length)return false;
    for(let i=0;i<before.body.length;i++) {
      const old=before.body[i],next=after.body[i];
      if(typeof old==='string') {if(typeof next!=='string'||!plain(next))return false;}
      else if(!equal(old,next))return false;
    }
    return true;
  } catch { return false; }
}
