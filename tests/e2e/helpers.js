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
  const dimensions=await page.evaluate(()=>({viewport:innerWidth,page:document.documentElement.scrollWidth,tab:document.querySelector('.tab-btn.active')?.dataset.tab,wide:[...document.querySelectorAll('body *')].filter(element=>{const box=element.getBoundingClientRect(),style=getComputedStyle(element);return style.position!=='fixed'&&box.right>innerWidth+2&&box.width>0}).slice(0,8).map(element=>`${element.tagName.toLowerCase()}#${element.id}.${String(element.className).split(' ').slice(0,2).join('.')}`)}));
  expect(dimensions.page,`Aba ${dimensions.tab}; elementos excedentes: ${dimensions.wide.join(', ')}`).toBeLessThanOrEqual(dimensions.viewport);
}
