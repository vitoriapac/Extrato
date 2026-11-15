import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {
  activateTab,
  expectNoPageOverflow,
  openPlanningAdjust,
  openPerformanceSection,
} from './helpers.js';

test('grouped goals preserve topic targets and separate hours, routine and accuracy', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto('/?test=1');
  await expect(page.locator('#testReport')).toBeVisible();
  await page.locator('#testReport').evaluate(node => node.remove());
  await activateTab(page, 'metas');
  await openPlanningAdjust(page);
  // Perfil vazio abre no modo Essencial; este teste confere o modo completo, com todas as metas.
  await page.evaluate(() => document.documentElement.removeAttribute('data-essential'));
  const groups = page.locator('#metasContainer');
  for (const name of ['Volume', 'Rotina', 'Resultado'])
    await expect(groups.getByRole('heading', { name, exact: true })).toBeVisible();
  await expect(groups).toContainText('Sugestão inicial editável');
  await expect(groups).not.toContainText('Faltam 5');
  const before = await page.evaluate(() =>
    structuredClone(window.__EXTRATO_TEST__.getState().metas)
  );
  const hours = await page.evaluate(() =>
    structuredClone(window.__EXTRATO_TEST__.getState().metas.horasPorDia)
  );
  await groups.getByRole('spinbutton', { name: 'Tópicos na semana', exact: true }).fill('8');
  await page.keyboard.press('Tab');
  // A meta de tópicos no mês saiu da tela; o dado salvo continua no estado.
  await expect(groups.getByRole('spinbutton', { name: 'Tópicos no mês', exact: true })).toHaveCount(
    0
  );
  const metas = await page.evaluate(() =>
    structuredClone(window.__EXTRATO_TEST__.getState().metas)
  );
  expect(metas.semanal).toBe(8);
  expect(metas.mensal).toBe(before.mensal);
  expect(metas.horasPorDia).toEqual(hours);
  await expect(groups.locator('.goal-group--routine')).toContainText('Meta de Aderência');
  await expect(groups.locator('.goal-group--outcome')).toContainText('Meta de acerto');
  expect(
    (
      await new AxeBuilder({ page })
        .include('#metasContainer')
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze()
    ).violations
  ).toEqual([]);
  await expectNoPageOverflow(page);
  await activateTab(page, 'desempenho');
  await openPerformanceSection(page, 'consistency');
  await expect(page.locator('.adherence-change')).toContainText('O que mudou?');
  await expect(page.locator('.adherence-change')).toContainText('Ainda não há dois períodos');
});
