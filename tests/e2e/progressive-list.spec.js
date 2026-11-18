import { test, expect } from '@playwright/test';

test('listas progressivas: teclado, filtros, atualização e mobile nos dois temas', async ({
  page,
}) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/?test=1');
  await page.locator('#testReport').evaluate(element => element.remove());
  await page.evaluate(() => {
    const root = document.getElementById('gapMapDashboard');
    document.body.append(root);
    root.innerHTML = Array.from(
      { length: 17 },
      (_, index) => `<article class="data-row">Registro ${index + 1}</article>`
    ).join('');
    document.body.insertAdjacentHTML(
      'beforeend',
      `<ol id="auditTopicEvents" class="performance-topic-events">${Array.from({ length: 8 }, (_, index) => `<li>Estado ${index + 1}</li>`).join('')}</ol>`
    );
  });
  const rows = page.locator('#gapMapDashboard > .data-row:visible');
  const button = page.locator('[data-progressive-toggle="gapMapDashboard"]');
  await expect(rows).toHaveCount(5);
  await expect(button).toHaveText('Mostrar mais · +12 ↓');
  await expect(button).toHaveAttribute('aria-controls', 'gapMapDashboard');
  const topicEvents = page.locator('.performance-topic-events > li:visible');
  const eventToggle = page.locator('[data-progressive-toggle="auditTopicEvents"]');
  await expect(eventToggle).toBeVisible();
  await expect(topicEvents).toHaveCount(5);
  await expect(eventToggle).toHaveText('Mostrar mais · +3 ↓');
  await eventToggle.click();
  await expect(topicEvents).toHaveCount(8);
  await eventToggle.click();
  await expect(topicEvents).toHaveCount(5);
  await button.focus();
  await page.keyboard.press('Enter');
  await expect(rows).toHaveCount(17);
  await expect(button).toHaveAttribute('aria-expanded', 'true');
  await page.keyboard.press('Space');
  await expect(rows).toHaveCount(5);
  await expect(button).toBeFocused();
  await button.click();
  await page.keyboard.press('Control+k');
  await page.locator('#globalSearchInput').fill('impacto');
  await page.keyboard.press('Escape');
  await expect(rows).toHaveCount(5);
  await page.evaluate(() => {
    const root = document.getElementById('gapMapDashboard');
    [...root.children].slice(5).forEach(item => item.remove());
  });
  await expect(button).toHaveCount(0);
  await page.evaluate(() =>
    document
      .getElementById('gapMapDashboard')
      .insertAdjacentHTML('beforeend', '<article class="data-row">Registro 6</article>')
  );
  await expect(button).toHaveText('Mostrar mais · +1 ↓');
  for (const width of [320, 375, 390, 430, 768, 1024, 1440])
    for (const theme of ['light', 'dark']) {
      await page.setViewportSize({ width, height: 800 });
      await page.evaluate(value => (document.documentElement.dataset.theme = value), theme);
      await expect(button).toBeVisible();
      expect(
        await button.evaluate(element => element.getBoundingClientRect().width)
      ).toBeLessThanOrEqual(width);
    }
  expect(errors).toEqual([]);
});

test('listas em páginas (decisões): 10 por página, foco e página mantidos ao atualizar', async ({
  page,
}) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/?test=1');
  await page.locator('#testReport').evaluate(element => element.remove());
  await page.evaluate(() => {
    const root = document.getElementById('decisionHistoryDashboard');
    document.body.append(root);
    root.innerHTML = Array.from(
      { length: 23 },
      (_, index) => `<article class="data-row">Decisão ${index + 1}</article>`
    ).join('');
  });
  const rows = page.locator('#decisionHistoryDashboard > .data-row:visible');
  const nav = page.locator('[data-progressive-pages="decisionHistoryDashboard"]');
  await expect(rows).toHaveCount(10);
  await expect(nav).toContainText('Exibindo 1–10 de 23 decisões');
  await expect(nav.getByRole('button', { name: 'Página anterior' })).toHaveAttribute(
    'aria-disabled',
    'true'
  );
  await nav.getByRole('button', { name: 'Próxima página' }).click();
  await expect(nav).toContainText('Página 2 de 3');
  await expect(rows.first()).toHaveText('Decisão 11');
  await expect(nav.getByRole('button', { name: 'Próxima página' })).toBeFocused();
  await nav.getByRole('button', { name: 'Próxima página' }).click();
  await expect(rows).toHaveCount(3);
  await expect(nav.getByRole('button', { name: 'Próxima página' })).toHaveAttribute(
    'aria-disabled',
    'true'
  );
  // Na última página a seta Próxima fica desabilitada: o foco vai para a página atual.
  await expect(nav.getByRole('button', { name: 'Página 3' })).toBeFocused();
  // Atualizar o conteúdo da lista mantém a página aberta.
  await page.evaluate(() => {
    const root = document.getElementById('decisionHistoryDashboard');
    root.innerHTML = Array.from(
      { length: 25 },
      (_, index) => `<article class="data-row">Decisão ${index + 1}</article>`
    ).join('');
  });
  await expect(nav).toContainText('Página 3 de 3');
  await expect(rows.first()).toHaveText('Decisão 21');
  // Com até 10 itens o rodapé some.
  await page.evaluate(() => {
    const root = document.getElementById('decisionHistoryDashboard');
    [...root.children].slice(10).forEach(item => item.remove());
  });
  await expect(nav).toHaveCount(0);
  await expect(rows).toHaveCount(10);
  expect(errors).toEqual([]);
});

test('lista em páginas com muitas páginas não entra em laço de atualização', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/?test=1');
  await page.locator('#testReport').evaluate(element => element.remove());
  await page.evaluate(() => {
    const root = document.getElementById('decisionHistoryDashboard');
    document.body.append(root);
    root.innerHTML = Array.from(
      { length: 120 },
      (_, index) => `<article class="data-row">Decisão ${index + 1}</article>`
    ).join('');
  });
  const nav = page.locator('[data-progressive-pages="decisionHistoryDashboard"]');
  await expect(nav).toContainText('Exibindo 1–10 de 120 decisões');
  await expect(nav.getByRole('button', { name: 'Página 12' })).toBeVisible();
  // A página continua respondendo: troca de página e a atualização assíncrona terminam.
  await nav.getByRole('button', { name: 'Página 12' }).click();
  await expect(nav).toContainText('Exibindo 111–120 de 120 decisões');
  await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 300)));
  expect(errors).toEqual([]);
});

test('datas atrasadas da Agenda: uma data por item, 10 por página', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/?test=1');
  await page.locator('#testReport').evaluate(element => element.remove());
  await page.evaluate(() => {
    const root = document.getElementById('calAtrasadas');
    document.body.append(root);
    root.innerHTML =
      '<li class="overdue-summary">25 pendências atrasadas</li>' +
      Array.from(
        { length: 25 },
        (_, index) => `<li class="overdue-group"><strong>Data ${index + 1}</strong></li>`
      ).join('');
  });
  const groups = page.locator('#calAtrasadas > .overdue-group:visible');
  const nav = page.locator('[data-progressive-pages="calAtrasadas"]');
  await expect(groups).toHaveCount(10);
  await expect(nav).toContainText('Exibindo 1–10 de 25 datas');
  await expect(page.locator('#calAtrasadas > .overdue-summary')).toBeVisible();
  await nav.getByRole('button', { name: 'Próxima página' }).click();
  await expect(groups.first()).toHaveText('Data 11');
  await nav.getByRole('button', { name: 'Página 3' }).click();
  await expect(groups).toHaveCount(5);
  expect(errors).toEqual([]);
});
