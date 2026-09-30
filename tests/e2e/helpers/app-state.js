import {expect} from '@playwright/test';

export async function waitForAppReady(page){
  await page.waitForLoadState('domcontentloaded');
  await expect(page.locator('#mainContent')).toBeVisible();
  await expect.poll(()=>page.evaluate(()=>document.readyState)).toMatch(/interactive|complete/);
}

export async function waitForImportReady(page){
  await expect(page.locator('.subjects-import-menu summary')).toBeVisible();
  await expect(page.locator('.subjects-import-menu summary')).toBeEnabled();
}

export async function waitForStatePersisted(page,predicate=state=>Boolean(state?.updatedAt)){
  await expect.poll(async()=>predicate(await page.evaluate(()=>window.__EXTRATO_TEST__?.getState()||null))).toBeTruthy();
}

export async function waitForRenderSettled(page,selector){
  const target=page.locator(selector);
  await expect(target).toBeVisible();
  await expect.poll(()=>target.evaluate(element=>`${element.getBoundingClientRect().width}:${element.getBoundingClientRect().height}`)).toBeTruthy();
}
