import { test, expect } from '@playwright/test';
import { activateTab, openDemo, openPlanningSubtab } from './helpers.js';

test('confirma, distribui e desfaz um plano sem perder a navegação', async ({ page }) => {
  await openDemo(page);
  await activateTab(page, 'metas');

  await page.getByRole('button', { name: 'Recalcular plano' }).click();
  const confirmPlan = page.getByRole('button', { name: 'Confirmar e salvar plano' });
  await expect(confirmPlan).toBeVisible();
  await confirmPlan.click();
  // Plano confirmado: linha de estado e ações novas, sem texto de prévia nem atalho para o resumo.
  await expect(page.locator('#examStudyPlan .confirmed-plan-note')).toContainText(
    /Plano .+\/semana/
  );
  await expect(page.locator('#examStudyPlan')).not.toContainText(
    /divisões de atividades propostas|Ver resumo da semana/
  );
  await expect(page.getByRole('button', { name: 'Recalcular plano' })).toBeVisible();

  await page.getByRole('button', { name: 'Agendar nos próximos 7 dias' }).click();
  await expect(page.getByRole('heading', { name: 'Prévia dos próximos 7 dias' })).toBeFocused();
  const confirmDaily = page.getByRole('button', { name: 'Confirmar planos diários' });
  await expect(confirmDaily).toBeVisible();
  await confirmDaily.click();

  const undo = page.getByRole('button', { name: 'Desfazer última distribuição' });
  await expect(undo).toBeVisible();
  await undo.click();
  await expect(undo).toBeHidden();

  await activateTab(page, 'hoje');
  await expect(page.locator('#panel-hoje')).toBeVisible();
});

test('prévia explica fase da prova e sugere adaptação sem salvar automaticamente', async ({
  page,
}) => {
  await openDemo(page);
  await activateTab(page, 'metas');
  await page.getByRole('button', { name: 'Recalcular plano' }).click();
  const preview = page.locator('#examStudyPlan');
  await expect(preview.getByRole('heading', { name: 'Prévia do plano semanal' })).toBeFocused();
  await expect(preview).toContainText('Fase até a prova');
  await expect(preview.locator('.adaptive-advice')).toContainText(
    /Ajuste sugerido|Adaptação de carga|Distribuição entre disciplinas mantida/
  );
  await expect(preview.getByRole('button', { name: 'Confirmar e salvar plano' })).toBeVisible();
  await preview.getByRole('button', { name: 'Descartar proposta' }).click();
  await expect(preview.getByRole('button', { name: 'Recalcular plano' })).toBeFocused();
});

test('fase e redistribuição do plano se organizam em tela móvel', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 900 });
  await openDemo(page);
  await activateTab(page, 'metas');
  await page.getByRole('button', { name: 'Recalcular plano' }).click();
  const preview = page.locator('#examStudyPlan');
  await expect(preview.locator('.exam-phase-steps')).toBeVisible();
  await expect(preview.locator('.exam-phase-step')).toHaveCount(4);
  expect(await preview.evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
  await openPlanningSubtab(page, 'prova');
  const config = page.locator('#examBlueprintConfig .exam-subject-row').first();
  if (await config.count()) {
    await page
      .locator('#examBlueprintConfig .exam-subject-config')
      .first()
      .locator('summary')
      .click();
    expect(await config.evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
    const control = config.locator('input,select').first();
    expect(await control.evaluate(el => el.getBoundingClientRect().height)).toBeGreaterThanOrEqual(
      44
    );
  }
  const matrix = page.locator('#examMasteryMatrix .mastery-matrix');
  if (await matrix.count())
    expect(await matrix.evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
});

test('configuração por disciplina começa recolhida e mantém herança nula', async ({ page }) => {
  await page.goto('/?test=1');
  await expect(page.locator('#testReport')).toBeVisible();
  await page.evaluate(() => {
    document.getElementById('testReport')?.remove();
    const api = window.__EXTRATO_TEST__,
      state = structuredClone(api.getState()),
      subject = state.subjects[0];
    state.examBlueprint.masteryTarget = 80;
    state.examBlueprint.subjects = [
      { subjectId: subject.id, priority: 'normal', masteryTarget: null },
    ];
    api.setState(state);
    api.renderAll();
  });
  await activateTab(page, 'metas');
  await openPlanningSubtab(page, 'prova');
  const disclosure = page.locator('#examBlueprintConfig .exam-subject-config').first();
  await expect(disclosure).not.toHaveAttribute('open', '');
  await expect(disclosure.locator('summary')).toContainText('Domínio: meta geral de 80%');
  await disclosure.locator('summary').click();
  await expect(disclosure.locator('input[placeholder="Meta geral: 80%"]')).toBeVisible();
  await page.locator('#examBlueprintConfig .exam-general-config > summary').click();
  const target = page
    .locator('#examBlueprintConfig .exam-blueprint-main label')
    .nth(2)
    .locator('input');
  await target.fill('85');
  await target.press('Tab');
  await expect(
    page.locator('#examBlueprintConfig .exam-subject-config').first().locator('summary')
  ).toContainText('Domínio: meta geral de 85%');
  expect(
    await page.evaluate(
      () => window.__EXTRATO_TEST__.getState().examBlueprint.subjects[0].masteryTarget
    )
  ).toBeNull();
});

test('Visão Geral mostra a fase compacta atual da preparação', async ({ page }) => {
  await openDemo(page);
  await expect(page.locator('#overviewExamPhase')).toContainText('Fase atual');
  await expect(page.locator('#overviewExamPhase')).toContainText(
    /Construção|Consolidação|Reta final|Revisão final/
  );
});

test('a prévia de distribuição explica o que não coube e leva à disponibilidade', async ({
  page,
}) => {
  await openDemo(page);
  await openPlanningSubtab(page, 'semana');

  await page.getByRole('button', { name: 'Agendar nos próximos 7 dias' }).click();
  const note = page.locator('#examStudyPlan .helper-text', { hasText: 'Cabem' });
  await expect(note).toContainText(
    /Cabem .+ dos .+\. A disponibilidade dos 7 dias soma .+ ficam de reserva/
  );
  await expect(page.locator('#metasAdjust')).not.toHaveAttribute('open', '');

  await note.getByRole('button', { name: 'Ajustar disponibilidade' }).click();
  await expect(page.locator('#metasAdjust')).toHaveAttribute('open', '');
  await expect(page.locator('#metasCapacity')).toBeInViewport();
  // A prévia continua aberta: ajustar a disponibilidade não grava nem descarta nada.
  await expect(page.getByRole('button', { name: 'Confirmar planos diários' })).toBeVisible();
});

test('Distribuição entre disciplinas mostra planejado e realizado na ordem da legenda e das barras', async ({
  page,
}) => {
  await openDemo(page);
  await openPlanningSubtab(page, 'semana');
  await page.locator('#planExecutionCard').scrollIntoViewIfNeeded();
  await page.locator('#studyDistribution > summary').click();

  const chart = page.locator('#studyDistribution .chart-grouped-bars');
  await expect(chart).toBeVisible();
  const legend = (await chart.locator('.border-b').first().innerText()).replace(/\s+/g, ' ');
  expect(legend.indexOf('Planejado')).toBeLessThan(legend.indexOf('Realizado'));

  const rows = await chart.locator('.group').evaluateAll(nodes =>
    nodes.map(node => ({
      values: node.querySelector('.font-mono').textContent.replace(/\s+/g, ' ').trim(),
      planned: node.querySelector('[title^="Planejado:"]').getAttribute('title'),
      studied: node.querySelector('[title^="Realizado:"]').getAttribute('title'),
    }))
  );
  expect(rows.length).toBeGreaterThan(0);
  for (const row of rows) {
    const planned = /Planejado: (.+?) \(/.exec(row.planned)[1];
    const studied = /Realizado: (.+?) \(/.exec(row.studied)[1];
    expect(row.values).toBe(`Planejado ${planned} / , realizado ${studied}`);
  }
});

test('as subabas de Planejamento só mostram durações no formato 1 h 20 min, 2 h e 48 min', async ({
  page,
}) => {
  test.setTimeout(180_000);
  await page.setViewportSize({ width: 1440, height: 900 });
  await openDemo(page);
  // Formato único "1 h 20 min", "2 h", "48 min". Recusa "1h20", "20min", "35m", "60 minutos",
  // minutos soltos antes de "de 12 h" e decimais longos. Espaço literal, não s: células vizinhas não contam.
  const refused = /d+hd*|d+min|d+m|d+[ ](?:minutos?|horas?)|d{2,} de d+ (?:h|min)|d+.d{3,}%/;
  for (const key of ['semana', 'metas', 'fechamento', 'historico', 'prova']) {
    await openPlanningSubtab(page, key);
    await page
      .locator(`#metasSub-${key} details`)
      .evaluateAll(list => list.forEach(item => (item.open = true)));
    const text = await page.locator(`#metasSub-${key}`).innerText();
    const found = refused.exec(text);
    expect(
      found ? `${key}: …${text.slice(Math.max(0, found.index - 30), found.index + 25)}…` : null
    ).toBeNull();
  }
});

test('a mesma semana mostra os mesmos valores em Semana, Fechamento e Histórico', async ({
  page,
}) => {
  test.setTimeout(180_000);
  await page.setViewportSize({ width: 1440, height: 900 });
  await openDemo(page);
  const ledger = async key => {
    await openPlanningSubtab(page, key);
    const rows = await page
      .locator(`#metasSub-${key} .week-reconciliation .ledger-line`)
      .evaluateAll(list =>
        Object.fromEntries(
          list.map(row => [
            row.querySelector('.ledger-line__label').firstChild.textContent.trim(),
            row.querySelector('.ledger-line__value').textContent.trim(),
          ])
        )
      );
    return rows;
  };
  const semana = await ledger('semana');
  const fechamento = await ledger('fechamento');
  for (const label of ['Capacidade da semana', 'Com tarefa marcada', 'Estudado até hoje'])
    expect(fechamento[label], label).toBe(semana[label]);
  // O Histórico lista o período atual com os mesmos estudado e marcado.
  await openPlanningSubtab(page, 'historico');
  await page
    .locator('#metasSub-historico details')
    .evaluateAll(list => list.forEach(item => (item.open = true)));
  await expect(page.locator('#metasSub-historico')).toContainText(
    `Execução: ${semana['Estudado até hoje']} de ${semana['Com tarefa marcada']} planejados`
  );
});
