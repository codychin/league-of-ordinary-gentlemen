import manifest from './generated/image-manifest.json';
export const imageAsset=src=>manifest[src];
export const imageSrc=(src,width=1280)=>manifest[src]?.variants?.[width]||manifest[src]?.src||src;
export const imageSrcSet=src=>{const a=manifest[src];return a?Object.entries(a.variants).map(([w,url])=>`${url} ${Math.min(Number(w),a.width)}w`).join(', '):undefined};

export const imageBackground=(src,width=640)=>{const a=manifest[src];return `url('${imageSrc(src,width)}')`+(a?.blur?`, url('${a.blur}')`:'')};
