import { test, expect } from '@playwright/test';
import { generateDemoData } from '../../src/demo/demo-generator.js';
import { activateTab, openDemo } from './helpers.js';

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
  expect(evaluation.fatigueAlert).toContain('Queda de 35,0 p.p.');
});

test('Hoje integra Estudo Rápido, Orientação guiada, Diário e Ciclo de Estudos 2.0', async ({
  page,
}) => {
  await prepare(page);
  await activateTab(page, 'hoje');

  const bar = page.locator('[data-today-assistant-bar="true"]');
  await expect(bar).toBeVisible();

  // Modo Estudo Rápido
  await bar.getByRole('button', { name: 'Tenho X minutos' }).click();
  const quickPanel = page.locator('#todayQuickStudyPanel');
  await expect(quickPanel).toBeVisible();
  await expect(quickPanel).toContainText('Proposta (30 min)');

  // Copiloto de Estudos Guiado
  await bar.getByRole('button', { name: 'Orientação guiada' }).click();
  const copilotPanel = page.locator('#todayCopilotPanel');
  await expect(copilotPanel).toBeVisible();
  await expect(copilotPanel).toContainText('O que estudar agora?');

  // Diário de Aprendizagem com sanitização
  await bar.getByRole('button', { name: /Diário de aprendizagem/ }).click();
  const journalPanel = page.locator('#todayJournalPanel');
  await expect(journalPanel).toBeVisible();
  await journalPanel
    .getByLabel('Registrar o que aprendeu, dúvida ou pegadinha')
    .fill('<script>alert(1)</script>Nota salva na aba Hoje');
  await journalPanel.getByRole('button', { name: 'Salvar anotação' }).click();
  await expect(journalPanel).toContainText('Nota salva na aba Hoje');

  // Sequência flexível e montagem/confirmação de Ciclo 2.0
  await page.locator('#executionSequenceBtn').click();
  const cyclePanel = page.locator('[data-study-cycle-panel="true"]');
  await expect(cyclePanel).toBeVisible();
  await cyclePanel.getByRole('button', { name: /Montar ciclo|Configurar ciclo/ }).click();
  await bar.getByRole('button', { name: 'Confirmar nova versão do ciclo' }).click();
  await expect(cyclePanel).toContainText('Próximo bloco:');
});

test('Funcionalidades distribuídas ficam visíveis em Visão Geral, Hoje e Planejamento', async ({
  page,
}) => {
  await prepare(page);

  // 1. Visão Geral: Copiloto de Estudos Guiado + atalho Estudo rápido: 30 min
  await activateTab(page, 'dashboard');
  const copilotCard = page.locator('#overviewCopilotMount [data-overview-copilot="true"]');
  await expect(copilotCard).toBeVisible();
  await expect(copilotCard).toContainText('Copiloto de Estudos Guiado');
  await copilotCard.getByRole('button', { name: 'Estudo rápido de 30 minutos' }).click();

  // 2. Hoje: redirecionamento abre Estudo Rápido em 30 min e chip de 15 min alterna em 1 clique
  await expect(page.locator('#panel-hoje')).toBeVisible();
  const quickPanel = page.locator('#todayQuickStudyPanel');
  await expect(quickPanel).toBeVisible();
  await expect(quickPanel).toContainText('Proposta (30 min)');
  await page.getByRole('button', { name: 'Estudo rápido de 15 minutos' }).click();
  await expect(quickPanel).toContainText('Proposta (15 min)');

  // 3. Hoje lateral: card permanente do Diário de Aprendizagem aceita registro inline
  const journalSidebar = page.locator('#todayJournalSidebarMount [data-today-journal-sidebar="true"]');
  await expect(journalSidebar).toBeVisible();
  await journalSidebar.getByRole('button', { name: 'Registrar aprendizado ou dúvida' }).click();
  await journalSidebar
    .getByLabel('O que aprendeu, dúvida ou pegadinha')
    .fill('Dúvida rápida salva direto na barra lateral de Hoje');
  await journalSidebar.getByRole('button', { name: 'Salvar no Diário' }).click();
  await expect(journalSidebar).toContainText('Dúvida rápida salva direto na barra lateral de Hoje');

  // 4. Planejamento > Plano da semana: Central do Ciclo de Estudos 2.0
  await activateTab(page, 'metas');
  await page.locator('#metasTab-semana').click();
  const cycleCenter = page.locator('#metasCycleCenterMount [data-study-cycle-center="true"]');
  await expect(cycleCenter).toBeVisible();
  await cycleCenter.getByRole('button', { name: 'Confirmar nova versão do ciclo' }).click();
  await expect(cycleCenter).toContainText('Ativo · Volta');

  // 5. Planejamento > Fechamento semanal: Ritual de fechamento inteligente visível sem dobras extras
  await page.locator('#metasTab-fechamento').click();
  const ritualSection = page.locator('#weeklyCloseDashboard [data-weekly-ritual-summary="true"]');
  await expect(ritualSection).toBeVisible();
  await expect(ritualSection).toContainText('Ritual de fechamento inteligente');
  await expect(ritualSection).toContainText('O que funcionou');
  await expect(ritualSection).toContainText('Uma melhoria para testar');
});

test('Demo Visão Geral renderiza Copiloto e Saúde do Edital sem erros de console nem #appErrorState', async ({
  page,
}) => {
  const runtimeErrors = [];
  page.on('pageerror', err => runtimeErrors.push(err.message));
  page.on('console', msg => {
    if (msg.type() === 'error') runtimeErrors.push(msg.text());
  });

  await openDemo(page);
  await activateTab(page, 'dashboard');
  await expect(page.locator('#appErrorState')).toBeHidden();
  await expect(page.locator('#overviewCopilotMount [data-overview-copilot="true"]')).toBeVisible();
  await expect(page.locator('#cockpitSyllabusHealthMount')).not.toBeEmpty();
  expect(runtimeErrors.filter(text => /isDemoMode|Falha em visão geral/i.test(text))).toEqual([]);
});
