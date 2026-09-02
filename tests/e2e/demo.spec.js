import {test,expect} from '@playwright/test';
import {openDemo} from './helpers.js';

test('isola, reinicia e encerra a demonstração sem alterar o estado real',async({page})=>{
  await page.goto('/?test=1');
  await expect(page).toHaveTitle(/OK — Testes do Extrato/);
  const realState=await page.evaluate(()=>{
    const state=structuredClone(window.__EXTRATO_TEST__.getState());state.subjects[0].name='Registro real preservado';state.updatedAt='2099-01-01T12:00:00.000Z';
    localStorage.setItem('bb-premium-study-data',JSON.stringify(state));return localStorage.getItem('bb-premium-study-data');
  });
  await openDemo(page);await expect(page.locator('#demoBanner')).toBeVisible();await expect(page.locator('[data-demo-protected]').first()).toBeDisabled();
  const firstDemo=await page.evaluate(()=>sessionStorage.getItem('bb-premium-study-demo'));expect(firstDemo).toBeTruthy();const parsed=JSON.parse(firstDemo);
  expect(parsed.studySessions.length).toBeGreaterThan(80);expect(parsed.simulados.length).toBeGreaterThanOrEqual(9);
  parsed.subjects[0].name='Alteração fictícia';await page.evaluate(value=>sessionStorage.setItem('bb-premium-study-demo',JSON.stringify(value)),parsed);
  await page.getByRole('button',{name:/Reiniciar demo/i}).click();await page.getByRole('button',{name:'Confirmar'}).click();await expect(page.getByText('MODO DEMONSTRAÇÃO')).toBeVisible();
  const restarted=JSON.parse(await page.evaluate(()=>sessionStorage.getItem('bb-premium-study-demo')));expect(restarted.subjects[0].name).not.toBe('Alteração fictícia');
  await page.getByRole('button',{name:/Sair da demonstração/i}).click();await expect(page.getByRole('button',{name:/Explorar demonstração/i})).toBeVisible();
  const restored=JSON.parse(await page.evaluate(()=>localStorage.getItem('bb-premium-study-data')));
  expect(JSON.parse(realState).subjects[0].name).toBe('Registro real preservado');
  expect(restored.subjects[0].name).toBe('Registro real preservado');
  expect(restored.subjects.some(subject=>subject.name==='Alteração fictícia')).toBe(false);
  expect(restored.studySessions.some(session=>String(session.id).startsWith('demo-'))).toBe(false);
  await expect(page.getByTitle('Registro real preservado')).toBeVisible();
});

test('encerra a demo em uma nova sessão do navegador',async({browser})=>{
  const first=await browser.newContext();const page=await first.newPage();await openDemo(page);await first.close();
  const second=await browser.newContext();const next=await second.newPage();await next.goto('/');await expect(next.locator('#demoBanner')).toBeHidden();await second.close();
});
