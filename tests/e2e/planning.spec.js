import { test, expect } from '@playwright/test';
import { activateTab, openDemo, openPlanningSubtab } from './helpers.js';

test('confirma, distribui e desfaz um plano sem perder a navegação', async ({ page }) => {
  await openDemo(page);
  await activateTab(page, 'metas');

  await page.getByRole('button', { name: 'Calcular proposta semanal' }).click();
  const confirmPlan = page.getByRole('button', { name: 'Confirmar e salvar plano' });
  await expect(confirmPlan).toBeVisible();
  await confirmPlan.click();
  await expect(page.getByText('Plano confirmado', { exact: true })).toBeVisible();
  await expect(page.locator('.study-plan-guidance')).toContainText(
    'Distribua o plano nos próximos 7 dias'
  );
  await page.getByRole('link', { name: 'Ver resumo da semana' }).click();
  await expect(page.locator('#planExecutionCard')).toBeInViewport();

  await page.getByRole('button', { name: 'Distribuir nos próximos 7 dias' }).click();
  await expect(page.getByRole('heading', { name: 'Prévia dos próximos 7 dias' })).toBeFocused();
  const confirmDaily = page.getByRole('button', { name: 'Confirmar planos diários' });
  await expect(confirmDaily).toBeVisible();  await confirmDaily.click();

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
  await page.getByRole('button', { name: 'Calcular proposta semanal' }).click();
  const preview = page.locator('#examStudyPlan');
  await expect(preview.getByRole('heading', { name: 'Prévia do plano semanal' })).toBeFocused();
  await expect(preview).toContainText('Fase até a prova');
  await expect(preview.locator('.adaptive-advice')).toContainText(
    /Ajuste sugerido|Adaptação de carga|Distribuição entre disciplinas mantida/
  );
  await expect(preview.getByRole('button', { name: 'Confirmar e salvar plano' })).toBeVisible();
  await preview.getByRole('button', { name: 'Descartar proposta' }).click();
  await expect(preview.getByRole('button', { name: 'Calcular proposta semanal' })).toBeFocused();
});

test('fase e redistribuição do plano se organizam em tela móvel', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 900 });
  await openDemo(page);
  await activateTab(page, 'metas');
  await page.getByRole('button', { name: 'Calcular proposta semanal' }).click();
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

  await page.getByRole('button', { name: 'Distribuir nos próximos 7 dias' }).click();
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

test('as subabas de Planejamento só mostram durações no formato 1h20, 2h e 48min', async ({
  page,
}) => {
  test.setTimeout(180_000);
  await page.setViewportSize({ width: 1440, height: 900 });
  await openDemo(page);
  // Recusa "1h 20m", "35m", "60 min", "60 minutos", "10 h 23 min" e "0h00".
  // Espaço literal, não \s: células vizinhas separadas por quebra de linha não contam.
  const refused =
    /\b\d+h[ ]\d+|\b\d+h\d{2}m\b|(?<![\dh])\d+m\b|\b\d+[ ](?:min|minutos?|h)\b|\b\d+h00\b|\b0h\d{2}\b/;
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
