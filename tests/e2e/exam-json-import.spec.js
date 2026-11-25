import { test, expect } from '@playwright/test';
import {
  activateTab,
  expectNoPageOverflow,
  openPerformanceFold,
  openPerformanceSection,
} from './helpers.js';

test('importa JSON com prévia, decisão explícita e reimportação idempotente', async ({ page }) => {
  await page.goto('/?test=1');
  await expect(page.locator('#testReport')).toBeVisible();
  await page.locator('#testReport').evaluate(element => element.remove());
  await page.evaluate(() => {
    const api = window.__EXTRATO_TEST__,
      state = structuredClone(api.getState());
    state.examBlueprint.activeExamTags = ['bb-escriturario'];
    api.setState(state);
    api.renderAll();
  });
  const state = await page.evaluate(() => window.__EXTRATO_TEST__.getState());
  const subject = state.subjects[0],
    topic = subject.topics[0];
  const data = JSON.stringify({
    exam: {
      institution: 'Banco do Brasil',
      examName: 'Escriturário 2023',
      role: 'Escriturário',
      board: 'Cesgranrio',
      year: 2023,
      coverage: 'complete',
    },
    questions: [
      { number: 1, subject: subject.name, topic: topic.name },
      { number: 2, subject: subject.name, topic: 'Tópico novo' },
    ],
  });
  await activateTab(page, 'desempenho');
  await openPerformanceSection(page, 'exam');
  // A importação mora na dobra "Adicionar evidências", fechada por padrão.
  await openPerformanceFold(page, 'Adicionar evidências');
  const upload = () =>
    page.locator('#examJsonFile').setInputFiles({
      name: 'prova.json',
      mimeType: 'application/json',
      buffer: Buffer.from(data),
    });
  await upload();
  await expect(page.locator('#examJsonPreview')).toContainText(
    '2 questões · 1 vinculadas · 1 precisam de decisão'
  );
  await page.setViewportSize({ width: 320, height: 740 });
  await expectNoPageOverflow(page);
  await page.locator('#examJsonConfirm').click();
  await expect(page.locator('#examJsonPreview')).toContainText('2 questões · 1 vinculadas');
  expect((await page.evaluate(() => window.__EXTRATO_TEST__.getState().exams)).length).toBe(0);
  await page.locator('[data-exam-decision="2"]').selectOption('create');
  await page.locator('[data-exam-create="2"]').selectOption(subject.id);
  await page.locator('#examJsonConfirm').click();
  await expect
    .poll(() => page.evaluate(() => window.__EXTRATO_TEST__.getState().examQuestions.length))
    .toBe(2);
  await upload();
  await expect(page.locator('#examJsonPreview')).toContainText('2 já cadastradas');
  await page.locator('#examJsonConfirm').click();
  const counts = await page.evaluate(() => {
    const state = window.__EXTRATO_TEST__.getState();
    return {
      exams: state.exams.length,
      questions: state.examQuestions.length,
      topics: state.subjects[0].topics.length,
      tags: state.exams[0].examTags,
    };
  });
  expect(counts).toEqual({ exams: 1, questions: 2, topics: 2, tags: ['bb-escriturario'] });
  await expect(page.locator('#examJsonPreview .context-note--success')).toContainText(
    'Prova importada'
  );
  await page.locator('#examJsonFile').setInputFiles({
    name: 'invalida.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{'),
  });
  await expect(page.locator('#examJsonPreview .context-note--attention')).toContainText(
    'Não foi possível importar'
  );
  await expectNoPageOverflow(page);
});

test('conta uma prova anterior por tópico sem arquivo JSON', async ({ page }) => {
  await page.goto('/?test=1');
  await expect(page.locator('#testReport')).toBeVisible();
  await page.locator('#testReport').evaluate(element => element.remove());
  await page.evaluate(() => {
    const api = window.__EXTRATO_TEST__,
      state = structuredClone(api.getState());
    state.examBlueprint.activeExamTags = ['bb-escriturario'];
    api.setState(state);
    api.renderAll();
  });
  await activateTab(page, 'desempenho');
  await openPerformanceSection(page, 'exam');
  await openPerformanceFold(page, 'Adicionar evidências');
  await page.locator('#examCountStart').click();
  await page.locator('#examCountInstitution').fill('Banco do Brasil');
  await page.locator('#examCountRole').fill('Escriturário');
  await page.locator('#examCountBoard').fill('Cesgranrio');
  await page.locator('#examCountYear').fill('2023');
  await page.locator('.exam-count-subject summary').first().click();
  await page.locator('[data-exam-count]').first().fill('3');
  await expect(page.locator('#examCountSum')).toHaveText('3 questões contadas.');
  await page.setViewportSize({ width: 320, height: 740 });
  await expectNoPageOverflow(page);
  await page.getByRole('button', { name: 'Registrar prova' }).click();
  await expect(page.locator('#examCountForm')).toContainText('Ela já entra na incidência.');
  const saved = await page.evaluate(() => {
    const state = window.__EXTRATO_TEST__.getState();
    return {
      exams: state.exams.map(exam => [exam.board, exam.year, exam.coverage, exam.examTags]),
      questions: state.examQuestions.length,
    };
  });
  expect(saved).toEqual({
    exams: [['Cesgranrio', 2023, 'complete', ['bb-escriturario']]],
    questions: 3,
  });
});
