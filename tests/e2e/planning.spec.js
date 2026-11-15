import { test, expect } from '@playwright/test';
import { activateTab, expectNoPageOverflow, openDemo, openPlanningSubtab } from './helpers.js';

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
  // Metas por disciplina: cada linha vira um cartão empilhado, sem rolagem horizontal e com alvos de 44 px.
  const wrap = page.locator('#subjectTargetEditor .subject-target-table-wrap');
  await expect(wrap).toBeVisible();
  expect(await wrap.evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
  const control = page.locator('#subjectTargetEditor [data-field="accuracy"]').first();
  expect(await control.evaluate(el => el.getBoundingClientRect().height)).toBeGreaterThanOrEqual(
    44
  );
  const matrix = page.locator('#examMasteryMatrix .mastery-matrix');
  if (await matrix.count())
    expect(await matrix.evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
});

test('a meta geral de domínio não vira meta da disciplina: a herança continua nula', async ({
  page,
}) => {
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
  const mastery = page.locator('#subjectTargetEditor [data-field="mastery"]').first();
  await expect(mastery).toHaveAttribute('placeholder', '80');
  await expect(mastery).toHaveValue('');
  await page.locator('#examBlueprintConfig .exam-general-config > summary').click();
  const target = page.locator('#examBlueprintConfig .exam-blueprint-main').getByLabel('Meta de acerto (%)');
  await target.fill('85');
  await target.press('Tab');
  await expect(mastery).toHaveAttribute('placeholder', '85');
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
  for (const key of ['semana', 'prova', 'fechamento', 'historico']) {
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
  // O Fechamento resume a mesma semana em uma frase, com a mesma conciliação.
  const frase = async selector => (await page.locator(selector).first().innerText()).replace(/s+/g, ' ').trim();
  await openPlanningSubtab(page, 'semana');
  const fraseSemana = await frase('#metasSub-semana .week-reconciliation__sentence');
  await openPlanningSubtab(page, 'fechamento');
  expect(await frase('#metasSub-fechamento .weekly-close-line__sentence')).toBe(fraseSemana);
  // O Histórico lista o período atual com os mesmos estudado e marcado.
  await openPlanningSubtab(page, 'historico');
  await page
    .locator('#metasSub-historico details')
    .evaluateAll(list => list.forEach(item => (item.open = true)));
  await expect(page.locator('#metasSub-historico')).toContainText(
    `Execução: ${semana['Estudado até hoje']} de ${semana['Com tarefa marcada']} planejados`
  );
});

test('a Semana tem uma única lista de disciplinas, "Plano × estudado por disciplina"', async ({
  page,
}) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 1440, height: 900 });
  await openDemo(page);
  await openPlanningSubtab(page, 'semana');
  const sub = page.locator('#metasSub-semana');
  await expect(sub.getByText('Plano × estudado por disciplina', { exact: true })).toHaveCount(1);
  await expect(sub.getByText('Distribuição por disciplina')).toHaveCount(0);
  await expect(sub.getByText('Distribuição entre disciplinas')).toHaveCount(0);
  // Listas de disciplinas: só o bloco unificado tem linhas com barras por disciplina.
  await expect(sub.locator('.chart-grouped-bars')).toHaveCount(1);
  await expect(sub.locator('.chart-allocation-bar [class*="subject-bg-"]')).toHaveCount(0);
});

test('a nota do bloco de disciplinas usa o formato único de duração e o vocabulário da semana', async ({
  page,
}) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 1440, height: 900 });
  await openDemo(page);
  await openPlanningSubtab(page, 'semana');
  await page.locator('#studyDistribution').evaluate(node => (node.open = true));
  const note = await page.locator('#studyDistribution .analytics-note').first().textContent();
  expect(note).toMatch(
    /Até hoje nesta semana: \d+ h( \d+ min)? com tarefa marcada e \d+ h( \d+ min)? estudados\./
  );
});

test('perfil vazio abre a Semana com o roteiro de 3 passos e uma única ação cheia', async ({
  page,
}) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto('/?test=1');
  await page.locator('#testReport').evaluate(node => node.remove());
  await openPlanningSubtab(page, 'semana');
  const roadmap = page.locator('#metasSub-semana .plan-roadmap');
  await expect(roadmap).toBeVisible();
  await expect(roadmap.locator('li')).toHaveCount(3);
  await expect(roadmap.locator('[aria-current="step"]')).toContainText('Data da prova');
  // O roteiro vem antes do Resumo vazio e tem a única ação cheia da primeira tela.
  const firstId = await page.locator('#metasSub-semana > section').first().getAttribute('id');
  expect(firstId).toBe('metasPlanning');
  // O passo 1 é o campo de data (o do cabeçalho fica oculto fora da Visão geral); nenhum botão cheio compete.
  await expect(roadmap.locator('input[type="date"]')).toBeVisible();
  const solid = await page
    .locator('#metasSub-semana .btn:visible')
    .evaluateAll(list =>
      list.filter(b => !/ghost|tertiary|secondary/.test(b.className)).map(b => b.textContent.trim())
    );
  expect(solid).toEqual([]);
});

test('modo Essencial esconde os blocos avançados da Semana atrás de "Mostrar …" e o modo completo mostra tudo', async ({
  page,
}) => {
  test.setTimeout(150_000);
  await page.setViewportSize({ width: 1440, height: 900 });
  await openDemo(page);
  await openPlanningSubtab(page, 'semana');
  const priorities = page.locator('#metasSub-semana .metas-priority-summary');
  await page.evaluate(() => document.documentElement.removeAttribute('data-essential'));
  await expect(priorities).toBeVisible();
  await page.evaluate(() => document.documentElement.setAttribute('data-essential', 'on'));
  await expect(priorities).toBeHidden();
  const reveal = page.getByRole('button', { name: 'Mostrar execução das prioridades' });
  await expect(reveal).toBeVisible();
  await expect(page.getByRole('button', { name: 'Mostrar histórico de adaptações' })).toBeVisible();
  await reveal.click();
  await expect(priorities).toBeVisible();
});

test('perfil vazio mostra a disponibilidade fora da dobra e não inventa capacidade', async ({
  page,
}) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto('/?test=1');
  await page.locator('#testReport').evaluate(node => node.remove());
  await openPlanningSubtab(page, 'semana');
  const capacity = page.locator('#metasCapacity');
  await expect(capacity).toBeVisible();
  expect(await capacity.evaluate(node => Boolean(node.closest('#metasAdjust')))).toBe(false);
  const summary = page.locator('#planExecutionCard');
  await expect(summary).toContainText('Não informada');
  await expect(page.locator('#metasSub-semana')).not.toContainText('17 h 30 min');
  // O passo "Horas por dia" do roteiro não aparece como feito com o padrão do app.
  await expect(page.locator('.plan-roadmap__step.is-done')).toHaveCount(0);
});

test('metas: o modo Essencial mostra 3 e o modo completo mostra todas', async ({ page }) => {
  test.setTimeout(150_000);
  await page.setViewportSize({ width: 1440, height: 900 });
  await openDemo(page);
  await openPlanningSubtab(page, 'semana');
  await page.locator('#metasAdjust').evaluate(node => (node.open = true));
  const cards = page.locator('#metasContainer .meta-card');
  await page.evaluate(() => document.documentElement.setAttribute('data-essential', 'on'));
  await expect(cards.locator('visible=true')).toHaveCount(3);
  await page.evaluate(() => document.documentElement.removeAttribute('data-essential'));
  // Acerto, dias, aderência, tópicos, questões e simulados; a meta mensal saiu da tela.
  await expect(cards.locator('visible=true')).toHaveCount(6);
  await expect(page.locator('#metasContainer')).not.toContainText('Tópicos no mês');
});

test('Jordan: data da prova, horas por dia e plano seguindo só a ação principal, um clique em cada', async ({
  page,
}) => {
  test.setTimeout(150_000);
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto('/?test=1');
  await page.locator('#testReport').evaluate(node => node.remove());
  await openPlanningSubtab(page, 'semana');
  const current = page.locator('.plan-roadmap [aria-current="step"]');
  await expect(current).toContainText('Data da prova');
  await page.locator('.plan-roadmap input[type="date"]').fill('2027-03-01');
  await expect(current).toContainText('Horas por dia');
  await page.getByRole('button', { name: 'Informar horas por dia' }).click();
  await page.locator('#metasCapacity input[type="number"]').first().fill('2');
  await page.keyboard.press('Tab');
  await expect(current).toContainText('Plano da semana');
  // O blur do campo de horas acontece no mousedown do botão: o clique não pode se perder.
  await page.getByRole('button', { name: 'Calcular proposta semanal' }).click();
  // Sem tópicos com carga restante a prévia diz que o plano está indisponível; o que importa é que abriu.
  await expect(page.getByRole('heading', { name: 'Plano semanal indisponível' })).toBeVisible();
});

test('Prova e metas mostra o aviso de ritmo com o próximo passo e leva às metas', async ({
  page,
}) => {
  test.setTimeout(150_000);
  await page.setViewportSize({ width: 1440, height: 900 });
  await openDemo(page);
  await openPlanningSubtab(page, 'prova');
  const note = page.locator('#ritmoContainer .pace-next');
  await expect(note).toBeVisible();
  await expect(note.getByRole('button', { name: 'Ajustar meta' })).toBeVisible();
  await expect(note.getByRole('button', { name: /Simular/ })).toBeVisible();
  await note.getByRole('button', { name: 'Ajustar meta' }).click();
  await expect(page.locator('#metasSub-semana')).toBeVisible();
  await expect(page.locator('#metasAdjust')).toHaveJSProperty('open', true);
  await expect(page.locator('#metasActiveGoals')).toBeInViewport();
});

test('Prova e metas: um só campo "Meta de acerto" nos dois modos, que preenche nota-alvo e domínio', async ({
  page,
}) => {
  test.setTimeout(150_000);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/?test=1');
  await expect(page.locator('#testReport')).toBeVisible();
  await page.evaluate(() => document.getElementById('testReport')?.remove());
  await activateTab(page, 'metas');
  await openPlanningSubtab(page, 'prova');
  await page.locator('.exam-general-config').evaluate(node => (node.open = true));
  const main = page.locator('.exam-blueprint-main');
  for (const essential of [true, false]) {
    await page.evaluate(on => {
      if (on) document.documentElement.setAttribute('data-essential', 'on');
      else document.documentElement.removeAttribute('data-essential');
    }, essential);
    await expect(main.getByLabel('Meta de acerto (%)')).toBeVisible();
    await expect(main.getByLabel('Nota-alvo (%)')).toHaveCount(0);
    await expect(main.getByLabel('Meta geral de domínio (%)')).toHaveCount(0);
  }
  await main.getByLabel('Meta de acerto (%)').fill('73');
  await main.getByLabel('Meta de acerto (%)').blur();
  await page.locator('.exam-general-config').evaluate(node => (node.open = true));
  await expect(main.getByLabel('Meta de acerto (%)')).toHaveValue('73');
  const saved = await page.evaluate(() => {
    const state = window.__EXTRATO_TEST__.getState();
    return [state.examBlueprint.targetScore, state.examBlueprint.masteryTarget];
  });
  expect(saved).toEqual([73, 73]);
});

test('Fechamento: uma análise com tendência de 4 semanas e sinais, no máximo 2 dobras', async ({
  page,
}) => {
  test.setTimeout(150_000);
  await page.setViewportSize({ width: 1440, height: 900 });
  await openDemo(page);
  await openPlanningSubtab(page, 'fechamento');
  const close = page.locator('#weeklyCloseDashboard');
  expect(await close.locator('details').count()).toBeLessThanOrEqual(2);
  await close.locator('.weekly-close-brief > summary').click();
  await expect(close.getByRole('heading', { name: 'Últimas 4 semanas' })).toBeVisible();
  await expect(close.getByRole('heading', { name: 'Sinais da semana' })).toBeVisible();
  await close.getByText('Ver dados', { exact: true }).click();
  await expect(close.locator('.plan-execution-table')).toBeVisible();
  // A análise longa continua disponível no Histórico.
  await openPlanningSubtab(page, 'historico');
  await expect(page.locator('#weeklyCloseFullAnalysis .weekly-close-analysis > summary')).toBeVisible();
});

test('Histórico tem uma série semanal (agendado e estudado, metas em marcas) e a Semana não repete', async ({
  page,
}) => {
  test.setTimeout(150_000);
  await page.setViewportSize({ width: 1440, height: 900 });
  await openDemo(page);
  await openPlanningSubtab(page, 'historico');
  const series = page.locator('#weeklyHistorySeries');
  await expect(series.getByRole('img', { name: /^Agendado e estudado por semana: / })).toBeAttached();
  await expect(series.locator('.weekly-history-series__marks li').first()).toBeAttached();
  await series.getByText('Ver dados', { exact: true }).click();
  await expect(series.locator('.plan-execution-table')).toBeVisible();
  await openPlanningSubtab(page, 'semana');
  await expect(page.locator('#planExecutionResults .metas-execution-history')).toHaveCount(0);
  await expect(page.locator('#historicoMetasContainer')).toHaveCount(0);
});

test('Histórico da demo tem menos de 20 dobras e "Mostrar mais" revela o resto', async ({ page }) => {
  test.setTimeout(150_000);
  await page.setViewportSize({ width: 1440, height: 900 });
  await openDemo(page);
  await openPlanningSubtab(page, 'historico');
  const count = () => page.locator('#metasSub-historico details').count();
  expect(await count()).toBeLessThan(20);
  const decisions = page.locator('#decisionHistoryDashboard article');
  await expect(decisions).toHaveCount(5);
  await page.locator('#decisionHistoryDashboard').getByRole('button', { name: /^Mostrar mais/ }).click();
  expect(await decisions.count()).toBeGreaterThan(5);
  // O corpo de um retrato só existe depois de abrir.
  const retrato = page.locator('#weeklyCloseHistoryDashboard .weekly-adherence-history details').first();
  await expect(retrato.locator('.weekly-adherence')).toHaveCount(0);
  await retrato.locator('summary').first().click();
  await expect(retrato.locator('.weekly-adherence').first()).toBeAttached();
});

test('Histórico vazio no Essencial explica o que vai aparecer, sem botão solitário', async ({ page }) => {
  test.setTimeout(150_000);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/?test=1');
  await expect(page.locator('#testReport')).toBeVisible();
  await page.evaluate(() => {
    document.getElementById('testReport')?.remove();
    document.documentElement.setAttribute('data-essential', 'on');
  });
  await activateTab(page, 'metas');
  await openPlanningSubtab(page, 'historico');
  await expect(page.locator('#weeklyHistoryEmpty')).toBeVisible();
  await expect(page.getByRole('button', { name: /^Mostrar Retratos e histórico de decisões/ })).toBeHidden();
});

for (const width of [320, 375]) {
  test(`celular ${width} px: primeira ação da Semana na primeira tela, subabas fora do fixo e régua sem corte`, async ({
    page,
  }) => {
    test.setTimeout(150_000);
    await page.setViewportSize({ width, height: 812 });
    await openDemo(page);
    await openPlanningSubtab(page, 'semana');
    await page.evaluate(() => scrollTo(0, 0));
    const action = page.getByRole('button', { name: 'Ajustar disponibilidade' }).first();
    const box = await action.boundingBox();
    expect(box.y + box.height).toBeLessThanOrEqual(812);
    expect(await page.locator('.metas-nav').evaluate(n => getComputedStyle(n).position)).toBe('static');

    await openPlanningSubtab(page, 'prova');
    const clipped = await page.locator('.chart-phase-roadmap').first().evaluate(root =>
      [...root.querySelectorAll('*')].filter(
        item => item.scrollWidth > item.clientWidth + 1 || item.scrollHeight > item.clientHeight + 1
      ).length
    );
    expect(clipped).toBe(0);

    // A tabela de acerto do Fechamento tem região rolável com nome e foco.
    await openPlanningSubtab(page, 'historico');
    await page.locator('#weeklyCloseFullAnalysis .weekly-close-analysis > summary').click();
    await page.locator('.subject-accuracy-summary').evaluate(node => (node.open = true));
    await page.locator('.subject-accuracy-data > summary').click();
    const region = page.getByRole('region', { name: 'Tabela de acerto por disciplina' });
    await expect(region).toHaveAttribute('tabindex', '0');
    await expectNoPageOverflow(page);
  });
}

test('celular: Prova e metas mostra o essencial por disciplina e "Mais campos" abre o resto', async ({
  page,
}) => {
  test.setTimeout(150_000);
  await page.setViewportSize({ width: 375, height: 812 });
  await openDemo(page);
  await openPlanningSubtab(page, 'prova');
  const row = page.locator('#subjectTargetEditor tbody tr').first();
  await expect(row.locator('[data-field="accuracy"]')).toBeVisible();
  await expect(row.locator('[data-field="weekly"]')).toBeVisible();
  await expect(row.locator('[data-field="priority"]')).toBeHidden();
  await expect(row.locator('[data-field="weight"]')).toBeHidden();
  const toggle = row.getByRole('button', { name: /^Mais campos de / });
  await toggle.click();
  const open = page.locator('#subjectTargetEditor tbody tr').first();
  await expect(open.locator('[data-field="priority"]')).toBeVisible();
  await expect(open.getByRole('button', { name: /^Menos campos de / })).toHaveAttribute('aria-expanded', 'true');
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  expect(height).toBeLessThan(10000);
});

test('Fechamento no celular: o resumo da semana é uma linha e o retrato aparece na primeira rolagem', async ({
  page,
}) => {
  test.setTimeout(150_000);
  await page.setViewportSize({ width: 375, height: 812 });
  await openDemo(page);
  await openPlanningSubtab(page, 'fechamento');
  await expect(page.locator('#weeklyCloseDashboard .week-reconciliation')).toHaveCount(0);
  const retrato = page.getByRole('button', { name: 'Revisar o retrato da semana' });
  await retrato.scrollIntoViewIfNeeded();
  const top = await retrato.evaluate(node => node.getBoundingClientRect().top + scrollY);
  expect(top).toBeLessThan(1200);
});
