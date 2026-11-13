import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('landing apresenta recortes da demonstração e acesso ao aplicativo', async ({ page }) => {
  for (const width of [320, 390, 768, 820, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/landing.html');
    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: 'Pular para o conteúdo' })).toBeFocused();
    await expect(page.getByRole('heading', { name: 'Seu estudo merece um plano.' })).toBeVisible();
    const nav = page.getByRole('navigation', { name: 'Navegação principal' });
    for (const link of await nav.getByRole('link').all()) {
      if (await link.isVisible()) {
        expect(await link.evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBeTruthy();
      }
    }
    await expect(page.getByRole('link', { name: /Começar grátis/ }).first()).toHaveAttribute(
      'href',
      '/app'
    );
    await expect(page.getByText('Dados fictícios da demonstração').first()).toBeVisible();
    const journey = page.locator('#como-funciona');
    await expect(journey.getByRole('heading', { level: 3 })).toHaveText([
      'Planeje e ajuste sua semana',
      'Saiba o que fazer hoje',
      'Entenda sua evolução',
    ]);
    expect(
      await journey
        .locator('img')
        .evaluateAll(images => new Set(images.map(image => image.src)).size)
    ).toBe(3);
    for (const image of await page.locator('img[src*="/assets/landing/demo-"]').all()) {
      await image.scrollIntoViewIfNeeded();
      await expect(image).toBeVisible();
      expect(await image.evaluate(el => el.complete && el.naturalWidth > 0)).toBeTruthy();
    }
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)
    ).toBeTruthy();
    if (width === 390 || width === 1440) {
      expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    }
  }
});

test('landing separada abre /app sem alterar dados armazenados', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/landing.html');
  await page.evaluate(() => {
    localStorage.setItem('route-preservation-test', 'preservado');
    localStorage.setItem('bb-premium-theme', 'dark');
  });
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await expect(page.getByRole('heading', { name: 'Seu estudo merece um plano.' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Extrato de Estudos', exact: true })).toHaveCount(
    0
  );
  const wordmark = page.locator('.landing-wordmark');
  await wordmark.scrollIntoViewIfNeeded();
  await expect(wordmark).toHaveAttribute('data-reveal', 'shown');
  await wordmark.hover({ position: { x: 30, y: 20 } });
  const spotlight = wordmark.locator('.landing-wordmark-light');
  await expect(spotlight).toHaveCSS('opacity', '1');
  await expect
    .poll(() => wordmark.evaluate(node => parseFloat(node.style.getPropertyValue('--spot-x'))))
    .toBeCloseTo(30, 0);
  await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
  await expect(page.locator('.landing-hero-visual')).toHaveCSS('animation-name', 'none');
  await expect(spotlight).toHaveCSS('display', 'none');
  await page
    .getByRole('navigation', { name: 'Navegação do rodapé' })
    .getByRole('link', { name: 'Planos' })
    .click();
  await expect(page).toHaveURL(/#precos$/);
  const pricing = page.getByRole('region', { name: 'Planos e preços' });
  const free = pricing
    .locator('article')
    .filter({ has: page.getByRole('heading', { name: 'Gratuito' }) });
  const pro = pricing
    .locator('article')
    .filter({ has: page.getByRole('heading', { name: 'Pro', exact: true }) });
  await expect(free).toContainText('Disponível agora');
  await expect(free).toContainText('Exporte um backup');
  await expect(pro).toContainText('Em preparação');
  await expect(pro).toContainText('Ainda não disponível para contratação');
  await expect(pro.getByRole('link')).toHaveCount(0);
  await expect(pro.getByRole('group', { name: 'Ciclo do plano Pro' })).toBeVisible();
  await expect(pricing).toContainText('R$ 178,80 por ano à vista no Pix');
  const monthly = pricing.getByRole('button', { name: 'Mensal' });
  await monthly.press('Enter');
  await expect(monthly).toHaveAttribute('aria-pressed', 'true');
  await expect(pricing).toContainText('R$ 19,90');
  await expect(pricing).not.toContainText('R$ 178,80');
  await page
    .getByRole('link', { name: /Abrir aplicativo/i })
    .first()
    .click();
  await expect(page).toHaveURL(/\/app$/);
  await expect(page.locator('#mainContent')).toBeAttached();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  expect(await page.evaluate(() => localStorage.getItem('route-preservation-test'))).toBe(
    'preservado'
  );
});

test('landing orienta a entrada na demonstração sem alterar registros', async ({ page }) => {
  await page.goto('/landing.html');
  await expect(page.getByText(/na tela inicial ou no rodapé/)).toBeVisible();
  await page.getByRole('link', { name: 'Conhecer demonstração' }).click();
  await expect(page).toHaveURL(/\/app$/);
  await expect(page.locator('#mainContent')).toBeAttached();
  const before = await page.evaluate(() => localStorage.getItem('bb-premium-study-data'));
  await page.locator('#enterDemoBtn').click();
  await expect(page.locator('#demoIntroDialog')).toBeVisible();
  await page.getByRole('button', { name: 'Carregar demonstração' }).click();
  await expect(page.locator('#demoBanner')).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('bb-premium-study-data'))).toBe(before);
  await page.locator('#exitDemoBtn').click();
  await expect(page.locator('#demoBanner')).toBeHidden();
  expect(await page.evaluate(() => localStorage.getItem('bb-premium-study-data'))).toBe(before);
});

test('instalação antiga que inicia na raiz é encaminhada ao aplicativo', async ({ page }) => {
  await page.addInitScript(() => {
    const original = window.matchMedia.bind(window);
    window.matchMedia = query =>
      query === '(display-mode: standalone)'
        ? { ...original(query), matches: true }
        : original(query);
  });
  await page.goto('/landing.html?origem=instalado#hoje');
  await expect(page).toHaveURL(/\/app\?origem=instalado#hoje$/);
  await expect(page.locator('#mainContent')).toBeAttached();
});

test('aplicativo em /app abre offline após atualização do service worker', async ({
  page,
  context,
}) => {
  await page.goto('/app');
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator('#mainContent')).toBeVisible();
  await page.goto('/app/');
  await expect(page).toHaveURL(/\/app$/);
  await expect(page.locator('#mainContent')).toBeVisible();
  await context.setOffline(false);
});

test('expõe manifest instalável com ícones completos', async ({ page }) => {
  await page.goto('/');
  const manifestHref = await page.locator('link[rel="manifest"]').getAttribute('href');
  const manifest = await page.evaluate(async href => (await fetch(href)).json(), manifestHref);
  expect(manifest.start_url).toBe('/app');
  expect(manifest.icons).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ sizes: '192x192', purpose: 'any' }),
      expect.objectContaining({ sizes: '512x512', purpose: 'any' }),
      expect.objectContaining({ sizes: '512x512', purpose: 'maskable' }),
    ])
  );
  for (const icon of manifest.icons)
    expect((await page.request.get(new URL(icon.src, page.url()).href)).ok()).toBe(true);
});

test('abre a aplicação offline depois de instalar o service worker', async ({ page, context }) => {
  await page.goto('/');
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
  await context.setOffline(true);
  await page.reload();
  await expect(page).toHaveTitle(/Extrato de Estudos/);
  await expect(page.locator('#mainContent')).toBeVisible();
  await context.setOffline(false);
});

test('remove caches antigos ao ativar a versão atual', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(async () => {
    await caches.open('studytrack-v5');
    const registration = await navigator.serviceWorker.ready;
    await registration.unregister();
  });
  await page.reload();
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.waitForFunction(async () => !(await caches.keys()).includes('studytrack-v5'));
  expect(await page.evaluate(() => caches.keys())).not.toContain('studytrack-v5');
});

test('troca CSS e bundle da versão A pela B sem perder dados locais', async ({ page }) => {
  const holdAutomaticUpdate = route =>
    route.fulfill({ status: 200, contentType: 'text/javascript', body: '' });
  await page.route('**/src/pwa.js', holdAutomaticUpdate);
  await page.goto('/?test=1');
  await expect(page.locator('#testReport')).toBeVisible();
  await page.evaluate(async () => {
    const api = window.__EXTRATO_TEST__;
    await api.settleSaves();
    const state = structuredClone(api.getState());
    state.subjects[0].name = 'Dados preservados no upgrade PWA';
    state.updatedAt = '2099-01-01T12:00:00.000Z';
    api.setState(state);
    await new Promise((resolve, reject) => {
      const request = indexedDB.deleteDatabase('extrato-estudos-db');
      request.onsuccess = resolve;
      request.onerror = () => reject(request.error);
      request.onblocked = resolve;
    });
    localStorage.setItem('bb-premium-study-data', JSON.stringify(state));
    await navigator.serviceWorker.register('/test-service-worker-version-a.js', { scope: '/' });
  });
  await page.waitForFunction(() =>
    navigator.serviceWorker.controller?.scriptURL.endsWith('/test-service-worker-version-a.js')
  );
  await page.goto('/');
  // O progresso por disciplina fica num bloco recolhível da Visão Geral: basta o rótulo existir para provar que os dados sobreviveram.
  await expect(page.getByTitle('Dados preservados no upgrade PWA')).toBeAttached();
  const assets = await page
    .locator('link[href^="styles/app.css"],script[src^="src/app.bundle.js"]')
    .evaluateAll(elements => elements.map(element => new URL(element.href || element.src).href));
  expect(assets).toHaveLength(2);
  for (const asset of assets)
    expect(
      await page.evaluate(
        async url => (await (await fetch(url)).text()).includes('studytrack-test-version-a'),
        asset
      )
    ).toBe(true);

  await page.unroute('**/src/pwa.js', holdAutomaticUpdate);
  await page.evaluate(() => navigator.serviceWorker.register('/service-worker.js', { scope: '/' }));
  await page.waitForFunction(() =>
    navigator.serviceWorker.controller?.scriptURL.endsWith('/service-worker.js')
  );
  await page.reload();
  await expect(page.getByTitle('Dados preservados no upgrade PWA')).toBeAttached();
  const result = await page.evaluate(
    async urls => ({
      cacheNames: await caches.keys(),
      assets: await Promise.all(
        urls.map(async url => ({
          url,
          oldMarker: (await (await fetch(url)).text()).includes('studytrack-test-version-a'),
        }))
      ),
      persisted: JSON.parse(localStorage.getItem('bb-premium-study-data'))?.subjects?.[0]?.name,
    }),
    assets
  );
  expect(result.cacheNames).not.toContain('studytrack-test-version-a');
  expect(result.cacheNames.some(name => /^studytrack-[a-f0-9]+$/.test(name))).toBe(true);
  expect(result.assets.every(asset => !asset.oldMarker)).toBe(true);
  expect(result.persisted).toBe('Dados preservados no upgrade PWA');
});

test('atalhos do app instalado abrem o cronômetro em Hoje e o registro de questões', async ({
  page,
}) => {
  await page.goto('/');
  const manifestHref = await page.locator('link[rel="manifest"]').getAttribute('href');
  const manifest = await page.evaluate(async href => (await fetch(href)).json(), manifestHref);
  expect(manifest.shortcuts.map(item => item.name)).toEqual([
    'Iniciar estudo',
    'Registrar questões',
  ]);
  for (const [shortcut, panel] of [
    [manifest.shortcuts[0], '#panel-hoje #study-timer'],
    [manifest.shortcuts[1], '#panel-questoes'],
  ]) {
    await page.goto(new URL(shortcut.url, page.url()).href);
    await page.reload();
    await expect(page.locator(panel)).toBeVisible();
  }
});

test('demonstração carregada sob demanda abre offline depois da primeira visita (F11)', async ({
  page,
  context,
}) => {
  await page.goto('/');
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
  // The first visit never requested the demo chunk: it must come from the precache.
  await context.setOffline(true);
  await page
    .getByRole('button', { name: /Explorar demonstração/i })
    .first()
    .click();
  await page.getByRole('button', { name: 'Carregar demonstração' }).click();
  await expect(
    page.locator('#demoBanner').getByText('MODO DEMONSTRAÇÃO', { exact: true })
  ).toBeVisible({
    timeout: 15_000,
  });
  await context.setOffline(false);
});

test('pedaço da demonstração usa a mesma versão do app e está no pré-cache (F11)', async ({
  page,
}) => {
  await page.goto('/');
  const version = new URL(
    await page.locator('script[src^="src/app.bundle.js"]').evaluate(element => element.src)
  ).searchParams.get('v');
  const worker = await (await page.request.get('/service-worker.js')).text();
  expect(worker).toContain(`./src/demo.bundle.js?v=${version}`);
  expect(worker).toContain(`studytrack-${version}`);
  const chunk = page.waitForRequest(request => request.url().includes('/src/demo.bundle.js'));
  await page
    .getByRole('button', { name: /Explorar demonstração/i })
    .first()
    .click();
  await page.getByRole('button', { name: 'Carregar demonstração' }).click();
  expect(new URL((await chunk).url()).searchParams.get('v')).toBe(version);
});
