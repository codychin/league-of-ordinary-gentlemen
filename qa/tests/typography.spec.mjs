import {test, expect} from '../helpers/browser.mjs';

const family = 'Brief Nine F Native Preview';
const fontPath = '/fonts/brief-nine-f/BriefNineFNativePreview-Bold.ttf';
for (const root of ['', '/sunday-crew', '/doge']) {
  for (const route of [root || '/', `${root}/articles/maude-saturation-bombing-daniel-jones`, `${root}/archive`]) {
    test(`9F headlines preserve readable layout: ${route}`, async ({page}, testInfo) => {
      const response = await page.goto(route);
      expect(response.status()).toBe(200);
      await page.evaluate(() => document.fonts.ready);
      expect(await page.evaluate(f => document.fonts.check(`700 24px "${f}"`, 'née'), family)).toBe(true);
      const font = await page.request.get(fontPath);
      expect(font.status()).toBe(200);
      const {createHash} = await import('node:crypto');
      expect(createHash('sha256').update(await font.body()).digest('hex')).toBe('817547b982bd922aff2d243f844ccb7094aded860940441faf829c867961bdd3');
      const headings = page.locator('.mast h1, .miniMast, .articleTitle, .editionArticleTitle, main a[href*="/articles/"] :is(h2,h3,h4)');
      expect(await headings.count()).toBeGreaterThan(0);
      const failures = await headings.evaluateAll((nodes, f) => nodes.flatMap(el => {
        if (!el.getClientRects().length) return [];
        const css = getComputedStyle(el);
        const issues = [];
        if (!css.fontFamily.includes(f) || css.fontWeight !== '700' || css.fontSynthesis !== 'none') issues.push('wrong face/weight/synthesis');
        if (el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1) issues.push('headline box overflow');
        return issues.map(issue => ({text:el.textContent, issue}));
      }), family);
      expect(failures).toEqual([]);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      expect(await page.locator('body').evaluate(el => getComputedStyle(el).fontFamily)).not.toContain(family);
      for (const label of await page.locator('.eyebrow, .read, .siteNav a, .articleBody p').all()) {
        expect(await label.evaluate(el => getComputedStyle(el).fontFamily)).not.toContain(family);
      }
      await testInfo.attach('viewport', {body:await page.screenshot(), contentType:'image/png'});
    });
  }
}
