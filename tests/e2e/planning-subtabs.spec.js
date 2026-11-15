import { test, expect } from '@playwright/test';
import { openDemo, activateTab, openPlanningAdjust } from './helpers.js';

test('Planejamento agrupa as seções em blocos recolhíveis e o link profundo abre o certo', async ({
  page,
}) => {
  await openDemo(page);
  await activateTab(page, 'metas');
  await expect(page.locator('#metasSub-semana')).toBeVisible();
  await expect(page.locator('#metasSub-fechamento')).toBeHidden();

  await page.getByRole('tab', { name: 'Fechamento semanal', exact: true }).click();
  await expect(page.locator('#metasSub-fechamento')).toBeVisible();
  await expect(page.locator('#metasSub-semana')).toBeHidden();
  await expect(page).toHaveURL(/#planejamento\/fechamento$/);

  await page.getByRole('tab', { name: 'Fechamento semanal', exact: true }).press('ArrowRight');
  await expect(page.getByRole('tab', { name: 'Histórico', exact: true })).toBeFocused();
  await expect(page.locator('#metasSub-historico')).toBeVisible();

  await page.reload();
  await expect(page.locator('#metasSub-historico')).toBeVisible();
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
  await expect(page.locator('#metasSubtabSelect')).toHaveValue('prova');
});

test('Planejamento tem 4 sub-abas, o link antigo de Metas abre Prova e metas e o teclado percorre as 4', async ({
  page,
}) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 1440, height: 900 });
  await openDemo(page);
  await activateTab(page, 'metas');
  const tabs = page.locator('[role="tablist"] [data-metas-subtab]');
  await expect(tabs).toHaveCount(4);
  await expect(tabs).toHaveText([
    'Plano da semana',
    'Prova e metas',
    'Fechamento semanal',
    'Histórico',
  ]);
  await expect(page.locator('#metasSubtabSelect option')).toHaveCount(4);
  // Metas por disciplina e Estimativa de ritmo moram na mesma sub-aba.
  await page.locator('#metasTab-prova').click();
  await expect(page.locator('#subjectAccuracyGoals')).toBeVisible();
  await expect(page.locator('#ritmoContainer')).toBeVisible();
  await expect(page.locator('#metasSub-metas')).toHaveCount(0);
  // Link antigo.
  await page.evaluate(() => {
    location.hash = '#planejamento/semana';
  });
  await page.evaluate(() => {
    location.hash = '#planejamento/metas';
  });
  await expect(page.locator('#metasSub-prova')).toBeVisible();
  // Teclado: setas, Home e End com foco itinerante.
  await page.locator('#metasTab-prova').focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('#metasTab-fechamento')).toBeFocused();
  await page.keyboard.press('End');
  await expect(page.locator('#metasTab-historico')).toBeFocused();
  await page.keyboard.press('Home');
  await expect(page.locator('#metasTab-semana')).toBeFocused();
});
