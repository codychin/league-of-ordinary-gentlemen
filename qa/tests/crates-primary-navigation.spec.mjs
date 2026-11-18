import {test,expect} from '../helpers/browser.mjs';
for(const root of ['', '/sunday-crew','/doge']){
 test(`Crates primary navigation, More, Read/Watch and history ${root||'global'}`,async({page})=>{
  await page.goto(root||'/');
  const mobile=page.viewportSize().width<=760;
  const nav=page.getByRole('navigation',{name:mobile?'App navigation':'Primary navigation'});
  const crates=nav.getByRole('link',{name:mobile?'Crates':'THE CRATES',exact:true});
  await expect(crates).toHaveAttribute('href',root+'/archive');
  await expect(nav.getByRole('link',{name:/^culture$/i})).toHaveCount(0);
  await crates.click();await expect(page).toHaveURL(new RegExp(root+'/archive$'));
  await expect(page.getByRole('heading',{name:'The Crates.',exact:true})).toBeVisible();
  if(mobile){
   await expect(nav).toHaveAttribute('data-active-tab','crates');
   await nav.getByRole('button',{name:'More',exact:true}).click();
   await expect(page.locator('.appMoreLinks').getByRole('link',{name:/crates/i})).toHaveCount(0);
   await page.getByRole('button',{name:'Close more menu'}).click();
  }else{
   await nav.locator('summary').click();await expect(nav.locator('.navMore').getByRole('link',{name:/crates/i})).toHaveCount(0);await nav.locator('summary').click();
  }
  await page.getByRole('link',{name:'Watch',exact:true}).click();await expect(page).toHaveURL(new RegExp(root+'/archive/watch$'));
  if(mobile)await expect(nav).toHaveAttribute('data-active-tab','crates');
  await crates.click();await expect(page).toHaveURL(new RegExp(root+'/archive$'));
  await page.goBack();await expect(page).toHaveURL(new RegExp(root+'/archive/watch$'));
  if(mobile)await expect(nav).toHaveAttribute('data-active-tab','crates');
 });
}
