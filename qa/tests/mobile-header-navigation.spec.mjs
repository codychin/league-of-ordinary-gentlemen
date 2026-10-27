import {test,expect} from '@playwright/test';

// Run once; the matrix includes both sides of the shared 760px breakpoint.

for(const root of ['', '/sunday-crew', '/doge']){
  for(const width of [360,390,430,760,761,1440]){
    test(`${root||'LOOG'} navigation at ${width}px`,async({page},testInfo)=>{
      test.skip(testInfo.project.name!=='desktop','Explicit viewport matrix');
      await page.setViewportSize({width,height:900});
      const mobile=width<=760;
      const home=root||'/';
      const top=page.locator('header .siteNav');
      const bottom=page.getByRole('navigation',{name:'App navigation'});
      const check=async()=>{
        await expect(top).toHaveCount(1);
        if(mobile){
          await expect(top).toBeHidden();
          expect(await top.evaluate(e=>e.getBoundingClientRect().height)).toBe(0);
          await expect(bottom).toBeVisible();
          await expect(bottom.getByRole('link')).toHaveCount(4);
          const box=await bottom.boundingBox();
          expect(box.x).toBeGreaterThanOrEqual(0);
          expect(box.x+box.width).toBeLessThanOrEqual(width);
          expect(box.y+box.height).toBeLessThanOrEqual(900);
        }else{
          await expect(top).toBeVisible();
          await expect(bottom).toBeHidden();
        }
      };
      expect((await page.goto(home,{waitUntil:'domcontentloaded'})).status()).toBe(200);
      await check();
      await expect(page.locator('.mast h1')).toBeVisible();
      await expect(page.locator('.utilityMain')).toBeVisible();
      await expect(page.locator('.mast .dek')).toBeVisible();
      if(mobile){
        // Hiding links alone would leave the original bordered menu/spacer.
        const gap=await page.locator('.mast').evaluate(e=>e.parentElement.getBoundingClientRect().bottom-e.getBoundingClientRect().bottom);
        expect(Math.abs(gap)).toBeLessThanOrEqual(1);
        await bottom.getByRole('button',{name:'More',exact:true}).click();
        const more=page.getByRole('complementary',{name:'More and settings'});
        await expect(more).toBeVisible();
        await expect(more.getByRole('link',{name:'Archive',exact:true})).toHaveAttribute('href',root+'/archive');
        await more.getByRole('button',{name:'Close more menu'}).click();
        await expect(more).toBeHidden();
        await bottom.getByRole('link',{name:'Scores',exact:true}).click();
      }else await top.getByRole('link',{name:'SCORES',exact:true}).click();
      await expect(page).toHaveURL(/#scores$/);
      await expect(page.locator('#scores')).toBeVisible();
      await check();
      expect((await page.goto(root+'/articles/maude-nfc-east-declines-winner',{waitUntil:'domcontentloaded'})).status()).toBe(200);
      await check();
      await expect(page.locator('.miniMast')).toBeVisible();
      await expect(page.locator('.articleTitle')).toBeVisible();
      if(root==='/sunday-crew'&&width===390){
        await page.goto(home,{waitUntil:'domcontentloaded'});
        await page.screenshot({path:testInfo.outputPath('sunday-mobile-home.png')});
      }
    });
  }
}
