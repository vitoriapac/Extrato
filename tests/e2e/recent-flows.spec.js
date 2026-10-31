import { test, expect } from '@playwright/test';
import { activateTab, openDemo, openExamImport, overviewRecommendationId } from './helpers.js';

test.describe('validação dos fluxos recentes', () => {
  test('matriz, cenários e fechamento aparecem no planejamento da demo', async ({ page }) => {
    await openDemo(page);
    await activateTab(page, 'metas');
    await expect(page.locator('#examMasteryMatrix')).toBeAttached();
    await expect(page.locator('#weeklyCloseDashboard')).toBeAttached();
    await expect(page.locator('#gapMapDashboard')).toBeAttached();
    await expect(page.locator('#postSimulationReplanDashboard')).toBeAttached();
    await expect(page.locator('#approvalDashboard')).toContainText(
      /cenário|projeção|disponibilidade/i
    );
  });
  test('fechamento e decisões usam linguagem visível ao estudante', async ({ page }) => {
    await openDemo(page);
    await activateTab(page, 'metas');
    await expect(page.locator('#periodComparisonResults')).toContainText(/comparado com/i);
    await expect(page.locator('#periodComparisonResults')).not.toContainText(/accuracy:|minutes:/);
    await expect(page.locator('#gapMapDashboard')).not.toContainText(/demo-topic-/);
    await expect(page.locator('#decisionHistoryDashboard')).not.toContainText(
      /demo-recommendation-/
    );
  });
  test('calibração e histórico de decisões preservam estado insuficiente', async ({ page }) => {
    await openDemo(page);
    await activateTab(page, 'metas');
    await expect(page.locator('#recommendationCalibration')).toBeAttached();
    await expect(page.locator('#decisionHistoryDashboard')).toBeAttached();
    await expect(page.locator('#recommendationCalibration')).toContainText(
      /amostra|calibração|recomend/i
    );
  });
  test('ação de recomendação abre o fluxo especializado', async ({ page }) => {
    await openDemo(page);
    await activateTab(page, 'hoje');
    const recommendation = page.locator('#studyRecommendation'),
      action =
        /Iniciar estudo|Iniciar revisão|Resolver questões|Estudar pré-requisito|Estudar como atividade adicional/i;
    await expect(recommendation).toContainText(action, { timeout: 10_000 });
    const start = recommendation.getByRole('button', { name: action }).first();
    await expect(start).toBeVisible();
    const label = await start.innerText();
    await start.click();
    if (/Resolver questões/i.test(label))
      await expect(page.locator('#tab-questoes')).toHaveClass(/active/);
    else if (/revisão/i.test(label))
      await expect(page.locator('#tab-agenda')).toHaveClass(/active/);
    else if (/pré-requisito/i.test(label))
      await expect(page.locator('#tab-disciplinas')).toHaveClass(/active/);
    else await expect(page.locator('#guidedStrategy')).toBeVisible();
  });
  test('recomendação guiada registra sessão curta e fecha o vínculo sem perguntas', async ({
    page,
  }) => {
    await page.goto('/?test=1');
    await expect(page.locator('#testReport')).toBeVisible();
    await page.locator('#testReport').evaluate(element => element.remove());
    await page.evaluate(() => {
      const api = window.__EXTRATO_TEST__,
        state = structuredClone(api.getState()),
        topic = state.subjects[0].topics[0];
      topic.status = 'Não iniciado';
      topic.archived = false;
      topic.estimatedStudyMinutes = 35;
      topic.prerequisites = [];
      const next = structuredClone(topic);
      next.id = 'topic-followup';
      next.name = 'SFN';
      next.status = 'Não iniciado';
      next.archived = false;
      next.estimatedStudyMinutes = 40;
      next.prerequisites = [];
      state.subjects.push({
        id: 'subject-followup',
        name: 'Conhecimentos Bancários',
        archived: false,
        topics: [next],
      });
      state.studySessions = [];
      state.questoes = [];
      state.dailyPlans = [];
      state.recommendationFeedback = [];
      api.setState(state);
      api.renderAll();
    });
    await activateTab(page, 'hoje');
    const action = page
      .locator('#studyRecommendation')
      .getByRole('button', { name: /Iniciar estudo/i })
      .first();
    await expect(action).toBeVisible({ timeout: 10_000 });
    await action.click();
    await expect(page.locator('#guidedStrategy')).toBeVisible();
    await expect.poll(() => page.locator('#studyTimerDisplay').innerText()).not.toBe('00:00');
    await page.locator('#timerFinishBtn').click();
    await expect(page.locator('#sessionModalOverlay')).toBeVisible();
    await page.locator('#sessionModalSaveBtn').click();
    await expect(page.locator('#sessionResult')).toContainText('Sessão registrada');
    await expect
      .poll(() =>
        page.evaluate(() => {
          const state = window.__EXTRATO_TEST__.getState(),
            session = state.studySessions.at(-1);
          return Boolean(
            session?.recommendationId &&
            state.recommendationFeedback.some(
              item =>
                item.recommendationId === session.recommendationId &&
                item.completed &&
                item.resultingSessionId === session.id
            )
          );
        })
      )
      .toBe(true);
    const link = await page.evaluate(() => {
      const state = window.__EXTRATO_TEST__.getState(),
        session = state.studySessions.at(-1),
        feedback = state.recommendationFeedback.find(
          item => item.recommendationId === session.recommendationId
        );
      return {
        source: session.source,
        recommendationSource: session.recommendationSource,
        recommendationType: session.recommendationType,
        recommendationId: session.recommendationId,
        resultingSessionId: feedback.resultingSessionId,
        snapshot: feedback.snapshot,
        questionCount: state.questoes.filter(item => item.studySessionId === session.id).length,
      };
    });
    expect(link.source).toBe('recommendation');
    expect(link.recommendationSource).toBe('today');
    expect(link.recommendationType).toBe('study');
    expect(link.resultingSessionId).toBeTruthy();
    expect(link.snapshot).toBeTruthy();
    expect(link.questionCount).toBe(0);
    await page.evaluate(() => window.__EXTRATO_TEST__.renderAll());
    await activateTab(page, 'dashboard');
    const overviewAction = page.locator('#overviewNextAction .overview-action-card'),
      overviewId = await overviewAction.getAttribute('data-study-action-id');
    await activateTab(page, 'hoje');
    await expect(
      page.locator('#studyRecommendation .study-recommendation').first()
    ).toHaveAttribute('data-study-action-id', overviewId);
    await activateTab(page, 'dashboard');
    await expect(page.locator('#overviewNextAction .recommendation-outcome')).toHaveCount(0);
    await activateTab(page, 'hoje');
    await expect(page.locator('#studyRecommendation .recommendation-outcome')).toContainText(
      'ajudou?'
    );
    await page
      .locator('#studyRecommendation .recommendation-outcome')
      .getByRole('button', { name: 'Sim', exact: true })
      .click();
    const afterRating = await page.evaluate(id => {
      const feedback = window.__EXTRATO_TEST__
        .getState()
        .recommendationFeedback.find(item => item.recommendationId === id);
      return { useful: feedback.useful, snapshot: feedback.snapshot };
    }, link.recommendationId);
    expect(afterRating.useful).toBe(true);
    expect(afterRating.snapshot).toEqual(link.snapshot);
  });

  test('recomendação vazia explica o dado ausente e oferece uma próxima ação', async ({ page }) => {
    await page.goto('/?test=1');
    await expect(page.locator('#testReport')).toBeVisible();
    await page.locator('#testReport').evaluate(element => element.remove());
    await page.evaluate(() => {
      const api = window.__EXTRATO_TEST__,
        state = structuredClone(api.getState());
      state.subjects = [];
      state.studySessions = [];
      state.questoes = [];
      state.dailyPlans = [];
      api.setState(state);
      api.renderAll();
    });
    await activateTab(page, 'hoje');
    const empty = page.locator('#studyRecommendation .recommendation-empty-state');
    await expect(empty).toContainText('Nenhuma recomendação disponível');
    await expect(empty).toContainText('Cadastre ou importe disciplinas e tópicos');
    await empty.getByRole('button', { name: 'Configurar disciplinas e tópicos' }).click();
    await expect(page.locator('#panel-metas')).toHaveClass(/active/);
  });
  test('ação de estudo no diagnóstico inicia sessão vinculada e atualiza as recomendações', async ({
    page,
  }) => {
    await openDemo(page);
    await activateTab(page, 'hoje');
    await page.locator('.today-analysis-details > summary').click();
    // Na demonstração, as ações de estudo vêm de conteúdos sem evidência, agrupados num bloco recolhido.
    const insufficient = page.locator('#diagnosisCenter .diagnosis-insufficient > summary');
    if (await insufficient.count()) await insufficient.click();
    const action = page
      .locator(
        '#diagnosisCenter .diagnostic-row[data-activity-type="study"] button[data-study-action-source="diagnosis"]:visible'
      )
      .first();
    await expect(
      action.locator('xpath=ancestor::article').locator('.diagnostic-primary-reason')
    ).toBeVisible();
    await expect(action).toBeVisible();
    await action.click();
    await expect(page.locator('#guidedStrategy')).toBeVisible();
    await expect.poll(() => page.locator('#studyTimerDisplay').innerText()).not.toBe('00:00');
    await page.locator('#timerFinishBtn').click();
    await expect(page.locator('#sessionModalOverlay')).toBeVisible();
    await expect(page.locator('#sessionModalDifficulty')).toBeVisible();
    await page.locator('#sessionModalDifficulty').selectOption('medium');
    await page.locator('#sessionModalSaveBtn').click();
    await expect(page.locator('#sessionResult')).toContainText('Sessão registrada');
    const saved = await page.evaluate(() => {
      const state =
        window.__EXTRATO_TEST__?.getState() ||
        JSON.parse(sessionStorage.getItem('bb-premium-study-demo'));
      const session = state.studySessions.at(-1),
        feedback = state.recommendationFeedback.find(
          item => item.recommendationId === session.recommendationId
        );
      return {
        source: session.recommendationSource,
        type: session.recommendationType,
        difficulty: session.perceivedDifficulty,
        completed: feedback?.completed,
        sessionId: session.id,
        resultingSessionId: feedback?.resultingSessionId,
      };
    });
    expect(saved.source).toBe('diagnosis');
    expect(saved.type).toBe('study');
    expect(saved.difficulty).toBe('medium');
    expect(saved.completed).toBe(true);
    expect(saved.resultingSessionId).toBe(saved.sessionId);
    await activateTab(page, 'hoje');
    const analysisDetails = page.locator('.today-analysis-details');
    if (!(await analysisDetails.evaluate(element => element.open)))
      await analysisDetails.locator('summary').click();
    await expect(page.locator('#diagnosisCenter')).toBeVisible();
    await activateTab(page, 'dashboard');
    const overviewId = await overviewRecommendationId(page);
    await activateTab(page, 'hoje');
    await expect(
      page.locator('#studyRecommendation .study-recommendation').first()
    ).toHaveAttribute('data-study-action-id', overviewId);
  });
  test('ação iniciada na Visão Geral preserva sua origem ao registrar a sessão', async ({
    page,
  }) => {
    await page.goto('/?test=1');
    await expect(page.locator('#testReport')).toBeVisible();
    await page.locator('#testReport').evaluate(element => element.remove());
    await page.evaluate(() => {
      const api = window.__EXTRATO_TEST__,
        state = structuredClone(api.getState()),
        topic = state.subjects[0].topics[0];
      topic.status = 'Não iniciado';
      topic.archived = false;
      topic.estimatedStudyMinutes = 35;
      topic.prerequisites = [];
      state.studySessions = [];
      state.questoes = [];
      state.dailyPlans = [];
      state.recommendationFeedback = [];
      api.setState(state);
      api.renderAll();
    });
    await activateTab(page, 'dashboard');
    const card = page.locator('#overviewNextAction .overview-action-card');
    await expect(card).toBeVisible();
    await expect(card).toHaveAttribute('data-study-action-source', 'overview');
    await card.getByRole('button', { name: /Iniciar estudo/i }).click();
    await expect(page.locator('#guidedStrategy')).toBeVisible();
    await expect.poll(() => page.locator('#studyTimerDisplay').innerText()).not.toBe('00:00');
    await page.locator('#timerFinishBtn').click();
    await expect(page.locator('#sessionModalOverlay')).toBeVisible();
    await page.locator('#sessionModalSaveBtn').click();
    await expect
      .poll(() =>
        page.evaluate(
          () => window.__EXTRATO_TEST__.getState().studySessions.at(-1)?.recommendationSource
        )
      )
      .toBe('overview');
    await expect
      .poll(() =>
        page.evaluate(
          () => window.__EXTRATO_TEST__.getState().studySessions.at(-1)?.recommendationType
        )
      )
      .toBe('study');
  });
  test('importação repetida permanece idempotente após recarregar', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.reload();
    await activateTab(page, 'disciplinas');
    await openExamImport(page);
    await page.getByRole('button', { name: 'Continuar' }).click();
    await page.getByRole('button', { name: 'Continuar' }).click();
    await page.getByRole('button', { name: 'Importar', exact: true }).click();
    const subjects = await page.locator('.subject-block').count();
    await expect.poll(() => page.evaluate(() => localStorage.length)).toBeGreaterThan(0);
    await page.reload();
    await activateTab(page, 'disciplinas');
    await openExamImport(page);
    await page.getByRole('button', { name: 'Continuar' }).click();
    await page.getByRole('button', { name: 'Continuar' }).click();
    expect(await page.locator('.subject-block').count()).toBe(subjects);
    if (await page.getByRole('button', { name: 'Importar', exact: true }).isEnabled())
      await page.getByRole('button', { name: 'Importar', exact: true }).click();
    expect(await page.locator('.subject-block').count()).toBe(subjects);
  });
  test('modo móvel mantém os painéis recentes sem overflow', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await openDemo(page);
    await activateTab(page, 'metas');
    const dimensions = await page.evaluate(() => ({
      width: document.documentElement.scrollWidth,
      viewport: innerWidth,
    }));
    expect(dimensions.width).toBeLessThanOrEqual(dimensions.viewport);
    await expect(page.locator('#examMasteryMatrix')).toBeVisible();
  });
  test('modal de importação de questões CSV exibe prévia, importa sessões e ignora duplicatas', async ({
    page,
  }) => {
    await page.goto('/?test=1');
    await expect(page.locator('#testReport')).toBeVisible();
    await page.locator('#testReport').evaluate(element => element.remove());
    await activateTab(page, 'questoes');
    await page.locator('.questions-import-menu > summary').click();
    await expect(page.locator('#importQuestionsBtn')).toBeVisible();
    const csv =
      'Data;Disciplina;Tópico;Resolvidas;Acertos;Categoria do erro\n2026-10-15;Português;Interpretação de Texto;10;8;interpretacao\n2026-10-16;Conhecimentos Bancários;Sistema Financeiro Nacional;15;12;lacuna\n';
    await page.locator('#questionsImportFile').setInputFiles({
      name: 'historico-questoes.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(csv, 'utf8'),
    });
    await expect(page.locator('#questionsImportOverlay')).toHaveClass(/show/);
    await expect(page.locator('#questionsImportContent')).toContainText('25');
    await expect(page.locator('#questionsImportContent')).toContainText('80%');
    await expect(page.locator('#questionsImportContent')).toContainText('+1 novas disciplinas');
    await page.locator('#questionsImportConfirmBtn').click();
    await expect(page.locator('#questionsImportOverlay')).not.toHaveClass(/show/);
    await expect
      .poll(() => page.evaluate(() => window.__EXTRATO_TEST__.getState().questoes.length))
      .toBe(2);
    await page.locator('#questionsImportFile').setInputFiles({
      name: 'historico-questoes.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(csv, 'utf8'),
    });
    await expect(page.locator('#questionsImportOverlay')).toHaveClass(/show/);
    await expect(page.locator('#questionsImportContent')).toContainText(
      '2 sessões já existentes serão ignoradas'
    );
    await page.locator('#questionsImportCancelBtn').click();
    await expect(page.locator('#questionsImportOverlay')).not.toHaveClass(/show/);
    expect(await page.evaluate(() => window.__EXTRATO_TEST__.getState().questoes.length)).toBe(2);
  });
  test('modal de sincronização WebDAV E2EE testa conexão, envia backup criptografado e restaura após confirmação', async ({
    page,
  }) => {
    let remoteEnvelope = null;
    await page.route('http://localhost:9999/webdav/**', async route => {
      const method = route.request().method();
      if (method === 'PROPFIND') return route.fulfill({ status: 207, body: '' });
      if (method === 'GET')
        return remoteEnvelope
          ? route.fulfill({ status: 200, contentType: 'application/json', body: remoteEnvelope })
          : route.fulfill({ status: 404, body: 'Not Found' });
      if (method === 'PUT') {
        remoteEnvelope = route.request().postData() || '';
        return route.fulfill({ status: 201, body: '' });
      }
      return route.fulfill({ status: 405, body: '' });
    });
    await page.goto('/?test=1');
    await expect(page.locator('#testReport')).toBeVisible();
    await page.locator('#testReport').evaluate(element => element.remove());
    await page.locator('#openDataManagementBtn').click();
    await expect(page.locator('#dataManagementOverlay, #dataManagementDialog')).toBeVisible();
    await page.locator('#openRemoteSyncBtn').click();
    await expect(page.locator('#remoteSyncOverlay')).toHaveClass(/show/);
    await page.locator('#remoteSyncUrl').fill('http://localhost:9999/webdav/');
    await page.locator('#remoteSyncUsername').fill('estudante');
    await page.locator('#remoteSyncPassword').fill('senha-dav');
    await page.locator('#remoteSyncPassphrase').fill('chave-mestre-forte-2026');
    await page.locator('#saveRemoteSyncConfigBtn').click();
    const savedPrefs = await page.evaluate(() =>
      JSON.parse(localStorage.getItem('studytrack_remote_sync_config') || '{}')
    );
    expect(savedPrefs.serverUrl).toBe('http://localhost:9999/webdav/');
    expect(savedPrefs.username).toBe('estudante');
    expect(savedPrefs.password).toBeUndefined();
    expect(savedPrefs.passphrase).toBeUndefined();
    await page.locator('#testRemoteSyncBtn').click();
    await expect(page.locator('#remoteSyncStatusMsg')).toContainText(
      'Conexão estabelecida com sucesso!'
    );
    await page.locator('#reconcileRemoteSyncBtn').click();
    await expect(page.locator('#remoteSyncStatusMsg')).toContainText(
      'Nenhum backup na nuvem ainda'
    );
    await page.locator('#pushRemoteSyncBtn').click();
    await expect(page.locator('#remoteSyncStatusMsg')).toContainText(
      'Upload concluído com sucesso'
    );
    expect(remoteEnvelope).toBeTruthy();
    const parsedEnvelope = JSON.parse(remoteEnvelope);
    expect(parsedEnvelope.algorithm).toBe('AES-GCM-256');
    expect(remoteEnvelope).not.toContain('Português');
    await page.evaluate(() => {
      const api = window.__EXTRATO_TEST__,
        state = structuredClone(api.getState());
      state.subjects = [];
      api.setState(state);
      api.renderAll();
    });
    expect(await page.evaluate(() => window.__EXTRATO_TEST__.getState().subjects.length)).toBe(0);
    await page.locator('#pullRemoteSyncBtn').click();
    await expect(page.locator('#modalConfirmBtn')).toBeVisible();
    await page.locator('#modalConfirmBtn').click();
    await expect
      .poll(() => page.evaluate(() => window.__EXTRATO_TEST__.getState().subjects.length))
      .toBeGreaterThan(0);
  });
});
