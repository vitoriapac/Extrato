import {test,expect} from '@playwright/test';

test('expõe manifest instalável com ícones completos',async({page})=>{
  await page.goto('/');
  const manifestHref=await page.locator('link[rel="manifest"]').getAttribute('href');
  const manifest=await page.evaluate(async href=>(await fetch(href)).json(),manifestHref);
  expect(manifest.start_url).toBe('./');
  expect(manifest.icons).toEqual(expect.arrayContaining([
    expect.objectContaining({sizes:'192x192',purpose:'any'}),
    expect.objectContaining({sizes:'512x512',purpose:'any'}),
    expect.objectContaining({sizes:'512x512',purpose:'maskable'})
  ]));
  for(const icon of manifest.icons)expect((await page.request.get(new URL(icon.src,page.url()).href)).ok()).toBe(true);
});

test('abre a aplicação offline depois de instalar o service worker',async({page,context})=>{
  await page.goto('/');
  await page.evaluate(()=>navigator.serviceWorker.ready);
  await page.reload();
  await page.waitForFunction(()=>Boolean(navigator.serviceWorker.controller));
  await context.setOffline(true);
  await page.reload();
  await expect(page).toHaveTitle(/StudyTrack/);
  await expect(page.locator('#mainContent')).toBeVisible();
  await context.setOffline(false);
});

test('remove caches antigos ao ativar a versão atual',async({page})=>{await page.goto('/');await page.evaluate(async()=>{await caches.open('studytrack-v5');const registration=await navigator.serviceWorker.ready;await registration.update()});await page.reload();await page.waitForFunction(async()=>!(await caches.keys()).includes('studytrack-v5'));expect(await page.evaluate(()=>caches.keys())).not.toContain('studytrack-v5')});
