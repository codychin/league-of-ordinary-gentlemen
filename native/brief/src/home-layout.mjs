// Owner placement override: keep this published story in Crates, not Home.
export const homeEligible = slug => slug !== 'marnie-tee-higgins-ankles';
// Decide from the rendered module order, never the date or network loading state.
export const homeHeroBleeds = modules => modules[0]?.kind === 'lead';
// Native floating chrome needs real source headroom; preserve the approved lower
// fade/copy geometry without hiding Gibbs underneath the status/logo overlay.
// Keep the canonical listing crop everywhere else, including the feed itself.
export const immersiveHeroImage = article => article.slug === 'marnie-detroit-school'
  ? '/images/editorial/detroit-school/completed-composition-selected.png' : article.image;
export const eligibleHome = home => home.map(p=>({...p,cards:p.cards.filter(c=>homeEligible(c.slug))})).filter(p=>p.cards.length);
// Re-group only adjacent, already eligible Home placements. Never sort or add inventory.
export function homeModules(home) {
  home=eligibleHome(home);
  const result=[];
  let firstCarouselSeen=false;
  for(let i=0;i<home.length;) {
    const item=home[i];
    if(item.kind==='carousel'&&!firstCarouselSeen) {
      firstCarouselSeen=true;result.push(item);i++;continue;
    }
    if(firstCarouselSeen&&item.kind==='feature') {
      const run=[];
      while(i<home.length&&home[i].kind==='feature') run.push(home[i++]);
      // Keep two large features as a bridge, then introduce a second carousel.
      result.push(...run.slice(0,2));
      if(run.length>=5) {
        result.push({kind:'carousel',cards:run.slice(2,5).flatMap(p=>p.cards)});
        if(run.length>5) result.push({kind:'rows',cards:run.slice(5).flatMap(p=>p.cards)});
      } else result.push(...run.slice(2));
      continue;
    }
    // Preserve the assignment's approved video alongside its final article row.
    result.push(item.kind==='assignment'?{...item,kind:'assignment-row'}:item);
    i++;
  }
  return result;
}

// Known published intrinsic dimensions; never discover a different first-frame crop.
export function detroitHeroGeometry(width, safeTop=0) {
 const height=Math.min(600,Math.max(340,width*26/21));
 const scale=width/1230;
 // Source helmet begins around y620. Keep it below the logo control, using
 // real photographic headroom rather than a blank band or a page offset.
 const top=Math.min(0,safeTop+64-620*scale);
 return {height,imageWidth:1778*scale,imageHeight:2048*scale,left:-350*scale,top};
}

// Native reference: clear photograph until the final160pt, then the category
// and headline cross one continuous fade. No panel or copy-layout spacer.
export function approvedHeroFade(height, appearance) {
 const positions=[0,height-160,height-112,height-77,height-42,height-12,height];
 const alpha=appearance==='dark'?[0,0,.86,.90,.96,.99,1]:[0,0,.75,.90,.96,.99,1];
 return positions.map((y,i)=>({offset:Math.max(0,Math.min(1,y/height)),alpha:alpha[i]}));
}
