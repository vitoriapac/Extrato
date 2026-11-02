import { test, expect } from '@playwright/test';
import { openDemo, activateTab } from './helpers.js';

test('Planejamento mostra uma sub-aba por vez e o link profundo abre a certa', async ({ page }) => {
  await openDemo(page);
  await activateTab(page, 'metas');
  await expect(page.locator('#metasSub-semana')).toBeVisible();
  await expect(page.locator('[data-metas-subpanel]:visible')).toHaveCount(1);

  await page.getByRole('tab', { name: 'Fechamento semanal' }).click();
  await expect(page.locator('#metasSub-fechamento')).toBeVisible();
  await expect(page.locator('#metasSub-semana')).toBeHidden();
  await expect(page).toHaveURL(/#planejamento\/fechamento$/);

  await page.getByRole('tab', { name: 'Fechamento semanal' }).press('ArrowRight');
  await expect(page.getByRole('tab', { name: 'Histórico' })).toBeFocused();
  await expect(page.locator('#metasSub-historico')).toBeVisible();

  await page.reload();
  await expect(page.locator('#metasSub-historico')).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Histórico' })).toHaveAttribute('aria-selected', 'true');
});

test('No celular, a lista de seções troca a sub-aba e saltos revelam a seção escondida', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await openDemo(page);
  await activateTab(page, 'metas');
  await page.locator('#metasSubtabSelect').selectOption('prova');
  await expect(page.locator('#examBlueprintConfig')).toBeVisible();
  await expect(page.locator('#metasSub-semana')).toBeHidden();
  await page.locator('#metasSubtabSelect').selectOption('semana');
  await expect(page.locator('#metasPlanning')).toBeVisible();
  // A link inside one sub-tab that points into another switches to it.
  await page.locator('a[href="#subjectAccuracyGoals"]').first().click();
  await expect(page.locator('#subjectAccuracyGoals')).toBeVisible();
  await expect(page.locator('#metasSubtabSelect')).toHaveValue('metas');
});
