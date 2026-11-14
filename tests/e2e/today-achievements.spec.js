import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { activateTab, openDemo, openAchievements, expectNoPageOverflow } from './helpers.js';

test('Hoje tem a subaba Conquistas; o plano é o padrão e a URL acompanha', async ({ page }) => {
  await openDemo(page);
  await activateTab(page, 'hoje');
  const tabs = page.getByRole('tablist', { name: 'Seções de Hoje' });
  await expect(tabs.getByRole('tab')).toHaveText(['Plano de hoje', 'Conquistas']);
  await expect(page.locator('#todaySub-hoje')).toBeVisible();
  await expect(page.locator('#todaySub-conquistas')).toBeHidden();

  await tabs.getByRole('tab', { name: 'Conquistas' }).click();
  await expect(page.locator('#todaySub-conquistas')).toBeVisible();
  await expect(page.locator('#todaySub-hoje')).toBeHidden();
  await expect(page.locator('#badgesGrid .badge-card.unlocked').first()).toBeVisible();
  await expect(page).toHaveURL(/#hoje\/conquistas$/);

  await tabs.getByRole('tab', { name: 'Plano de hoje' }).click();
  await expect(page.locator('#todaySub-hoje')).toBeVisible();
  await expect(page).toHaveURL(/#hoje$/);
});

test('conquistas desbloqueadas mostram a data salva', async ({ page }) => {
  await openDemo(page);
  await openAchievements(page);
  const dates = page.locator('#badgesGrid .badge-card.unlocked .badge-date');
  await expect(dates.first()).toBeVisible();
  await expect(dates.first()).toHaveText(/^Desbloqueada (em|antes de) \d{2}\/\d{2}\/\d{4}$/);
});

test('o endereço antigo #desempenho/history leva à subaba Conquistas de Hoje', async ({ page }) => {
  await openDemo(page);
  await page.evaluate(() => {
    window.location.hash = '#desempenho/history';
  });
  await expect(page.locator('#todaySub-conquistas')).toBeVisible();
  await expect(page).toHaveURL(/#hoje\/conquistas$/);
});

test('uma URL colada em #hoje/conquistas abre a subaba direto', async ({ page }) => {
  await openDemo(page);
  await page.goto('/#hoje/conquistas');
  await expect(page.locator('#todaySub-conquistas')).toBeVisible();
});

test('Desempenho não tem mais a aba Conquistas e continua sem perder o extrato de sessões', async ({
  page,
}) => {
  await openDemo(page);
  await activateTab(page, 'desempenho');
  await expect(page.locator('[data-performance-section="history"]')).toHaveCount(0);
  await expect(page.locator('[data-performance-group="history"]')).toHaveCount(0);
  await page.locator('[data-performance-section="consistency"]').evaluate(node => node.click());
  await expect(page.locator('#desempenho-study')).toBeAttached();
  await page.locator('[data-performance-section="subjects"]').evaluate(node => node.click());
  await expect(page.locator('#progressBars')).toBeAttached();
});

test('subaba de conquistas em 375 px sem rolagem lateral e sem violações de acessibilidade', async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await openDemo(page);
  await openAchievements(page);
  await expectNoPageOverflow(page);
  const accessibility = await new AxeBuilder({ page })
    .include('#todaySub-conquistas')
    .include('#todaySubtabsMount')
    .analyze();
  expect(accessibility.violations).toEqual([]);
});

test('o aviso "Ver conquistas" abre a subaba de Hoje', async ({ page }) => {
  await page.goto('/?test=1');
  await page.locator('#testReport').evaluate(element => element.remove());
  await page.evaluate(() => {
    window.__EXTRATO_TEST__.getState().achievementsBaselined = true;
  });
  await activateTab(page, 'hoje');
  await page.locator('#timerTypeSelect').selectOption('questions');
  await page.locator('#timerStartBtn').click();
  await expect.poll(() => page.locator('#studyTimerDisplay').textContent()).not.toBe('00:00');
  await page.locator('#timerFinishBtn').click();
  await page.locator('#sessionModalResolved').fill('10');
  await page.locator('#sessionModalCorrect').fill('7');
  await page.locator('#sessionModalSaveBtn').click();
  await activateTab(page, 'desempenho');
  await page.locator('#achievementToast').getByRole('button', { name: 'Ver conquistas' }).click();
  await expect(page.locator('#todaySub-conquistas')).toBeVisible();
});

test('o plano de hoje marca uma única atividade que completa uma conquista, sem mudar a ordem', async ({
  page,
}) => {
  await page.clock.install({ time: new Date('2026-10-01T12:00:00-03:00') });
  await page.goto('/?test=1');
  await page.locator('#testReport').evaluate(element => element.remove());
  const seed = async oldSeconds => {
    await page.evaluate(oldSeconds => {
      const api = window.__EXTRATO_TEST__;
      const state = structuredClone(api.getState());
      const subject = state.subjects[0];
      const item = (id, type) => ({
        id,
        subjectId: subject.id,
        topicId: subject.topics[0].id,
        type,
        plannedMinutes: 10,
        executedSeconds: 0,
        status: 'planned',
        sessionIds: [],
      });
      state.dailyPlans = [
        {
          id: 'today',
          date: '2026-10-01',
          availableMinutes: 120,
          plannedMinutes: 20,
          items: [item('daily-first', 'study'), item('daily-second', 'questions')],
        },
      ];
      state.studySessions = oldSeconds
        ? [
            {
              id: 'old',
              date: '2026-09-01',
              subjectId: subject.id,
              topicId: null,
              durationSeconds: oldSeconds,
              type: 'study',
            },
          ]
        : [];
      const validation = api.validateBackupData(state);
      if (!validation.valid) throw Error(validation.message);
      api.setState(validation.normalized);
      api.renderAll();
    }, oldSeconds);
    await activateTab(page, 'dashboard');
    await activateTab(page, 'hoje');
  };
  const titles = () =>
    page
      .locator('#planoHojeContent .plano-item-title')
      .evaluateAll(nodes => nodes.map(node => node.textContent.trim()));
  const marks = page.locator('#planoHojeContent [data-achievement-mark]');

  // Longe de qualquer conquista de horas: nenhuma marca.
  await seed(3600);
  await expect(page.locator('#planoHojeContent .plano-item')).toHaveCount(2);
  const before = await titles();
  await expect(marks).toHaveCount(0);

  // 9 h 55 min em dias anteriores: faltam 5 min para "Dez horas"; as duas atividades bastariam.
  await seed(9 * 3600 + 55 * 60);
  await expect(marks).toHaveCount(1);
  await expect(marks).toHaveAttribute('data-achievement-mark', 'hours10');
  await expect(marks).toHaveText('Conclui a conquista Dez horas');
  await expect(
    page.locator('#planoHojeContent .plano-item').first().locator('[data-achievement-mark]')
  ).toHaveCount(1);
  expect(await titles()).toEqual(before);
});
