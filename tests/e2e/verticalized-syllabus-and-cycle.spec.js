import { test, expect } from '@playwright/test';
import { generateDemoData } from '../../src/demo/demo-generator.js';
import { activateTab } from './helpers.js';

async function prepare(page) {
  await page.clock.install({ time: new Date('2026-10-01T12:00:00-03:00') });
  await page.goto('/?test=1');
  await expect(page.locator('#testReport')).toBeVisible();
  await page.locator('#testReport').evaluate(node => node.remove());

  const state = generateDemoData({ today: '2026-10-01' });

  await page.evaluate(state => {
    const api = window.__EXTRATO_TEST__;
    const validation = api.validateBackupData(state);
    if (!validation.valid) throw Error(validation.message);
    api.setState(validation.normalized);
    api.renderAll();
  }, state);

  await activateTab(page, 'disciplinas');
}

test('Edital Verticalizado alterna visão, exibe etapas e permite marcar checklist', async ({
  page,
}) => {
  await prepare(page);

  const toggleBtn = page.locator('#verticalizedSyllabusToggleBtn');
  await expect(toggleBtn).toBeVisible();
  await expect(toggleBtn).toContainText('Edital verticalizado');

  // Alterna para visão de edital verticalizado
  await toggleBtn.click();
  await expect(toggleBtn).toContainText('Visão padrão');

  const mount = page.locator('#verticalizedSyllabusMount');
  await expect(mount).toBeVisible();
  await expect(page.locator('#subjectsContainer')).toBeHidden();

  // Verifica cabeçalhos de etapas (Teoria, Resumo, Lei Seca, Questões)
  await expect(mount).toContainText('Teoria');
  await expect(mount).toContainText('Resumo');
  await expect(mount).toContainText('Lei Seca');
  await expect(mount).toContainText('Questões');

  // Encontra o primeiro checkbox de etapa e clica
  const firstCheckbox = mount.locator('input[type="checkbox"]').first();
  await expect(firstCheckbox).toBeVisible();
  const wasChecked = await firstCheckbox.isChecked();
  await firstCheckbox.click();
  await expect(firstCheckbox).toBeChecked({ checked: !wasChecked });
});

test('Parser de Edital Bruto / PDF analisa e importa disciplinas e tópicos', async ({ page }) => {
  await prepare(page);

  // Alterna para visão de edital verticalizado
  await page.locator('#verticalizedSyllabusToggleBtn').click();
  const mount = page.locator('#verticalizedSyllabusMount');
  await expect(mount).toBeVisible();

  // Abre modal de colar edital
  const pasteBtn = mount.getByRole('button', { name: /Colar Edital/i });
  await expect(pasteBtn).toBeVisible();
  await pasteBtn.click();

  const modal = page.locator('dialog[open]');
  await expect(modal).toBeVisible();
  await expect(modal).toContainText('Colar Conteúdo Programático do Edital (PDF)');

  // Digita conteúdo em formato de edital
  const textarea = modal.locator('textarea');
  await textarea.fill(`DIREITO PENAL
1 Conceito de crime. 2 Tipicidade e ilicitude. 3 Culpabilidade e causas de exclusão.`);

  // Clica em analisar
  const parseBtn = modal.getByRole('button', { name: /Analisar Texto/i });
  await parseBtn.click();

  // Verifica que o resumo da análise apareceu no modal
  await expect(modal).toContainText('DIREITO PENAL (3 tópicos)');

  // Confirma importação
  const importConfirmBtn = modal.getByRole('button', { name: /Confirmar e Criar Tópicos/i });
  await importConfirmBtn.click();

  // Modal fecha e nova disciplina deve constar no estado
  await expect(modal).not.toBeVisible();

  const state = await page.evaluate(() => window.__EXTRATO_TEST__.getState());
  const penal = state.subjects.find(s => s.name === 'DIREITO PENAL');
  expect(penal).toBeTruthy();
  expect(penal.topics.length).toBe(3);
});

test('Ciclo flexível e cronobiologia estão disponíveis no motor e avaliam fadiga', async ({
  page,
}) => {
  await prepare(page);

  const evaluation = await page.evaluate(() => {
    const api = window.__EXTRATO_TEST__;
    const queue = api.buildStudyCycleQueue({
      subjects: [
        { id: 's1', name: 'Português' },
        { id: 's2', name: 'Matemática' },
      ],
      subjectWeights: { s1: 3, s2: 1 },
    });
    const block1 = api.getCurrentCycleBlock(queue);
    const { cycle: advanced, completedLap } = api.advanceStudyCycleQueue(queue);

    const energyDiagnostic = api.analyzeFocusAndEnergy([
      // Manhã: alto rendimento (90%)
      {
        id: '1',
        date: '2026-10-01',
        startedAt: '2026-10-01T09:00:00Z',
        durationSeconds: 3600,
        focusLevel: 'deep',
        energyLevel: 'high',
        questionsResolved: 20,
        questionsCorrect: 18,
      },
      {
        id: '2',
        date: '2026-10-02',
        startedAt: '2026-10-02T09:00:00Z',
        durationSeconds: 3600,
        focusLevel: 'deep',
        energyLevel: 'high',
        questionsResolved: 20,
        questionsCorrect: 18,
      },
      {
        id: '3',
        date: '2026-10-03',
        startedAt: '2026-10-03T09:00:00Z',
        durationSeconds: 3600,
        focusLevel: 'deep',
        energyLevel: 'high',
        questionsResolved: 20,
        questionsCorrect: 18,
      },
      // Noite: fadiga e queda de acerto (55%)
      {
        id: '4',
        date: '2026-10-01',
        startedAt: '2026-10-01T21:00:00Z',
        durationSeconds: 3600,
        focusLevel: 'distracted',
        energyLevel: 'low',
        questionsResolved: 20,
        questionsCorrect: 11,
      },
      {
        id: '5',
        date: '2026-10-02',
        startedAt: '2026-10-02T21:00:00Z',
        durationSeconds: 3600,
        focusLevel: 'distracted',
        energyLevel: 'low',
        questionsResolved: 20,
        questionsCorrect: 11,
      },
      {
        id: '6',
        date: '2026-10-03',
        startedAt: '2026-10-03T21:00:00Z',
        durationSeconds: 3600,
        focusLevel: 'distracted',
        energyLevel: 'low',
        questionsResolved: 20,
        questionsCorrect: 11,
      },
    ]);

    return {
      queueLength: queue.blocks.length,
      block1Subject: block1?.subjectName,
      advancedIndex: advanced.currentBlockIndex,
      completedCycle: completedLap,
      fatigueAlert: energyDiagnostic.fatigueAlert,
    };
  });

  expect(evaluation.queueLength).toBe(4);
  expect(evaluation.block1Subject).toBe('Português');
  expect(evaluation.advancedIndex).toBe(1);
  expect(evaluation.completedCycle).toBe(false);
  expect(evaluation.fatigueAlert).toContain('Queda de 35 p.p.');
});
