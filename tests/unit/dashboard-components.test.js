import test from 'node:test';
import assert from 'node:assert/strict';
import { h } from 'preact';
import { render } from 'preact-render-to-string';
import { QuickStatsGrid } from '../../src/ui/tabs/dashboard/QuickStatsGrid.js';
import { SubjectProgressList } from '../../src/ui/tabs/dashboard/SubjectProgressList.js';
import { UpcomingReviewsList } from '../../src/ui/tabs/dashboard/UpcomingReviewsList.js';
import { createDashboardTabController } from '../../src/ui/tabs/dashboard/dashboard-tab-controller.js';

test('QuickStatsGrid Preact Component — renderiza contadores de tópicos', () => {
  const html = render(
    h(QuickStatsGrid, {
      total: 50,
      naoIniciado: 20,
      emAndamento: 15,
      concluido: 15,
    })
  );

  assert.match(html, /50/);
  assert.match(html, /Tópicos totais/);
  assert.match(html, /20/);
  assert.match(html, /Não iniciados/);
  assert.match(html, /15/);
  assert.match(html, /Em andamento/);
  assert.match(html, /Concluídos/);
});

test('SubjectProgressList Preact Component — renderiza barras de progresso ou vazio', () => {
  const emptyHtml = render(h(SubjectProgressList, { subjects: [] }));
  assert.match(emptyHtml, /Adicione disciplinas na aba/);
  assert.match(emptyHtml, /Disciplinas/);

  const html = render(
    h(SubjectProgressList, {
      subjects: [
        { id: 's1', name: 'Português', percentage: 75 },
        { id: 's2', name: 'Matemática', percentage: 40 },
      ],
    })
  );

  assert.match(html, /Português/);
  assert.match(html, /width:75%/);
  assert.match(html, /75%/);
  assert.match(html, /Matemática/);
  assert.match(html, /width:40%/);
  assert.match(html, /40%/);
});

test('UpcomingReviewsList Preact Component — renderiza itens ou vazio', () => {
  const emptyHtml = render(h(UpcomingReviewsList, { items: [] }));
  assert.match(emptyHtml, /Nenhuma revisão futura cadastrada/);

  const html = render(
    h(UpcomingReviewsList, {
      items: [
        {
          id: 'u1',
          date: '2026-03-20',
          dateFormatted: '20/03/2026',
          subject: 'Direito',
          label: 'Controle de Constitucionalidade · R1',
          status: 'Pendente',
          origem: 'Agenda de Revisões',
        },
      ],
    })
  );

  assert.match(html, /20\/03\/2026/);
  assert.match(html, /Direito/);
  assert.match(html, /Controle de Constitucionalidade/);
  assert.match(html, /Agenda de Revisões/);
  assert.match(html, /Pendente/);
});

test('createDashboardTabController — gera HTML dos 3 blocos da visão geral', () => {
  const controller = createDashboardTabController();

  const statsHtml = controller.renderQuickStatsHtml({
    total: 10,
    naoIniciado: 5,
    emAndamento: 3,
    concluido: 2,
  });
  assert.match(statsHtml, /Tópicos totais/);

  const barsHtml = controller.renderProgressBarsHtml([{ id: 's1', name: 'TI', percentage: 100 }]);
  assert.match(barsHtml, /TI/);
  assert.match(barsHtml, /100%/);

  const upcomingHtml = controller.renderUpcomingListHtml([]);
  assert.match(upcomingHtml, /Nenhuma revisão futura cadastrada/);
});
