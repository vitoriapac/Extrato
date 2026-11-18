import { test, expect } from '@playwright/test';
import { activateTab, openDemo, openPerformanceSection } from './helpers.js';

test('T60 e T61: Diagnóstico enxuto, com um primário por card e contador honesto', async ({ page }) => {
  test.setTimeout(180_000);
  await openDemo(page);
  await activateTab(page, 'desempenho');
  await openPerformanceSection(page, 'diagnosis');

  // Contador: diz quantos aparecem e quantos estão ocultos.
  await expect(page.locator('.diagnosis-filters__count')).toContainText(/itens com registro \(\d+ sem registro, ocultos\)/);

  // No máximo 8 disciplinas à vista, o resto sob "Mostrar mais".
  const groups = page.locator('.diagnosis-groups > details:visible, .diagnosis-groups > .diagnosis-group-line:visible');
  expect(await groups.count()).toBeLessThanOrEqual(8);
  await expect(page.locator('[data-progressive-toggle]').filter({ hasText: /Mostrar mais · \+\d+/ }).first()).toBeVisible();

  // Lacuna × impacto: no máximo 5 tópicos.
  expect(await page.locator('.gap-impact__row').count()).toBeLessThanOrEqual(5);

  // Um primário por card: as outras ações só aparecem em "Mais ações".
  const card = page.locator('#diagnosisCenter .diagnostic-row:visible').first();
  await expect(card.getByRole('button', { name: 'Ver evolução' })).toBeHidden();
  await expect(card.getByRole('button', { name: 'Planejar ação' })).toBeHidden();
  await card.locator('.diagnostic-row-more > summary').focus();
  await page.keyboard.press('Enter');
  await expect(card.getByRole('button', { name: 'Ver evolução' })).toBeVisible();
  await expect(card.getByRole('button', { name: 'Planejar ação' })).toBeVisible();

  // Altura do Diagnóstico fechado (era ~3,8 mil px no painel).
  const height = await page.locator('#diagnosisCenter').evaluate(node => node.getBoundingClientRect().height);
  expect(height).toBeLessThan(3200);
});
