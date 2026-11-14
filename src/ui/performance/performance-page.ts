import { h } from 'preact';
import { render as renderToString } from 'preact-render-to-string';
import { formatPeriodBR } from '../../core/format-date.js';
import { pluralize } from '../../core/utils.js';
import { PerformancePageNav, performanceGroupOf } from './PerformancePageNav.js';

export { performanceGroupOf };

const pending: Record<string, Record<string, string>> = {
  questions: {
    title: 'Questões',
    description:
      'Acompanhe a evolução da precisão, volume e perfil de erros nos períodos da sua preparação.',
    tab: 'questoes',
    action: 'Registrar questões',
  },
  simulations: {
    title: 'Simulados',
    description:
      'Resultados de simulados, evolução das notas, comparação por disciplina e calibração da prova.',
    tab: 'questoes',
    action: 'Registrar simulado',
  },
  subjects: {
    title: 'Disciplinas',
    description: 'Acompanhe a evolução detalhada por disciplina e tópicos do concurso.',
    tab: 'disciplinas',
    action: 'Ver disciplinas',
  },
  consistency: {
    title: 'Consistência',
    description: 'Histórico de estudo, ritmo diário e execução do plano de estudos.',
    tab: 'metas',
    action: 'Ver planejamento',
  },
};

export function renderPerformanceDefaultBody({
  viewState,
  escapeHtml,
  escapeAttr,
}: {
  viewState: { section: string };
  escapeHtml: (text: any) => string;
  escapeAttr: (text: any) => string;
}): string {
  const intro = pending[viewState.section];
  if (viewState.section === 'exam') return '<div id="examIntelligenceMount"></div>';
  if (viewState.section === 'overview' || !intro) {
    return '<div class="empty-state empty-state--compact" role="status"><strong>Visão geral de Desempenho</strong><p>Selecione um período para acompanhar a preparação. Os registros desta área aparecerão aqui.</p></div>';
  }
  return `<div class="empty-state empty-state--compact" role="status"><strong>${escapeHtml(intro.title)}</strong><p>${escapeHtml(intro.description)}</p><button type="button" class="btn ghost small" data-performance-open="${escapeAttr(intro.tab)}">${escapeHtml(intro.action)}</button></div>`;
}

export function renderPerformanceChromeHtml({
  viewState,
  range,
  activeExamCount = 0,
  escapeHtml,
}: {
  viewState: { section: string; period: string; comparePrevious: boolean };
  range: { label: string; previous?: { start: string | null; end: string | null } | null };
  activeExamCount?: number;
  escapeHtml: (text: any) => string;
}): string {
  const hasToolbar = !['exam', 'diagnosis'].includes(viewState.section);
  const scopeLabel = activeExamCount
    ? 'Concurso ativo · ' + pluralize(activeExamCount, 'escopo')
    : 'Todos os concursos';
  const prevStart = range.previous?.start;
  const prevEnd = range.previous?.end;
  const periodText =
    viewState.section === 'exam'
      ? 'Histórico de provas'
      : viewState.section === 'diagnosis'
        ? 'Situação atual'
        : escapeHtml(range.label);
  const restText = [
    // Com a barra de filtros visível, o escopo já aparece nela.
    hasToolbar ? '' : scopeLabel,
    viewState.section === 'exam' || viewState.section === 'diagnosis' || !prevStart || !prevEnd
      ? ''
      : 'comparação: ' + escapeHtml(formatPeriodBR(prevStart, prevEnd)),
  ]
    .filter(Boolean)
    .join(' · ');
  // No celular o resumo dos filtros já diz o período: o trecho do período some e sobra só a comparação.
  const scopeNote = hasToolbar
    ? `<span class="performance-scope-note__period">${periodText}${restText ? ' · ' : ''}</span>${restText}`
    : [periodText, restText].filter(Boolean).join(' · ');

  const toolbarHtml = !hasToolbar
    ? ''
    : `<div class="performance-toolbar ui-filter-bar" id="performanceToolbar" data-collapsed="true"><div class="performance-toolbar__summary"><span>${escapeHtml(range.label)}${viewState.comparePrevious && range.previous ? ' · comparando' : ''}</span><button type="button" class="btn ghost small" data-performance-filters-toggle aria-expanded="false" aria-controls="performanceToolbar">Alterar filtros</button></div><label>Período<select class="select-control ui-select-field__control" id="performancePeriod" data-performance-period><option value="7" ${viewState.period === '7' ? 'selected' : ''}>7 dias</option><option value="30" ${viewState.period === '30' ? 'selected' : ''}>30 dias</option><option value="90" ${viewState.period === '90' ? 'selected' : ''}>90 dias</option><option value="all" ${viewState.period === 'all' ? 'selected' : ''}>Tudo</option></select></label>
    <label class="performance-compare"><input type="checkbox" id="performanceCompare" data-performance-compare ${viewState.comparePrevious ? 'checked' : ''} ${viewState.period === 'all' ? 'disabled' : ''}> Comparar período anterior</label><div class="performance-scope-control"><span>${activeExamCount ? `Concurso ativo · ${pluralize(activeExamCount, 'escopo', 'escopos')}` : 'Todos os concursos'}</span><button type="button" class="btn ghost small" data-performance-open="metas">Alterar concurso</button></div></div>`;

  return `${toolbarHtml}<p class="performance-scope-note">${scopeNote}</p>`;
}

export function renderPerformancePage({
  viewState,
  range,
  sectionHtml = '',
  activeExamCount = 0,
  escapeHtml,
  escapeAttr,
}: any = {}) {
  const navHtml = renderToString(h(PerformancePageNav, { activeSection: viewState.section }));
  const chromeHtml = renderPerformanceChromeHtml({
    viewState,
    range,
    activeExamCount,
    escapeHtml,
  });
  const body = sectionHtml || renderPerformanceDefaultBody({ viewState, escapeHtml, escapeAttr });

  return `<div class="performance-page"><header class="page-header"><div class="page-header__text"><h2>Desempenho</h2><p>Acompanhe sua evolução, compare períodos e identifique mudanças na sua preparação.</p></div></header>
    ${navHtml}
    ${chromeHtml}
    <div id="performanceSectionContent" role="tabpanel" aria-labelledby="performanceTab-${viewState.section}">${body}</div></div>`;
}
