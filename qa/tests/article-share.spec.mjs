import {test,expect} from '../helpers/browser.mjs';

// Isolate editorial/share QA from the unavailable external comments service.
test.beforeEach(async ({page}) => {
  await page.route('**/functions/v1/brief-comments?**', route => route.fulfill({json:{comments:[],votes:[]}}));
});
const path='/doge/articles/maude-saturation-bombing-daniel-jones';

test('share fallback preserves edition, copies on request and exposes destination links without posting',async({page})=>{
  await page.addInitScript(()=>{
    Object.defineProperty(navigator,'share',{configurable:true,value:undefined});
    window.copies=[];
    Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async text=>window.copies.push(text)}});
  });
  await page.goto(path+'?app-preview=1');
  const button=page.getByRole('button',{name:'Share this article'});
  await button.click();
  const options=page.getByRole('group',{name:'Share options'});
  await expect(options).toBeVisible();
  await expect(options.getByRole('button',{name:'Copy link'})).toBeFocused();
  const expected=new URL(path,page.url()).href;
  await expect(options.getByLabel('Article link')).toHaveValue(expected);
  for(const name of ['Facebook','X','WhatsApp','Email'])expect(decodeURIComponent(await options.getByRole('link',{name,exact:true}).getAttribute('href'))).toContain(expected);
  expect(await page.evaluate(()=>window.copies)).toEqual([]);
  await options.getByRole('button',{name:'Copy link'}).click();
  await expect(options.getByRole('status')).toHaveText('Link copied');
  expect(await page.evaluate(()=>window.copies)).toEqual([expected]);
  await page.keyboard.press('Escape');
  await expect(options).toHaveCount(0);
  await expect(button).toBeFocused();
});

test('native share success and cancellation do not silently copy or open destinations',async({page})=>{
  await page.addInitScript(()=>{
    window.shares=[];window.copyCount=0;
    Object.defineProperty(navigator,'share',{configurable:true,value:async data=>window.shares.push(data)});
    Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async()=>window.copyCount++}});
  });
  await page.goto(path);
  const button=page.getByRole('button',{name:'Share this article'});
  await button.click();
  await expect(page.locator('.articleShareStatus')).toHaveText('Shared');
  expect((await page.evaluate(()=>window.shares))[0].url).toBe(new URL(path,page.url()).href);
  await page.evaluate(()=>Object.defineProperty(navigator,'share',{configurable:true,value:async()=>{throw new DOMException('Canceled','AbortError')}}));
  await button.click();
  await expect(button).toHaveAttribute('aria-busy','false');
  await expect(page.getByRole('group',{name:'Share options'})).toHaveCount(0);
  expect(await page.evaluate(()=>window.copyCount)).toBe(0);
});

test('native failure offers manual copy when clipboard access fails',async({page})=>{
  await page.addInitScript(()=>{
    Object.defineProperty(navigator,'share',{configurable:true,value:async()=>{throw new Error('Unavailable')}});
    Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async()=>{throw new Error('Denied')}}});
  });
  await page.goto(path);
  await page.getByRole('button',{name:'Share this article'}).click();
  const options=page.getByRole('group',{name:'Share options'});
  await options.getByRole('button',{name:'Copy link'}).click();
  await expect(options.getByRole('status')).toHaveText('Copy unavailable. Select the link below.');
  await expect(options.getByLabel('Article link')).toHaveAttribute('readonly','');
  await options.getByRole('button',{name:'Close',exact:true}).click();
  await expect(options).toHaveCount(0);
});

test('editorial refinements retain focal crop, open layout and inline sharing',async({page})=>{
  await page.goto('/');
  await expect(page.locator('.leadStoryFlag')).toHaveCount(0);
  const carousel=page.locator('[aria-label="Recent stories"]');
  await expect(carousel.locator(':scope > article')).toHaveCount(3);
  await expect(carousel.locator('.read')).toHaveCount(0);
  await expect(page.getByText(/^READ (?:MAUDE|CONRAD|MARNIE|HOLLIS|SABINE|DASHIELL)(?: →)?$/)).toHaveCount(0);
  const story=carousel.locator(':scope > article > a').first();
  await expect(story).toHaveAttribute('href','/articles/maude-saturation-bombing-daniel-jones');
  await expect(story.locator('h3')).toHaveText('On the Saturation Bombing of Daniel Jones (née Dimes)');
  await expect(story.locator('.previewAuthor img')).toBeVisible();
  await page.keyboard.press('Tab');await story.focus();
  await expect(story).toHaveCSS('outline-width','2px');
  await expect(story).toHaveCSS('display','block');
  const storyHeights=await carousel.locator(':scope > article > a').evaluateAll(es=>es.map(e=>e.getBoundingClientRect().height));
  expect(Math.max(...storyHeights)-Math.min(...storyHeights)).toBeGreaterThan(5);
  await expect(carousel).toHaveCSS('border-bottom-width','0px');
  await expect(carousel.locator(':scope > article').first()).toHaveCSS('border-bottom-width','0px');
  if(page.viewportSize().width<=900){
    await expect(carousel).toHaveCSS('gap','16px');
    const card=carousel.locator(':scope > article').first();
    const shelfBox=await carousel.boundingBox(),cardBox=await card.boundingBox();
    expect(cardBox.width).toBeCloseTo(Math.max(shelfBox.width*.82,280),0);
    await expect(card.locator('[role="img"]')).toHaveCSS('height','150px');
  }
  await expect(carousel.locator(':scope > article').first()).toHaveCSS('border-right-width','0px');
  await expect(page.getByRole('img',{name:'Jay-Z at the Shawn Carter Foundation Carnival in 2011.'})).toHaveCSS('background-position',/^50% 0%(, 50% 0%)*$/);
  const lead=page.locator('[data-editorial-layout="open-top"]');
  for(const e of [lead,lead.locator('.sundayFrontGrid'),lead.locator('.sundayFeature')]) {
    await expect(e).toHaveCSS('border-top-width','0px');
    await expect(e).toHaveCSS('border-bottom-width','0px');
  }
  await expect(page.locator('section[aria-label="Week 8, the previews. videos"]')).toHaveCSS('border-bottom-width','0px');
  if(page.viewportSize().width>760){
    const image=await lead.locator('.sundayFeatureImage').boundingBox();
    const category=await lead.locator('.sabinePackageIntro > small').boundingBox();
    expect(Math.abs(image.y-category.y)).toBeLessThanOrEqual(2);
  }
  await page.goto('/articles/marnie-detroit-school');
  await page.evaluate(()=>document.fonts.ready);
  const subtitle=page.getByRole('heading',{name:'I. Genesis: The Gibbs Proposition'});
  expect(parseFloat(await subtitle.evaluate(e=>getComputedStyle(e).fontSize))).toBeGreaterThanOrEqual(26);
  await expect(subtitle).toHaveCSS('text-transform','none');
  const button=page.getByRole('button',{name:'Share this article'});
  await expect(button).toHaveCSS('border-top-width','0px');
  await expect(page.locator('.byline time')).toBeVisible();
  const [a,b]=await Promise.all([page.locator('.bylineWriter').boundingBox(),button.boundingBox()]);
  expect(b.y+b.height/2).toBeGreaterThanOrEqual(a.y);
  expect(b.y+b.height/2).toBeLessThanOrEqual(a.y+a.height);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
