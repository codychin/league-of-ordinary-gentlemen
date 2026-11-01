import {test,expect} from '../helpers/browser.mjs';
test('all edition PWAs inherit browser editorial rhythm and preserve reading state',async({page})=>{
 test.skip(page.viewportSize().width>760,'Mobile PWA parity');
 await page.route('https://a.espncdn.com/**',r=>r.abort());
 await page.route('**/functions/v1/brief-comments?**',r=>r.fulfill({json:{comments:[],votes:[]}}));
 for(const root of ['/','/doge','/sunday-crew']){
  let browser;
  for(const standalone of [false,true]){
   await page.goto(root+(standalone?'?app-preview=1':''));await page.evaluate(()=>document.fonts.ready);
   const state=await page.evaluate(()=>{const lead=document.querySelector('.immersiveLead'),deck=lead.querySelector('.sabinePackageIntro > p'),next=document.querySelector('[aria-label="Recent stories"]');const features=[...document.querySelectorAll('main > .hero.heroStack')].map(h=>{const s=getComputedStyle(h),t=getComputedStyle(h.querySelector('h2')),d=getComputedStyle(h.querySelector('.standfirst'));return{paddingTop:s.paddingTop,paddingBottom:s.paddingBottom,marginBottom:s.marginBottom,title:[t.fontSize,t.lineHeight,t.letterSpacing],deck:[d.fontSize,d.lineHeight],gap:h.nextElementSibling.getBoundingClientRect().top-h.querySelector('.standfirst').getBoundingClientRect().bottom}});return{leadGap:next.getBoundingClientRect().top-deck.getBoundingClientRect().bottom,features}});
   expect(state.leadGap).toBeCloseTo(40,0);expect(state.features.length).toBeGreaterThanOrEqual(2);
   for(const f of state.features){expect(f.paddingTop).toBe('0px');expect(f.paddingBottom).toBe('0px');expect(f.title).toEqual(['31px','35px','normal']);expect(f.deck).toEqual(['17px','24px']);expect(f.gap).toBeCloseTo(56,0);}
   if(standalone)expect(state).toEqual(browser);else browser=state;
   await expect(page.locator('.appSectionHeader')).toHaveCSS('background-color','rgba(0, 0, 0, 0)');
   await expect(page.locator('.appTabBar')).toBeVisible();
  }
  const key='brief-'+(root==='/'?'loog':root.slice(1))+'-week8-preview-viewed-v2';
  await page.evaluate(key=>localStorage.setItem('pwa-parity-preserve-'+key,'sentinel'),key);
  const link=page.getByRole('link',{name:'A Study in Movement: The Detroit School, 2026',exact:true});await link.click();await expect(page).toHaveURL(/\/articles\/marnie-detroit-school$/);await page.goBack();await expect(page.locator('.immersiveLead')).toBeVisible();expect(await page.evaluate(key=>localStorage.getItem('pwa-parity-preserve-'+key),key)).toBe('sentinel');
 }
});
