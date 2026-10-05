import {test,expect} from '@playwright/test';

test('listas progressivas: teclado, filtros, atualização e mobile nos dois temas',async({page})=>{
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto('/?test=1');
  await page.locator('#testReport').evaluate(element=>element.remove());
  await page.evaluate(()=>{
    const root=document.getElementById('gapMapDashboard');document.body.append(root);
    root.innerHTML=Array.from({length:17},(_,index)=>`<article class="data-row">Registro ${index+1}</article>`).join('');
    document.body.insertAdjacentHTML('beforeend',`<ol id="auditTopicEvents" class="performance-topic-events">${Array.from({length:8},(_,index)=>`<li>Estado ${index+1}</li>`).join('')}</ol>`);
  });
  const rows=page.locator('#gapMapDashboard > .data-row:visible');
  const button=page.locator('[data-progressive-toggle="gapMapDashboard"]');
  await expect(rows).toHaveCount(5);
  await expect(button).toHaveText('Mostrar mais · +12 ↓');
  await expect(button).toHaveAttribute('aria-controls','gapMapDashboard');
  const topicEvents=page.locator('.performance-topic-events > li:visible');
  const eventToggle=page.locator('[data-progressive-toggle="auditTopicEvents"]');
  await expect(eventToggle).toBeVisible();
  await expect(topicEvents).toHaveCount(5);
  await expect(eventToggle).toHaveText('Mostrar mais · +3 ↓');
  await eventToggle.click();await expect(topicEvents).toHaveCount(8);
  await eventToggle.click();await expect(topicEvents).toHaveCount(5);
  await button.focus();await page.keyboard.press('Enter');
  await expect(rows).toHaveCount(17);await expect(button).toHaveAttribute('aria-expanded','true');
  await page.keyboard.press('Space');await expect(rows).toHaveCount(5);await expect(button).toBeFocused();
  await button.click();
  await page.locator('#globalSearchInput').fill('impacto');
  await expect(rows).toHaveCount(5);
  await page.evaluate(()=>{const root=document.getElementById('gapMapDashboard');[...root.children].slice(5).forEach(item=>item.remove())});
  await expect(button).toHaveCount(0);
  await page.evaluate(()=>document.getElementById('gapMapDashboard').insertAdjacentHTML('beforeend','<article class="data-row">Registro 6</article>'));
  await expect(button).toHaveText('Mostrar mais · +1 ↓');
  for(const width of [320,375,390,430,768,1024,1440])for(const theme of ['light','dark']){
    await page.setViewportSize({width,height:800});
    await page.evaluate(value=>document.documentElement.dataset.theme=value,theme);
    await expect(button).toBeVisible();
    expect(await button.evaluate(element=>element.getBoundingClientRect().width)).toBeLessThanOrEqual(width);
  }
  expect(errors).toEqual([]);
});
