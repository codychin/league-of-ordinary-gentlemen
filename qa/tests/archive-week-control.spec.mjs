import {test,expect} from '@playwright/test';
import {selectArchiveWeek} from '../../scripts/operations/archive-week-control.mjs';
// Real DOM behavior for the nested label used by WatchCrates. Existing page
// navigation tests also call this helper against the actual application.
test('archive helper selects within games despite nested option names and unrelated controls',async({page})=>{
 await page.setContent(`<label>Week<select id="outside"><option>Other</option></select></label>
 <section aria-labelledby="games-heading"><h2 id="games-heading">The weekly tape.</h2>
 <label>Week<select><option value="10">Week 10</option><option value="9">Week 9</option></select></label>
 <p role="status">Week 10 · 6 videos</p><div id="cards"></div></section>`);
 await page.evaluate(()=>{
  const section=document.querySelector('section'),select=section.querySelector('select');
  const update=()=>{section.querySelector('[role=status]').textContent=`Week ${select.value} · 6 videos`;section.querySelector('#cards').innerHTML=Array.from({length:6},(_,i)=>`<button data-id="week${select.value}-${i}">Watch ${i}</button>`).join('')};
  select.addEventListener('change',update);update();
 });
 const games=page.locator('section[aria-labelledby="games-heading"]');
 await selectArchiveWeek(games,9);
 await expect(games.getByRole('status')).toHaveText('Week 9 · 6 videos');
 expect(await games.getByRole('button',{name:/^Watch /}).evaluateAll(es=>es.map(e=>e.dataset.id))).toEqual(Array.from({length:6},(_,i)=>`week9-${i}`));
 await expect(page.locator('#outside')).toHaveValue('Other');
 await selectArchiveWeek(games,10);await expect(games.getByRole('status')).toHaveText('Week 10 · 6 videos');
});
test('missing or duplicate archive week controls fail explicitly',async({page})=>{
 await page.setContent('<section></section>');const games=page.locator('section');
 await expect(selectArchiveWeek(games,9)).rejects.toThrow('ARCHIVE_WEEK_CONTROL_AMBIGUOUS');
 await games.evaluate(s=>s.innerHTML='<label>Week<select><option>9</option></select></label><label>Week<select><option>9</option></select></label>');
 await expect(selectArchiveWeek(games,9)).rejects.toThrow('ARCHIVE_WEEK_CONTROL_AMBIGUOUS');
 await expect(selectArchiveWeek(games,-1)).rejects.toThrow('ARCHIVE_WEEK_INVALID');
});
