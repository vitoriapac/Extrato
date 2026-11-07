import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { activateTab, openDemo, openPlanningSubtab } from './helpers.js';

test.describe.configure({ timeout: 60_000 });

async function expectAccessible(page, label, scope) {
  await page.waitForTimeout(400);
  const audit = new AxeBuilder({ page });
  const results = await (scope ? audit.include(scope) : audit).analyze();
  expect(results.violations, label + ' possui violações sérias ou críticas').toEqual([]);
}

for (const [tab, label] of [
  ['dashboard', 'Visão Geral'],
  ['hoje', 'Hoje'],
  ['disciplinas', 'Disciplinas'],
  ['metas', 'Planejamento'],
  ['agenda', 'Agenda'],
  ['questoes', 'Questões e simulados'],
  ['desempenho', 'Desempenho'],
]) {
  test(`não possui violações estruturais em ${label}`, async ({ page }) => {
    await openDemo(page);
    await activateTab(page, tab);
    await expectAccessible(page, label, `#panel-${tab}`);
  });
}

test('mantém estrutura acessível no modo móvel e no modal', async ({ page }) => {
  // Duas auditorias axe completas, incluindo a demo densa, precisam de seu próprio orçamento.
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 375, height: 812 });
  await openDemo(page);
  await expectAccessible(page, 'Modo móvel');
  // On phones the demo actions sit behind the "Opções" button (C4).
  await page.locator('#demoMenuToggle').click();
  await page.getByRole('button', { name: /Reiniciar demo/i }).click();
  await expect(page.locator('#modalOverlay')).toHaveClass(/show/);
  await expectAccessible(page, 'Modal');
  await expect(page.locator('#modalCancelBtn')).toBeFocused();
});

test('áreas centrais mantêm contraste e nomes acessíveis em 320 px no tema escuro', async ({ page }) => {
  test.setTimeout(180_000);
  await page.setViewportSize({ width: 320, height: 850 });
  await openDemo(page);
  await page.evaluate(() => { document.documentElement.dataset.theme = 'dark'; });
  for (const tab of ['dashboard', 'hoje', 'disciplinas', 'metas', 'agenda', 'questoes', 'desempenho']) {
    await activateTab(page, tab);
    const results = await new AxeBuilder({ page }).include(`#panel-${tab}`)
      .withRules(['color-contrast', 'button-name', 'label', 'select-name']).analyze();
    expect(results.violations, `Aba ${tab}`).toEqual([]);
  }
});

test('central de diagnóstico continua acessível quando expandida', async ({ page }) => {
  await openDemo(page);
  await activateTab(page, 'desempenho');
  await page.locator('.today-analysis-details > summary').click();
  await expectAccessible(page, 'Central de diagnóstico expandida', '#panel-hoje');
});

test('configuração estratégica continua acessível quando expandida', async ({ page }) => {
  await openDemo(page);
  await activateTab(page, 'metas');
  await openPlanningSubtab(page, 'prova');
  const disclosure = page.locator('#examBlueprintConfig .exam-subject-config').first();
  if (await disclosure.count()) {
    await disclosure.locator('summary').click();
    await expect(disclosure.locator('.exam-subject-row')).toBeVisible();
    await expectAccessible(page, 'Configuração estratégica expandida', '#examBlueprintConfig');
  }
});
