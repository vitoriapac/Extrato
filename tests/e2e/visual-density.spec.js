import {test,expect} from '@playwright/test';
import {activateTab,expectNoPageOverflow} from './helpers.js';
import {buildVisualDensityFixture} from '../fixtures/visual-density.js';

const state=buildVisualDensityFixture();

test('auditoria de dados densos e ajuda em 320–430 px, light e dark',async({page})=>{
  test.setTimeout(240_000);
  await page.setViewportSize({width:320,height:800});
  await page.goto('/?test=1');
  await page.locator('#testReport').evaluate(element=>element.remove());
  await page.evaluate(value=>{window.__EXTRATO_TEST__.setState(value);window.__EXTRATO_TEST__.renderAll()},state);
  await expect(page.locator('#statSubjects')).toHaveText(String(state.subjects.length));
  for(const width of [320,375,390,430]){
    await page.setViewportSize({width,height:800});
    for(const theme of ['light','dark']){
      await page.evaluate(value=>{document.documentElement.dataset.theme=value},theme);
      for(const tab of ['dashboard','disciplinas','questoes','metas']){
        await activateTab(page,tab);
        await expectNoPageOverflow(page);
      }
      await page.locator('#moreTabButton').click();
      await expect(page.locator('#mobileMoreMenu')).toBeVisible();
      await page.locator('[data-more-tab="instrucoes"]').click();
      await expect(page.locator('#panel-instrucoes')).toBeVisible();
      await expectNoPageOverflow(page);
    }
    const search=page.locator('#helpSearch');
    await search.fill('impacto');
    await expect(page.locator('#helpSearchStatus')).toContainText('assuntos encontrados');
    await expect(search).toBeInViewport();
    expect(await page.locator('.help-category-nav').evaluate(element=>getComputedStyle(element).position)).toBe('static');
    await search.fill('palavra-sem-correspondencia-visual');
    await expect(page.locator('#helpNoResults')).toBeVisible();
    await page.locator('#helpSearchClear').click();
    await page.locator('[data-help-category="guide-data"]').click();
    await expect(page.locator('#guide-data')).toBeInViewport();
    const positions=await page.evaluate(()=>({
      group:document.getElementById('guide-data').getBoundingClientRect().top,
      shell:document.querySelector('.sticky-shell').getBoundingClientRect().bottom,
      nav:document.querySelector('.help-category-nav').getBoundingClientRect().bottom
    }));
    expect(positions.group).toBeGreaterThanOrEqual(positions.nav-2);
    expect(positions.nav).toBeGreaterThanOrEqual(positions.shell-2);
    await expectNoPageOverflow(page);
  }
});

test('cabeçalhos analíticos com dados densos em desktop',async({page})=>{
  await page.setViewportSize({width:1440,height:900});
  await page.goto('/?test=1');
  await page.locator('#testReport').evaluate(element=>element.remove());
  await page.evaluate(value=>{window.__EXTRATO_TEST__.setState(value);window.__EXTRATO_TEST__.renderAll()},state);
  await expect(page.locator('#statSubjects')).toHaveText(String(state.subjects.length));
  await activateTab(page,'dashboard');
  await expect(page.locator('.intelligence-column > .analytics-card > .module-heading')).toHaveCount(6);
  await activateTab(page,'agenda');
  await expect(page.locator('#panel-agenda > .module-heading')).toBeVisible();
  await activateTab(page,'questoes');
  await expect(page.locator('#panel-questoes > .module-heading')).toHaveCount(2);
  await activateTab(page,'metas');
  await expect(page.locator('#metasCapacity > .module-heading')).toBeVisible();
  await expect(page.locator('#metasPlanning > .module-heading')).toBeVisible();
  await expect(page.locator('#panel-metas .exam-intelligence-hub')).toHaveCount(0);
  await expectNoPageOverflow(page);
});
