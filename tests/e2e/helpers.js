import {expect} from '@playwright/test';

export async function openDemo(page){
  await page.goto('/');
  await page.getByRole('button',{name:/Explorar demonstração/i}).click();
  await page.getByRole('button',{name:'Confirmar'}).click();
  await expect(page.getByText('MODO DEMONSTRAÇÃO')).toBeVisible();
}
export async function activateTab(page,name){
  await page.locator(`[data-tab="${name}"]`).evaluate(button=>button.click());
  await expect(page.locator(`#panel-${name}`)).toBeVisible();
}
export async function expectNoPageOverflow(page){
  const dimensions=await page.evaluate(()=>({viewport:innerWidth,page:document.documentElement.scrollWidth}));
  expect(dimensions.page).toBeLessThanOrEqual(dimensions.viewport);
}
