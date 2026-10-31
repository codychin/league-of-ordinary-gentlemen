import {test, expect} from '../helpers/browser.mjs';
import {createHash} from 'node:crypto';

test('System A uses exact supporting faces and preserves header/navigation', async ({page}) => {
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);
  for (const [file,hash] of [
    ['Regular','bade59d822652f76e6941aa87b40a87c13d1cc70db98ededb5011127efafd1d3'],
    ['Bold','1b5f2da6f4cadce4c05b9ecebe3a6fcd374eb95ae443605e799f4c3287978939'],
  ]) {
    const response=await page.request.get(`/fonts/liberation-sans/LiberationSans-${file}.ttf`);
    expect(response.status()).toBe(200);
    expect(createHash('sha256').update(await response.body()).digest('hex')).toBe(hash);
  }
  for(const [selector,size,weight,line] of [
    ['.affairsHead h2','20px','700','24px'],
    ['.sabinePackageIntro > small','14px','700','20px'],
    ['.sabinePackageIntro > p','17px','400','24px'],
    ['.previewAuthor strong','14px','700','20px'],
    ['.sundayFeatureCopy > .read','16px','700','24px'],
  ]) {
    const el=page.locator(selector).first();
    await expect(el).toHaveCSS('font-family','"Brief Editorial Sans", sans-serif');
    await expect(el).toHaveCSS('font-size',size);
    await expect(el).toHaveCSS('font-weight',weight);
    await expect(el).toHaveCSS('line-height',line);
    await expect(el).toHaveCSS('font-synthesis','none');
  }
  await expect(page.locator('.sabinePackageIntro > p').first()).toHaveCSS('color','rgb(38, 36, 31)');
  await expect(page.locator('.previewAuthor strong').first()).toHaveCSS('color','rgb(117, 110, 99)');
  await expect(page.locator('.mast h1')).toHaveCSS('font-family','"Brief Nine F Native Preview", Georgia, serif');
  await expect(page.locator('.mast h1')).toHaveCSS('color','rgb(17, 16, 14)');
  for(const el of await page.locator('.siteNav a, .appTabBar a').all()) {
    expect(await el.evaluate(e=>getComputedStyle(e).fontFamily)).not.toContain('Brief Editorial Sans');
  }
  if(page.viewportSize().width<=760) {
    await expect(page.locator('.sabinePackageTitle h2').first()).toHaveCSS('font-size','31px');
    await expect(page.locator('.sabinePackageTitle h2').first()).toHaveCSS('line-height','35px');
    await expect(page.locator('[aria-label="Recent stories"] h3').first()).toHaveCSS('font-size','23px');
    await expect(page.locator('[aria-label="Recent stories"] h3').first()).toHaveCSS('line-height','26px');
  }
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await expect(page.locator('.leadStoryFlag')).not.toContainText('LEAD STORY');
  await expect(page.locator('.sundayFeatureCopy .previewAuthor img').first()).toBeVisible();
  await expect(page.locator('.sundayFeatureCopy .previewAuthorCopy small').first()).toHaveText('Culture & Sporting Life');
  const caption=page.locator('.sundayFeatureImage .actionCaption').first();
  await expect(caption).toBeVisible();
  await expect(caption).toContainText('MARNIE KELLS');
  await expect(caption).toContainText('THE DETROIT SCHOOL · 2026');
  expect(await caption.evaluate(e=>getComputedStyle(e).backgroundColor)).not.toBe('rgba(0, 0, 0, 0)');
  const firstCard=page.locator('[aria-label="Recent stories"] > article').first();
  await expect(firstCard).toHaveCSS('border-right-width','1px');
  await expect(firstCard).toHaveCSS('border-right-style','solid');
});

test('System A article prose remains sentence case, 19/28, and uses real bold bylines',async({page})=>{
  await page.goto('/articles/maude-saturation-bombing-daniel-jones');
  await page.evaluate(()=>document.fonts.ready);
  const body=page.locator('.articleBody p').first();
  await expect(body).toHaveCSS('font-size','19px');
  await expect(body).toHaveCSS('line-height','28px');
  await expect(body).toHaveCSS('font-weight','400');
  await expect(body).toHaveCSS('color','rgb(38, 36, 31)');
  await expect(body).toHaveCSS('text-transform','none');
  await expect(page.locator('.bylineWriter strong')).toHaveCSS('font-weight','700');
  await expect(page.locator('.bylineWriter strong')).toHaveCSS('text-transform','uppercase');
  await expect(page.locator('.bylineWriter img')).toBeVisible();
  await expect(page.locator('.bylineWriter em')).toHaveText('Football Strategy & Bad Process');
  await expect(page.getByRole('button',{name:'Share this article'})).toBeVisible();
});
