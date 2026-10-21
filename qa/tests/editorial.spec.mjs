import { readFileSync } from 'node:fs';
import { test, expect, expectImages } from '../helpers/browser.mjs';

const release = JSON.parse(readFileSync(new URL('../editorial-release.json', import.meta.url), 'utf8'));
if (release.schemaVersion !== 1 || release.carousel.length !== 3 || !release.editions.length) throw new Error('Invalid editorial release manifest');
const stories = [release.lead, ...release.carousel];
if (new Set(stories.map(story => story.slug)).size !== 4) throw new Error('Lead/carousel slugs must be unique');
const articlePath = (edition, story) => `${edition.path === '/' ? '' : edition.path}/articles/${story.slug}`;

for (const edition of release.editions) {
  test.describe(edition.id, () => {
    test('homepage lead and three-card integrity', async ({ page }) => {
      const response = await page.goto(edition.path);
      expect(response?.status()).toBe(200);
      const lead = page.locator('section').filter({ has: page.getByRole('heading', { name: release.lead.title, exact: true }) });
      await expect(lead).toHaveCount(1);
      await expect(lead).toBeVisible();
      await expect(lead.getByRole('link').first()).toHaveAttribute('href', articlePath(edition, release.lead));
      const recent = page.getByRole('region', { name: 'Recent stories', exact: true });
      await expect(recent).toBeVisible();
      const cards = recent.locator(':scope > article');
      await expect(cards).toHaveCount(3);
      expect(await cards.locator(':scope > a').evaluateAll(links => links.map(link => link.getAttribute('href'))))
        .toEqual(release.carousel.map(story => articlePath(edition, story)));
      for (let index = 0; index < release.carousel.length; index++) {
        await expect(cards.nth(index).getByRole('heading')).toHaveText(release.carousel[index].title);
        await cards.nth(index).scrollIntoViewIfNeeded();
        await expect(cards.nth(index)).toBeInViewport();
      }
      expect(await lead.evaluate(element => element.nextElementSibling?.getAttribute('aria-label'))).toBe('Recent stories');
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'No document horizontal overflow').toBe(true);
    });

    test('homepage images and CSS backgrounds', async ({ page }, testInfo) => {
      await page.goto(edition.path);
      await expect(page.getByRole('region', { name: 'Recent stories', exact: true })).toBeVisible();
      await expectImages(page, testInfo);
    });

    for (const story of stories) {
      test(`article ${story.slug}`, async ({ page }, testInfo) => {
        const path = articlePath(edition, story);
        const response = await page.goto(path);
        expect(response?.status()).toBe(200);
        expect(new URL(page.url()).pathname).toBe(path);
        await expect(page.getByRole('heading', { level: 1 })).toHaveText(story.title);
        await expect(page.locator('main')).not.toContainText(/Story not found|Sorry, not found|This deployment is protected/i);
        await expect(page.locator('article.articleBody')).toBeVisible();
        expect((await page.locator('article.articleBody').innerText()).length).toBeGreaterThan(200);
        await expectImages(page, testInfo);
      });
    }
  });
}
