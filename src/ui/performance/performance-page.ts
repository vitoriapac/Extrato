import { formatPeriodBR } from '../../core/format-date.js';
import { pluralize } from '../../core/utils.js';
const sections = [
  ['overview', 'Visão geral'],
  ['subjects', 'Disciplinas'],
  ['questions', 'Questões'],
  ['simulations', 'Simulados'],
  ['exam', 'Inteligência da prova'],
  ['consistency', 'Consistência'],
  ['history', 'Histórico'],
];
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
    description:
      'Acompanhe a evolução detalhada por disciplina e tópicos do concurso.',
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

export function renderPerformancePage({
  viewState,
  range,
  sectionHtml = '',
  activeExamCount = 0,
  escapeHtml,
  escapeAttr,
}: any = {}) {
  const nav = sections
    .map(
      ([key, label]) =>
        `<button type="button" class="performance-section-button${viewState.section === key ? ' active' : ''}" data-performance-section="${key}" aria-pressed="${viewState.section === key}">${label}</button>`
    )
    .join('');
  const intro = pending[viewState.section];
  const body =
    sectionHtml ||
    (viewState.section === 'exam'
      ? '<div id="examIntelligenceMount"></div>'
      : viewState.section === 'overview'
        ? '<div class="empty-state empty-state--compact" role="status"><strong>Visão geral de Desempenho</strong><p>Selecione um período para acompanhar a preparação. Os registros desta área aparecerão aqui.</p></div>'
        : `<div class="empty-state empty-state--compact" role="status"><strong>${escapeHtml(intro.title)}</strong><p>${escapeHtml(intro.description)}</p><button type="button" class="btn ghost small" data-performance-open="${escapeAttr(intro.tab)}">${escapeHtml(intro.action)}</button></div>`);
  return `<div class="performance-page"><header class="page-header"><div class="page-header__text"><h2>Desempenho</h2><p>Acompanhe sua evolução, compare períodos e identifique mudanças na sua preparação.</p></div></header>
    <nav class="performance-section-nav" aria-label="Análises de desempenho">${nav}</nav>
    ${
      viewState.section === 'exam' || viewState.section === 'history'
        ? ''
        : `<div class="performance-toolbar ui-filter-bar"><label>Período<select class="select-control" id="performancePeriod" data-performance-period><option value="7" ${viewState.period === '7' ? 'selected' : ''}>7 dias</option><option value="30" ${viewState.period === '30' ? 'selected' : ''}>30 dias</option><option value="90" ${viewState.period === '90' ? 'selected' : ''}>90 dias</option><option value="all" ${viewState.period === 'all' ? 'selected' : ''}>Tudo</option></select></label>
    <label class="performance-compare"><input type="checkbox" id="performanceCompare" data-performance-compare ${viewState.comparePrevious ? 'checked' : ''} ${viewState.period === 'all' ? 'disabled' : ''}> Comparar período anterior</label><div class="performance-scope-control"><span>${activeExamCount ? `Concurso ativo · ${pluralize(activeExamCount, 'escopo', 'escopos')}` : 'Todos os concursos'}</span><button type="button" class="btn ghost small" data-performance-open="metas">Alterar concurso</button></div></div>`
    }
    <p class="performance-scope-note">${viewState.section === 'exam' ? 'Histórico de provas · ' : viewState.section === 'history' ? '' : escapeHtml(range.label) + ' · '}${activeExamCount ? 'Concurso ativo · ' + pluralize(activeExamCount, 'escopo') : 'Todos os concursos'}${viewState.section === 'exam' ? '' : range.previous ? ' · comparação: ' + escapeHtml(formatPeriodBR(range.previous.start, range.previous.end)) : ''}</p>
    <div id="performanceSectionContent">${body}</div></div>`;
}
