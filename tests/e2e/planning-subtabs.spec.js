import { test, expect } from '@playwright/test';
import { openDemo, activateTab, openPlanningAdjust } from './helpers.js';

test('Planejamento agrupa as seções em blocos recolhíveis e o link profundo abre o certo', async ({
  page,
}) => {
  await openDemo(page);
  await activateTab(page, 'metas');
  await expect(page.locator('#metasSub-semana')).toHaveAttribute('open', '');
  await expect(page.locator('#metasSub-fechamento')).not.toHaveAttribute('open', '');

  await page.getByRole('tab', { name: 'Fechamento semanal', exact: true }).click();
  await expect(page.locator('#metasSub-fechamento')).toHaveAttribute('open', '');
  await expect(page.locator('#metasSub-semana')).not.toHaveAttribute('open', '');
  await expect(page).toHaveURL(/#planejamento\/fechamento$/);

  await page.getByRole('tab', { name: 'Fechamento semanal', exact: true }).press('ArrowRight');
  await expect(page.getByRole('tab', { name: 'Histórico', exact: true })).toBeFocused();
  await expect(page.locator('#metasSub-historico')).toHaveAttribute('open', '');

  await page.reload();
  await expect(page.locator('#metasSub-historico')).toHaveAttribute('open', '');
  await expect(page.getByRole('tab', { name: 'Histórico', exact: true })).toHaveAttribute(
    'aria-selected',
    'true'
  );
});

test('No celular, a lista de seções abre o bloco e saltos revelam a seção recolhida', async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await openDemo(page);
  await activateTab(page, 'metas');
  await page.locator('#metasSubtabSelect').selectOption('prova');
  await expect(page.locator('#examBlueprintConfig')).toBeVisible();
  await page.locator('#metasSubtabSelect').selectOption('semana');
  await expect(page.locator('#metasPlanning')).toBeVisible();
  await openPlanningAdjust(page);
  // Um link dentro de um bloco que aponta para outro abre o destino.
  await page.locator('a[href="#subjectAccuracyGoals"]').first().click();
  await expect(page.locator('#subjectAccuracyGoals')).toBeVisible();
  await expect(page.locator('#metasSubtabSelect')).toHaveValue('metas');
});
