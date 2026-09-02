import {test,expect} from '@playwright/test';

test('inicializa e navega pelas áreas principais',async({page})=>{
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto('/?test=1');await expect(page).toHaveTitle(/StudyTrack|OK — Testes do Extrato/);
  for(const name of ['hoje','disciplinas','calendario','agenda','questoes','metas','dashboard']){
    await page.locator(`[data-tab="${name}"]`).evaluate(button=>button.click());
    await expect(page.locator(`#panel-${name}`)).toBeVisible();
  }
  expect(errors).toEqual([]);
});

test('expõe estado de teste isolado com schema atual',async({page})=>{
  await page.goto('/?test=1');
  await expect.poll(()=>page.evaluate(()=>window.__EXTRATO_TEST__?.CURRENT_SCHEMA_VERSION)).toBe(15);
  const state=await page.evaluate(()=>window.__EXTRATO_TEST__.getState());
  expect(state.subjects.length).toBeGreaterThan(0);expect(state.schemaVersion).toBe(15);
});
