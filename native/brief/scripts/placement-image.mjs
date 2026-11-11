function walk(node,fn){
 if(!node||typeof node!=='object')return;
 fn(node);
 for(const value of Object.values(node)){
  if(Array.isArray(value))value.forEach(n=>walk(n,fn));
  else if(value&&typeof value==='object')walk(value,fn);
 }
}
function literal(node){
 if(node?.type==='StringLiteral')return node.value;
 if(node?.type==='JSXExpressionContainer')return literal(node.expression);
}
function hrefSuffix(node){
 if(node?.type==='JSXExpressionContainer')return hrefSuffix(node.expression);
 if(node?.type==='BinaryExpression'&&node.operator==='+')return hrefSuffix(node.right);
 if(node?.type==='TemplateLiteral')return node.quasis.at(-1)?.value.cooked;
 return literal(node);
}
// Images must belong to this story's Link subtree. A dynamic primary source
// falls back to its canonical article, never a later avatar or another story.
export function placementImage(section, source, slug, fallback) {
 const links=[];
 walk(section,node=>{
  if(node.type!=='JSXElement'||node.openingElement.name.name!=='Link')return;
  const href=node.openingElement.attributes.find(a=>a.name?.name==='href');
  if(hrefSuffix(href?.value)==='/articles/'+slug)links.push(node);
 });
 for(const link of links){
  const candidates=[];
  walk(link,node=>{
   if(node.type==='JSXOpeningElement'&&['img','Image','ResilientImage'].includes(node.name.name)){
    const src=node.attributes.find(a=>a.name?.name==='src');
    if(src)candidates.push({start:node.start,image:literal(src.value)});
   }
   if(node.type==='CallExpression'&&node.callee.name==='imageBackground')candidates.push({start:node.start,image:literal(node.arguments[0])});
  });
  candidates.sort((a,b)=>a.start-b.start);
  if(candidates.length)return candidates[0].image||fallback;
 }
 return fallback;
}
