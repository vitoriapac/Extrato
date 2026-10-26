import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { waitForAppReady } from './helpers/app-state.js';
import { activateTab } from './helpers.js';

test.beforeEach(async ({ page }) => {
  await page.goto('/?test=1');
  await waitForAppReady(page);
  await page.locator('#testReport').evaluate(element => element.remove());
  await page.evaluate(() => {
    const api = window.__EXTRATO_TEST__,
      state = structuredClone(api.getState());
    state.examDate = '';
    state.examBlueprint.examDate = null;
    state.studySessions = [];
    state.questoes = [];
    state.dailyPlans = [];
    state.studyPlans = [];
    api.setState(state);
    api.renderAll();
  });
  await activateTab(page, 'dashboard');
});

test('Visão Geral mantém ação antes da configuração em todos os estados de primeiro uso', async ({
  page,
}) => {
  const inOrder = await page.evaluate(() => {
    const ids = ['overviewNextAction', 'guidedOnboarding', 'kpiGrid', 'quickStats'];
    const nodes = ids.map(id => document.getElementById(id));
    return (
      nodes.every(Boolean) &&
      nodes.every(
        (node, index) =>
          index === 0 ||
          nodes[index - 1].compareDocumentPosition(node) & Node.DOCUMENT_POSITION_FOLLOWING
      )
    );
  });
  expect(inOrder).toBe(true);
  await expect(page.locator('#guidedOnboarding')).toBeVisible();
  await expect(page.locator('#guidedOnboarding')).toContainText('CONFIGURAÇÃO INICIAL');
  await expect(page.locator('#guidedOnboarding #overviewExamPhase')).toHaveCount(1);
  await expect(page.locator('#panel-dashboard .exam-phase-compact')).toHaveCount(1);
  await expect(page.locator('#guidedOnboarding [role="progressbar"]')).toHaveAttribute(
    'aria-valuemax',
    '4'
  );
  await expect(page.locator('.onboarding-entry-steps [aria-current="step"]')).toHaveCount(1);
  await expect(page.locator('.onboarding-entry-steps [aria-current="step"]')).toContainText(
    'Atual'
  );
  for (const width of [320, 390, 1440]) {
    await page.setViewportSize({ width, height: 1100 });
    await expect
      .poll(() =>
        page.evaluate(() => {
          const steps = document.querySelector('.onboarding-entry-steps').getBoundingClientRect(),
            cta = document.querySelector('.onboarding-entry-cta').getBoundingClientRect();
          return cta.top - steps.bottom;
        })
      )
      .toBeGreaterThanOrEqual(20);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true
    );
  }
  expect(
    (
      await new AxeBuilder({ page })
        .include('#guidedOnboarding')
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze()
    ).violations
  ).toEqual([]);
  await page
    .locator('#guidedOnboarding')
    .screenshot({ path: test.info().outputPath('configuration-entry.png') });
  await page.evaluate(() => {
    const api = window.__EXTRATO_TEST__,
      state = structuredClone(api.getState());
    state.subjects = [];
    api.setState(state);
    api.renderAll();
  });
  const actionFirst = await page.evaluate(
    () =>
      document
        .getElementById('overviewNextAction')
        .compareDocumentPosition(document.getElementById('guidedOnboarding')) &
      Node.DOCUMENT_POSITION_FOLLOWING
  );
  expect(actionFirst).toBeTruthy();
  await expect(page.locator('#guidedOnboarding')).toBeVisible();
});

test('primeiro uso preserva escolhas e chega à prévia do plano', async ({ page }) => {
  const onboarding = page.locator('#guidedOnboarding');
  const overlay = page.locator('#guidedOnboardingOverlay');
  const clickButton = name =>
    overlay
      .getByRole('button', { name: new RegExp(name) })
      .first()
      .click();
  await expect(onboarding).toBeVisible();
  await expect(onboarding).toContainText(/Monte seu plano de estudos|Continue sua configuração/);
  await page.locator('#guidedOnboarding [data-guided-action="open"]').click();
  await expect(overlay).toBeVisible();
  await expect(overlay).toContainText(/Por que isso importa\?/i);
  await page.locator('#guidedExamDate').fill('2027-03-14');
  await clickButton('Continuar');
  await expect(overlay).toContainText('Quanto tempo cabe na sua semana?');
  await page.locator('[data-guided-day="1"]').fill('2');
  await clickButton('Continuar');
  await expect(overlay).toContainText('Quais conteúdos entram no plano?');
  await clickButton('Carregar edital');
  await expect(overlay).toBeHidden();
  await expect(page.locator('#examImportOverlay')).toBeVisible();
  await page.locator('#examImportNextBtn').click();
  await page.locator('#examImportNextBtn').click();
  await page.locator('#examImportNextBtn').click();
  await expect(page.locator('#examImportOverlay')).toBeHidden();
  await expect(overlay).toContainText('Confira a capacidade e crie o primeiro plano');
  await expect(overlay).toContainText('Primeiras atividades priorizadas');
  await expect(overlay).toContainText('mesma prioridade, elegibilidade e capacidade');
  await clickButton('Voltar');
  await expect(overlay).toContainText('Nível inicial por disciplina');
  await clickButton('Voltar');
  await expect(page.locator('[data-guided-day="1"]')).toHaveValue('2');
  await clickButton('Voltar');
  await expect(page.locator('#guidedExamDate')).toHaveValue('2027-03-14');
  await clickButton('Continuar');
  await clickButton('Continuar');
  await clickButton('Ver prévia');
  await clickButton('Confirmar e criar meu plano');
  await expect(page.locator('#panel-hoje')).toBeVisible();
  await expect
    .poll(() => page.evaluate(() => window.__EXTRATO_TEST__.getState().studyPlans.length))
    .toBeGreaterThan(0);
  await expect
    .poll(() =>
      page.evaluate(() =>
        window.__EXTRATO_TEST__
          .getState()
          .dailyPlans.reduce((sum, plan) => sum + (plan.items || []).length, 0)
      )
    )
    .toBeGreaterThan(0);
  await activateTab(page, 'dashboard');
  await expect(onboarding).toBeHidden();
  await expect(page.locator('#guidedOnboarding #overviewExamPhase')).toHaveCount(0);
  await expect(page.locator('#guidedOnboarding + #overviewExamPhase')).toHaveCount(1);
  await expect(page.locator('#panel-dashboard .exam-phase-compact')).toHaveCount(1);
});

test('modal fecha com Escape e devolve o foco ao card', async ({ page }) => {
  const open = page.locator('#guidedOnboarding [data-guided-action="open"]');
  await open.focus();
  await open.click();
  await expect(page.locator('#guidedOnboardingOverlay')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('#guidedOnboardingOverlay')).toBeHidden();
  await expect(open).toBeFocused();
});

for (const viewport of [
  { name: 'celular', width: 375, height: 812 },
  { name: 'tablet', width: 768, height: 900 },
  { name: 'desktop', width: 1440, height: 900 },
])
  test(`modal permanece navegável em ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.locator('#guidedOnboarding [data-guided-action="open"]').click();
    const overlay = page.locator('#guidedOnboardingOverlay'),
      modal = overlay.locator('.onboarding-modal');
    await expect(overlay).toBeVisible();
    const bounds = await modal.boundingBox();
    expect(bounds.x).toBeGreaterThanOrEqual(0);
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(viewport.width + 1);
    expect(bounds.y + bounds.height).toBeLessThanOrEqual(viewport.height + 1);
    await expect(page.locator('#guidedOnboardingClose')).toBeFocused();
    await page.keyboard.press('Shift+Tab');
    await expect(overlay.locator('[data-guided-action="cancel"]')).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.locator('#guidedOnboardingClose')).toBeFocused();
  });

for (const theme of ['light', 'dark'])
  for (const viewport of [
    { name: 'mobile', width: 375, height: 812 },
    { name: 'desktop', width: 1440, height: 900 },
  ])
    test(`hierarquia visual cobre quatro etapas em ${theme} ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.evaluate(selected => {
        document.documentElement.dataset.theme = selected;
        const api = window.__EXTRATO_TEST__,
          state = structuredClone(api.getState());
        state.subjects = [
          {
            id: 'visual-subject',
            name: 'Matemática',
            archived: false,
            topics: [
              {
                id: 'visual-topic',
                name: 'Porcentagem',
                status: 'Não iniciado',
                difficulty: 'Médio',
                estimatedStudyMinutes: 75,
                archived: false,
                prerequisites: [],
              },
            ],
          },
        ];
        api.setState(state);
        api.renderAll();
      }, theme);
      await page.locator('#guidedOnboarding [data-guided-action="open"]').click();
      const overlay = page.locator('#guidedOnboardingOverlay'),
        next = () => overlay.locator('[data-guided-action="next"]');
      const assertLayering = async expectedCompleted => {
        const colors = await overlay.evaluate(element => {
          const modal = element.querySelector('.onboarding-modal'),
            main = element.querySelector('.onboarding-modal-body>main'),
            help = element.querySelector('.onboarding-help');
          return {
            modal: getComputedStyle(modal).backgroundColor,
            main: getComputedStyle(main).backgroundColor,
            help: getComputedStyle(help).backgroundColor,
          };
        });
        expect(colors.main).not.toBe(colors.help);
        expect(colors.modal).not.toBe(colors.help);
        await expect(overlay.locator('.guided-onboarding-steps .is-current')).toHaveCount(1);
        await expect(overlay.locator('.guided-onboarding-steps .is-complete')).toHaveCount(
          expectedCompleted
        );
        const bounds = await overlay.locator('.onboarding-modal').boundingBox();
        expect(bounds.x).toBeGreaterThanOrEqual(0);
        expect(bounds.x + bounds.width).toBeLessThanOrEqual(viewport.width + 1);
        const accessibility = await new AxeBuilder({ page })
          .include('#guidedOnboardingOverlay')
          .withRules(['color-contrast'])
          .analyze();
        expect(accessibility.violations).toEqual([]);
      };
      await assertLayering(0);
      const goalControl = page.locator('#guidedExamPreset');
      expect(
        await goalControl.evaluate(input => parseFloat(getComputedStyle(input).borderTopWidth))
      ).toBeGreaterThan(0);
      expect(
        await goalControl.evaluate(input => input.getBoundingClientRect().height)
      ).toBeGreaterThanOrEqual(44);
      await page.locator('#guidedExamDate').fill('2027-03-14');
      await next().click();
      await assertLayering(1);
      await page.locator('[data-guided-day="1"]').fill('2');
      await next().click();
      await assertLayering(2);
      await next().click();
      await assertLayering(3);
      await expect(overlay).toContainText('Primeiras atividades priorizadas');
    });

test('cancelar edital devolve foco e escolhas ao onboarding sem diálogos concorrentes', async ({
  page,
}) => {
  await page.locator('#guidedOnboarding [data-guided-action="open"]').click();
  await page.locator('#guidedExamDate').fill('2027-03-14');
  await page.locator('#guidedOnboardingOverlay [data-guided-action="next"]').click();
  await page.locator('[data-guided-day="1"]').fill('2');
  await page.locator('#guidedOnboardingOverlay [data-guided-action="next"]').click();
  await page.locator('#guidedOnboardingOverlay [data-guided-action="import"]').click();
  await expect(page.locator('#guidedOnboardingOverlay')).toBeHidden();
  await expect(page.locator('#examImportOverlay')).toBeVisible();
  await expect(page.locator('#examImportOverlay [name="examPreset"]').first()).toBeFocused();
  const accessibility = await new AxeBuilder({ page }).include('#examImportOverlay').analyze();
  expect(accessibility.violations).toEqual([]);
  await page.keyboard.press('Escape');
  await expect(page.locator('#examImportOverlay')).toBeHidden();
  await expect(page.locator('#guidedOnboardingOverlay')).toBeVisible();
  await expect(page.locator('#guidedOnboardingClose')).toBeFocused();
  await page.locator('#guidedOnboardingOverlay [data-guided-action="back"]').click();
  await expect(page.locator('[data-guided-day="1"]')).toHaveValue('2');
  await page.locator('#guidedOnboardingOverlay [data-guided-action="back"]').click();
  await expect(page.locator('#guidedExamDate')).toHaveValue('2027-03-14');
});

test('importação CSV retorna à prévia do onboarding sem sobrepor diálogos', async ({ page }) => {
  await page.locator('#guidedOnboarding [data-guided-action="open"]').click();
  await page.locator('#guidedExamDate').fill('2027-03-14');
  await page.locator('#guidedOnboardingOverlay [data-guided-action="next"]').click();
  await page.locator('[data-guided-day="1"]').fill('2');
  await page.locator('#guidedOnboardingOverlay [data-guided-action="next"]').click();
  const fileChooser = page.waitForEvent('filechooser');
  await page.locator('#guidedOnboardingOverlay [data-guided-action="structured"]').click();
  await (
    await fileChooser
  ).setFiles({
    name: 'edital.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from('disciplina,topico,esforco\nPortuguês,Interpretação,90'),
  });
  await expect(page.locator('#guidedOnboardingOverlay')).toBeHidden();
  await expect(page.locator('#structuredImportOverlay')).toBeVisible();
  await expect(page.locator('#structuredImportCancelBtn')).toBeFocused();
  await page.locator('#structuredImportConfirmBtn').click();
  await expect(page.locator('#structuredImportOverlay')).toBeHidden();
  await expect(page.locator('#guidedOnboardingOverlay')).toBeVisible();
  await expect(page.locator('#guidedOnboardingOverlay')).toContainText(
    'Confira a capacidade e crie o primeiro plano'
  );
});

test('cadastro manual oferece retorno à configuração após criar conteúdo', async ({ page }) => {
  await page.locator('#guidedOnboarding [data-guided-action="open"]').click();
  await page.locator('#guidedExamDate').fill('2027-03-14');
  await page.locator('#guidedOnboardingOverlay [data-guided-action="next"]').click();
  await page.locator('#guidedOnboardingOverlay [data-guided-action="next"]').click();
  await page.locator('#guidedOnboardingOverlay [data-guided-action="manual"]').click();
  await expect(page.locator('#panel-disciplinas')).toBeVisible();
  await expect(page.locator('#guidedManualReturn')).toBeVisible();
  await expect(page.locator('[data-guided-manual-return]')).toBeEnabled();
  await page.locator('[data-guided-manual-return]').click();
  await expect(page.locator('#guidedOnboardingOverlay')).toBeVisible();
  await expect(page.locator('#guidedOnboardingOverlay')).toContainText(
    'Quais conteúdos entram no plano?'
  );
});

test('campos da configuração possuem nomes acessíveis e retorno por teclado', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const open = page.locator('#guidedOnboarding [data-guided-action="open"]');
  await open.focus();
  await page.keyboard.press('Enter');
  const overlay = page.locator('#guidedOnboardingOverlay');
  await expect(page.getByRole('combobox', { name: 'Concurso do primeiro acesso' })).toBeVisible();
  await expect(overlay.getByLabel('Data da prova', { exact: true })).toBeVisible();
  await overlay.getByLabel('Data da prova', { exact: true }).fill('2027-03-14');
  await overlay.locator('[data-guided-action="next"]').click();
  const fields = overlay.locator('[data-guided-day]');
  await expect(fields).toHaveCount(7);
  for (const field of await fields.all())
    await expect(field).toHaveAccessibleName(/Horas disponíveis em/);
  const result = await new AxeBuilder({ page })
    .include('#guidedOnboardingOverlay')
    .withRules(['label', 'select-name', 'button-name', 'aria-valid-attr-value'])
    .analyze();
  expect(result.violations).toEqual([]);
  await page.keyboard.press('Escape');
  await expect(overlay).toBeHidden();
  await expect(open).toBeFocused();
});

test('atalhos de 1 clique no wizard inicial agilizam data e rotina', async ({ page }) => {
  const open = page.locator('#guidedOnboarding [data-guided-action="open"]');
  await open.click();
  const overlay = page.locator('#guidedOnboardingOverlay');
  await expect(overlay).toBeVisible();

  // 1. Clicar no atalho de 6 meses (pré-edital)
  const shortcut6m = overlay.locator('[data-guided-date-offset="180"]');
  await expect(shortcut6m).toBeVisible();
  await shortcut6m.click();

  const dateInput = overlay.locator('#guidedExamDate');
  const dateValue = await dateInput.inputValue();
  expect(dateValue).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  expect(dateValue).not.toBe('');

  const nextBtn = overlay.locator('[data-guided-action="next"]');
  await expect(nextBtn).toBeEnabled();
  await nextBtn.click();

  // 2. Etapa de disponibilidade: rotina sugerida de Trabalho + Estudo
  await expect(overlay).toContainText('Quanto tempo cabe na sua semana?');
  const presetWork = overlay.locator('[data-guided-availability-preset="work_study"]');
  await expect(presetWork).toBeVisible();
  await presetWork.click();

  await expect(overlay.locator('[data-guided-day="1"]')).toHaveValue('2');
  await expect(overlay.locator('[data-guided-day="6"]')).toHaveValue('4');
  await expect(overlay.locator('.guided-capacity strong')).toContainText(/14\s*h|840\s*min/);
  await expect(nextBtn).toBeEnabled();

  await page.keyboard.press('Escape');
  await expect(overlay).toBeHidden();
});

test('missão do primeiro dia é exibida na aba hoje e orienta ativação pós-plano', async ({
  page,
}) => {
  // Configura estado com plano criado, mas 0 sessões e 0 questões
  await page.evaluate(() => {
    const api = window.__EXTRATO_TEST__,
      state = structuredClone(api.getState());
    state.studyPlans = [
      {
        id: 'plan_1',
        createdAt: '2026-10-26T10:00:00.000Z',
        items: [{ id: 'item_1', subjectId: 's1', minutes: 60 }],
      },
    ];
    state.dailyPlans = [
      {
        date: '2026-10-26',
        items: [{ id: 'item_1', subjectId: 's1', minutes: 60 }],
      },
    ];
    state.studySessions = [];
    state.questoes = [];
    localStorage.removeItem('studytrack_first_steps_dismissed');
    api.setState(state);
    api.renderAll();
  });

  await activateTab(page, 'hoje');

  const missionCard = page.locator('#firstStepsMissionCard');
  await expect(missionCard).toBeVisible();
  await expect(missionCard).toContainText('Comece a estudar hoje');
  await expect(missionCard).toContainText('1 de 3 concluídos');
  await expect(missionCard.locator('[data-mission-id="plan"]')).toHaveAttribute(
    'data-mission-done',
    'true'
  );
  await expect(missionCard.locator('[data-mission-id="session"]')).toHaveAttribute(
    'data-mission-done',
    'false'
  );

  // Dispensar guia
  const dismissBtn = missionCard.locator('[data-first-steps-dismiss="true"]');
  await dismissBtn.click();
  await expect(missionCard).toBeHidden();

  // Barra de restauração fica visível e permite reexibir o guia
  const restoreBar = page.locator('#firstStepsRestoreBar');
  await expect(restoreBar).toBeVisible();
  const restoreBtn = restoreBar.locator('[data-first-steps-restore="true"]');
  await restoreBtn.click();
  await expect(missionCard).toBeVisible();
});

test('tour guiado interativo percorre todas as 5 paradas e conclui com sucesso', async ({
  page,
}) => {
  await page.evaluate(() => {
    const api = window.__EXTRATO_TEST__,
      state = structuredClone(api.getState());
    state.studyPlans = [
      {
        id: 'plan_1',
        createdAt: '2026-10-26T10:00:00.000Z',
        items: [{ id: 'item_1', subjectId: 's1', minutes: 60 }],
      },
    ];
    state.dailyPlans = [
      {
        date: '2026-10-26',
        items: [{ id: 'item_1', subjectId: 's1', minutes: 60 }],
      },
    ];
    localStorage.removeItem('studytrack_first_steps_dismissed');
    api.setState(state);
    api.renderAll();
  });

  await activateTab(page, 'hoje');
  const tourStartBtn = page.locator('#firstStepsMissionCard [data-guided-tour-start]');
  await expect(tourStartBtn).toBeVisible();
  await tourStartBtn.click();

  const tourPopover = page.locator('#guidedTourPopover');
  await expect(tourPopover).toBeVisible();

  // Parada 1: Visão Geral
  await expect(tourPopover).toContainText('Sua única prioridade de agora');
  await expect(page.locator('#panel-dashboard')).toBeVisible();

  // Avança para Parada 2: Hoje
  const nextBtn = tourPopover.locator('[data-guided-tour-next="true"]');
  await nextBtn.click();
  await expect(page.locator('#panel-hoje')).toBeVisible();
  await expect(tourPopover).toContainText('Execução guiada e cronômetro');

  // Avança para Parada 3: Questões
  await nextBtn.click();
  await expect(page.locator('#panel-questoes')).toBeVisible();
  await expect(tourPopover).toContainText('Questões e Importador CSV');

  // Avança para Parada 4: Desempenho
  await nextBtn.click();
  await expect(page.locator('#panel-desempenho')).toBeVisible();
  await expect(tourPopover).toContainText('Inteligência da Prova × Você');

  // Avança para Parada 5: Planejamento
  await nextBtn.click();
  await expect(page.locator('#panel-metas')).toBeVisible();
  await expect(tourPopover).toContainText('Planejamento vivo e Fechamento');
  await expect(nextBtn).toContainText('Concluir ✓');

  // Concluir tour
  await nextBtn.click();
  await expect(tourPopover).toBeHidden();
  await expect(page.locator('.is-tour-highlighted')).toHaveCount(0);
});

test('tour guiado atende critérios de acessibilidade e sem overflow em tela compacta', async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.evaluate(() => {
    const api = window.__EXTRATO_TEST__,
      state = structuredClone(api.getState());
    state.studyPlans = [
      {
        id: 'plan_1',
        createdAt: '2026-10-26T10:00:00.000Z',
        items: [{ id: 'item_1', subjectId: 's1', minutes: 60 }],
      },
    ];
    state.dailyPlans = [
      {
        date: '2026-10-26',
        items: [{ id: 'item_1', subjectId: 's1', minutes: 60 }],
      },
    ];
    localStorage.removeItem('studytrack_first_steps_dismissed');
    api.setState(state);
    api.renderAll();
  });

  await activateTab(page, 'hoje');
  const tourStartBtn = page.locator('#firstStepsMissionCard [data-guided-tour-start]');
  await tourStartBtn.click();

  const tourPopover = page.locator('#guidedTourPopover');
  await expect(tourPopover).toBeVisible();

  // Verifica que não há overflow horizontal em 375px
  const box = await tourPopover.boundingBox();
  expect(box).not.toBeNull();
  if (box) {
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(375);
  }

  // Auditoria de Acessibilidade Axe no Popover
  const result = await new AxeBuilder({ page })
    .include('#guidedTourPopover')
    .withRules(['color-contrast', 'button-name', 'aria-valid-attr-value'])
    .analyze();
  expect(result.violations).toEqual([]);

  // Navegação para trás por teclado (ArrowLeft)
  const nextBtn = tourPopover.locator('[data-guided-tour-next="true"]');
  await nextBtn.click();
  await expect(tourPopover).toContainText('Execução guiada e cronômetro');
  await page.keyboard.press('ArrowLeft');
  await expect(tourPopover).toContainText('Sua única prioridade de agora');

  // Encerramento por Escape restaura foco
  await page.keyboard.press('Escape');
  await expect(tourPopover).toBeHidden();
});

test('gatilhos de entrada do tour iniciam o fluxo a partir de Instruções e Modo Demonstração', async ({
  page,
}) => {
  // 1. Acionamento a partir da aba Instruções
  await activateTab(page, 'instrucoes');
  const helpTourBtn = page.locator('#panel-instrucoes [data-guided-tour-start="true"]');
  await expect(helpTourBtn).toBeVisible();
  await helpTourBtn.click();

  const tourPopover = page.locator('#guidedTourPopover');
  await expect(tourPopover).toBeVisible();
  await expect(tourPopover).toContainText('Sua única prioridade de agora');
  await page.keyboard.press('Escape');
  await expect(tourPopover).toBeHidden();

  // 2. Acionamento a partir do banner de demonstração
  await page.evaluate(() => {
    const banner = document.getElementById('demoBanner');
    if (banner) banner.hidden = false;
  });
  const demoTourBtn = page.locator('#demoTourBtn');
  await expect(demoTourBtn).toBeVisible();
  await demoTourBtn.click();

  await expect(tourPopover).toBeVisible();
  await expect(tourPopover).toContainText('Sua única prioridade de agora');
  await page.keyboard.press('Escape');
  await expect(tourPopover).toBeHidden();
});
