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

test('remove caches antigos ao ativar a versão atual',async({page})=>{await page.goto('/');await page.evaluate(async()=>{await caches.open('studytrack-v5');const registration=await navigator.serviceWorker.ready;await registration.unregister()});await page.reload();await page.evaluate(()=>navigator.serviceWorker.ready);await page.waitForFunction(async()=>!(await caches.keys()).includes('studytrack-v5'));expect(await page.evaluate(()=>caches.keys())).not.toContain('studytrack-v5')});

test('troca CSS e bundle da versão A pela B sem perder dados locais',async({page})=>{
  const holdAutomaticUpdate=route=>route.fulfill({status:200,contentType:'text/javascript',body:''});
  await page.route('**/src/pwa.js',holdAutomaticUpdate);
  await page.goto('/?test=1');
  await expect(page.locator('#testReport')).toBeVisible();
  await page.evaluate(async()=>{
    const api=window.__EXTRATO_TEST__;
    await api.settleSaves();
    const state=structuredClone(api.getState());
    state.subjects[0].name='Dados preservados no upgrade PWA';
    state.updatedAt='2099-01-01T12:00:00.000Z';
    api.setState(state);
    await new Promise((resolve,reject)=>{const request=indexedDB.deleteDatabase('extrato-estudos-db');request.onsuccess=resolve;request.onerror=()=>reject(request.error);request.onblocked=resolve});
    localStorage.setItem('bb-premium-study-data',JSON.stringify(state));
    await navigator.serviceWorker.register('/test-service-worker-version-a.js',{scope:'/'});
  });
  await page.waitForFunction(()=>navigator.serviceWorker.controller?.scriptURL.endsWith('/test-service-worker-version-a.js'));
  await page.goto('/');
  await expect(page.getByTitle('Dados preservados no upgrade PWA')).toBeVisible();
  const assets=await page.locator('link[href^="styles/app.css"],script[src^="src/app.bundle.js"]').evaluateAll(elements=>elements.map(element=>new URL(element.href||element.src).href));
  expect(assets).toHaveLength(2);
  for(const asset of assets)expect(await page.evaluate(async url=>(await(await fetch(url)).text()).includes('studytrack-test-version-a'),asset)).toBe(true);

  await page.unroute('**/src/pwa.js',holdAutomaticUpdate);
  await page.evaluate(()=>navigator.serviceWorker.register('/service-worker.js',{scope:'/'}));
  await page.waitForFunction(()=>navigator.serviceWorker.controller?.scriptURL.endsWith('/service-worker.js'));
  await page.reload();
  await expect(page.getByTitle('Dados preservados no upgrade PWA')).toBeVisible();
  const result=await page.evaluate(async urls=>({
    cacheNames:await caches.keys(),
    assets:await Promise.all(urls.map(async url=>({url,oldMarker:(await(await fetch(url)).text()).includes('studytrack-test-version-a')}))),
    persisted:JSON.parse(localStorage.getItem('bb-premium-study-data'))?.subjects?.[0]?.name
  }),assets);
  expect(result.cacheNames).not.toContain('studytrack-test-version-a');
  expect(result.cacheNames.some(name=>/^studytrack-[a-f0-9]+$/.test(name))).toBe(true);
  expect(result.assets.every(asset=>!asset.oldMarker)).toBe(true);
  expect(result.persisted).toBe('Dados preservados no upgrade PWA');
});
