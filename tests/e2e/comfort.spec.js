import { test, expect } from '@playwright/test';
import { activateTab, openDemo, expectNoPageOverflow } from './helpers.js';

const agendaDates = page =>
  page.evaluate(() =>
    window.__EXTRATO_TEST__
      .getState()
      .reviewAgenda.filter(item => item.id.startsWith('late-'))
      .map(item => item.date)
  );

test('redistribuir atrasadas mostra prévia sem salvar, confirma e permite desfazer', async ({
  page,
}) => {
  await page.clock.install({ time: new Date('2026-11-02T12:00:00-03:00') });
  await page.goto('/?test=1');
  await expect(page.locator('#testReport')).toBeVisible();
  await page.locator('#testReport').evaluate(node => node.remove());
  await page.evaluate(() => {
    const api = window.__EXTRATO_TEST__,
      state = structuredClone(api.getState());
    state.subjects = [{ id: 'rs', name: 'Português', archived: false, topics: [{ id: 'rt', name: 'Crase', status: 'Concluído', archived: false }] }];
    // One hour a day = 3 reviews; Sunday without study.
    state.metas.horasPorDia = { 0: 0, 1: 1, 2: 1, 3: 1, 4: 1, 5: 1, 6: 1 };
    state.reviewAgenda = ['2026-10-20', '2026-10-21', '2026-10-22', '2026-10-23'].map((date, i) => ({
      id: `late-${i}`,
      subjectId: 'rs',
      topicId: 'rt',
      date,
      status: 'Não iniciado',
      tipo: 'Revisão 7 dias',
    }));
    const validation = api.validateBackupData(state);
    if (!validation.valid) throw Error(validation.message);
    api.setState(validation.normalized);
    api.renderAll();
  });
  await activateTab(page, 'agenda');
  const before = await agendaDates(page);
  await page.getByRole('button', { name: 'Redistribuir 4 revisões atrasadas' }).click();
  const preview = page.locator('.review-redistribution');
  await expect(preview).toContainText('Nada foi alterado ainda');
  await expect(preview).toContainText('4 revisões vão para 2 dias');
  expect(await agendaDates(page)).toEqual(before);
  await expectNoPageOverflow(page);
  await preview.getByRole('button', { name: 'Confirmar redistribuição' }).click();
  await expect.poll(() => agendaDates(page)).toEqual(['2026-11-02', '2026-11-02', '2026-11-02', '2026-11-03']);
  await page.getByRole('button', { name: 'Desfazer' }).click();
  await expect.poll(() => agendaDates(page)).toEqual(before);
});

test('Hoje mostra a constância de 4 semanas e a densidade compacta fica lembrada', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await openDemo(page);
  await activateTab(page, 'hoje');
  const strip = page.locator('#todayConsistency');
  await expect(strip.getByRole('img', { name: /^Constância: \d+ de 28 dias com estudo$/ })).toBeVisible();
  await expect(strip.locator('.consistency-strip__day')).toHaveCount(28);
  await expectNoPageOverflow(page);

  const density = page.locator('#densityToggleBtn');
  await expect(density).toHaveAttribute('aria-pressed', 'false');
  await density.click();
  await expect(page.locator('html')).toHaveAttribute('data-density', 'compact');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-density', 'compact');
  await expect(page.locator('#densityToggleBtn')).toHaveAttribute('aria-pressed', 'true');
});

test('transições curtas somem com prefers-reduced-motion', async ({ page }) => {
  await page.goto('/');
  const duration = () =>
    page.locator('.tab-btn').first().evaluate(node => getComputedStyle(node).transitionDuration);
  expect(await duration()).toMatch(/0\.16s/);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  expect(await duration()).not.toMatch(/0\.16s/);
  expect((await duration()).split(',').every(value => parseFloat(value) === 0)).toBe(true);
});
