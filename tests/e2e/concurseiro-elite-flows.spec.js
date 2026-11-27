import { test, expect } from '@playwright/test';
import { activateTab, expectNoPageOverflow, openDemo } from './helpers.js';

const PICTOGRAPHIC_RE = /\p{Extended_Pictographic}/u;

test.describe('concurseiro elite flows', () => {
  test('entrada expressa, jurisprudência, recorte de lei, discursiva Cebraspe e raio-X pós-edital sem emojis ou overflow', async ({
    page,
  }) => {
    await openDemo(page);

    // 1. Entrada expressa de questões em Questões
    await activateTab(page, 'questoes');
    await expect(page.getByTestId('quick-question-entry-bar')).toBeVisible();
    await page.locator('#quickQuestionShorthandInput').fill('30q 25c 2b fgv 35m');
    const preview = page.getByTestId('quick-question-preview');
    await expect(preview).toContainText('30');
    await expect(preview).toContainText('25');
    await expect(preview).toContainText('FGV');
    await page.locator('#quickQuestionSubmitBtn').click();
    await expect(page.locator('#questoesBody')).toContainText('30');
    await expectNoPageOverflow(page);
    expect(PICTOGRAPHIC_RE.test(await page.locator('#panel-questoes').innerText())).toBe(false);

    // 2. Recorte de artigos na lei seca e Caderno de Jurisprudência STF/STJ em Disciplinas
    await activateTab(page, 'disciplinas');

    await page.locator('#subjectsTab-leis').click();
    await expect(page.locator('#lawNotebookCard')).toBeVisible();
    await page.locator('#lawNotebookMount input[placeholder*="CF/88"]').fill('CF/88 Adm');
    await page.locator('#lawNotebookMount summary:has-text("Recorte e artigos quentes")').click();
    await page.locator('[aria-label="Artigo inicial do recorte"]').fill('37');
    await page.locator('[aria-label="Artigo final do recorte"]').fill('41');
    await page.locator('[aria-label="Artigos quentes mais cobrados"]').fill('Art. 37 §6º');
    await page.locator('#lawNotebookMount button:has-text("Adicionar lei")').click();
    await expect(page.locator('#lawNotebookMount')).toContainText('Arts. 37–41');
    await page.locator('#lawNotebookMount input[id^="lawRead-"]').first().fill('39');
    await page
      .locator('#lawNotebookMount form.law-row__actions button[type="submit"]')
      .first()
      .click();
    await expect(page.locator('#lawNotebookMount')).toContainText('Art. 39 (recorte 37–41)');

    await page.locator('#subjectsTab-jurisprudencia').click();
    await expect(page.locator('#jurisprudenceNotebookCard')).toBeVisible();
    await page.locator('#jurisCodeInput').fill('SV 13');
    await page.locator('#jurisTitleInput').fill('Vedação ao nepotismo');
    await page.locator('#jurisThesisInput').fill('Veda nomeação de parentes até 3º grau.');
    await page.locator('#jurisAddBtn').click();
    await expect(page.locator('#jurisprudenceNotebookMount')).toContainText('SV 13');
    await page.locator('[data-testid^="juris-review-"]').first().click();
    await expect(page.locator('#jurisprudenceNotebookMount')).toContainText('1 revisão');
    await expectNoPageOverflow(page);
    expect(PICTOGRAPHIC_RE.test(await page.locator('#panel-disciplinas').innerText())).toBe(false);

    // 3. Raio-X Pós-Edital na visão verticalizada (somente em memória)
    await page.locator('#subjectsTab-verticalizado').click();
    await page.locator('#openPostEditalDiffBtn').click();
    await page
      .locator('#postEditalDiffTextarea')
      .fill(
        'DIREITO ADMINISTRATIVO:\nAtos administrativos; Lei nº 8.112/1990; Licitações e Contratos Administrativos.'
      );
    await page.locator('#postEditalDiffAnalyzeBtn').click();
    const diffResults = page.getByTestId('post-edital-diff-results');
    await expect(diffResults).toBeVisible();
    await expect(diffResults).toContainText('Aproveitamento da bagagem');
    await page.locator('#postEditalDiffOverlay button:has-text("Fechar")').click();
    await expectNoPageOverflow(page);

    // 4. Discursiva técnica com desconto gramatical Cebraspe + Teto semanal de revisão em Agenda
    await activateTab(page, 'agenda');
    await page.locator('#weeklyReviewBudgetSelect').selectOption('20');
    await expect(page.locator('#weeklyReviewBudgetSelect')).toHaveValue('20');

    await page.locator('#addCalRowBtn').click();
    await page.locator('#calActivityTitle').fill('Estudo de Caso Controle Externo');
    await page.locator('#calActivityKind').selectOption('essay');
    await page.locator('#calEssayKind').selectOption('estudo_caso');
    await page.locator('#calEssayScoringMode').selectOption('cebraspe_linhas');
    await page.locator('#calEssayStatus').selectOption('graded');
    await page.locator('#calEssayScore').fill('18');
    await page.locator('#calEssayMaxScore').fill('20');
    await page.locator('#calEssayLinesWritten').fill('30');
    await page.locator('#calEssayGrammarErrors').fill('6');
    await page.locator('#calEssayErrorWeight').fill('2');
    await expect(page.getByTestId('cebraspe-essay-preview')).toContainText('17.6');
    await page.locator('#calendarActivityModal button[type="submit"]').click();
    await expect(page.locator('#essayEvolutionCard')).toContainText('17.6/20');
    await expect(page.locator('#essayEvolutionCard')).toContainText('Estudo de caso');
    await expectNoPageOverflow(page);
    expect(PICTOGRAPHIC_RE.test(await page.locator('#panel-agenda').innerText())).toBe(false);
  });

  test('bateria mista de revisões consolida >= 3 revisões devidas com suporte a desfazer', async ({
    page,
  }) => {
    await page.goto('/?test=1');
    await expect(page.locator('#testReport')).toBeVisible();
    await page.locator('#testReport').evaluate(el => el.remove());

    await page.evaluate(() => {
      const api = window.__EXTRATO_TEST__;
      const state = structuredClone(api.getState());
      const subId = state.subjects[0]?.id || 'sub-test';
      const today = api.todayISO();
      state.reviewAgenda = [
        {
          id: 'rev-batch-1',
          subjectId: subId,
          topicId: state.subjects[0]?.topics?.[0]?.id || null,
          date: today,
          tipo: 'Revisão 7 dias',
          status: 'Não iniciado',
        },
        {
          id: 'rev-batch-2',
          subjectId: subId,
          topicId: state.subjects[0]?.topics?.[0]?.id || null,
          date: today,
          tipo: 'Revisão 15 dias',
          status: 'Não iniciado',
        },
        {
          id: 'rev-batch-3',
          subjectId: subId,
          topicId: state.subjects[0]?.topics?.[0]?.id || null,
          date: today,
          tipo: 'Revisão 30 dias',
          status: 'Não iniciado',
        },
      ];
      api.setState(state);
      api.renderAll();
    });

    await activateTab(page, 'agenda');
    const batchBtn = page.locator('[data-testid^="open-mixed-review-batch-"]').first();
    await expect(batchBtn).toBeVisible();
    await batchBtn.click();

    await expect(page.locator('#mixedReviewBatchOverlay')).toHaveClass(/show/);
    await page.locator('#mixedBatchResolved').fill('20');
    await page.locator('#mixedBatchCorrect').fill('18');
    await expect(page.locator('#mixedReviewBatchOverlay')).toContainText('90%');
    await page.locator('#mixedBatchConfirmBtn').click();

    await expect(page.locator('#mixedReviewBatchOverlay')).not.toHaveClass(/show/);
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            window.__EXTRATO_TEST__
              .getState()
              .reviewAgenda.filter(r => r.status === 'Concluído').length
        )
      )
      .toBe(3);

    const undoBtn = page.locator('button:has-text("Desfazer")').first();
    await expect(undoBtn).toBeVisible();
    await undoBtn.click();
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            window.__EXTRATO_TEST__
              .getState()
              .reviewAgenda.filter(r => r.status === 'Concluído').length
        )
      )
      .toBe(0);
    expect(PICTOGRAPHIC_RE.test(await page.locator('#panel-agenda').innerText())).toBe(false);
  });
});
