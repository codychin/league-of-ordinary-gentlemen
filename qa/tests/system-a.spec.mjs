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
    ['.editorialSectionLabel','20px','700','24px'],
    ['.sabinePackageIntro > small','14px','400','20px'],
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
});

test('System A article prose remains sentence case, 17/24, and uses real bold bylines',async({page})=>{
  await page.goto('/articles/maude-saturation-bombing-daniel-jones');
  await page.evaluate(()=>document.fonts.ready);
  const body=page.locator('.articleBody p').first();
  await expect(body).toHaveCSS('font-size','17px');
  await expect(body).toHaveCSS('line-height','24px');
  await expect(body).toHaveCSS('font-weight','400');
  await expect(body).toHaveCSS('color','rgb(38, 36, 31)');
  await expect(body).toHaveCSS('text-transform','none');
  await expect(page.locator('.bylineWriter strong')).toHaveCSS('font-weight','700');
  await expect(page.locator('.bylineWriter strong')).toHaveCSS('text-transform','uppercase');
});
