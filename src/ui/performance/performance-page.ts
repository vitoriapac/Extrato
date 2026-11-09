import { formatPeriodBR } from '../../core/format-date.js';
import { pluralize } from '../../core/utils.js';
// Quatro grupos no primeiro nível; grupos com mais de uma seção mostram um segundo nível.
// Os ids e data-performance-section das seções não mudam.
const groups: Array<[string, string, Array<[string, string]>]> = [
  ['overview', 'Visão geral', [['overview', 'Visão geral']]],
  [
    'subjects',
    'Disciplinas',
    [
      ['subjects', 'Por disciplina'],
      ['diagnosis', 'Diagnóstico'],
    ],
  ],
  [
    'proofs',
    'Provas',
    [
      ['questions', 'Questões'],
      ['simulations', 'Simulados'],
      ['exam', 'Inteligência da prova'],
    ],
  ],
  [
    'consistency',
    'Consistência',
    [
      ['consistency', 'Ritmo e aderência'],
      ['history', 'Histórico'],
    ],
  ],
];
export const performanceGroupOf = (section: string) =>
  groups.find(([, , items]) => items.some(([key]) => key === section))?.[0] ?? null;
const sectionButton = (key: string, label: string, active: boolean) =>
  `<button type="button" role="tab" id="performanceTab-${key}" class="performance-section-button${active ? ' active' : ''}" data-performance-section="${key}" aria-selected="${active}" aria-controls="performanceSectionContent" tabindex="${active ? 0 : -1}">${label}</button>`;
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

export function renderPerformancePage({
  viewState,
  range,
  sectionHtml = '',
  activeExamCount = 0,
  escapeHtml,
  escapeAttr,
}: any = {}) {
  const activeGroup = groups.find(([, , items]) =>
    items.some(([key]) => key === viewState.section)
  );
  const nav = groups
    .map(([groupKey, groupLabel, items]) => {
      if (items.length === 1)
        return sectionButton(items[0][0], groupLabel, viewState.section === items[0][0]);
      const active = activeGroup?.[0] === groupKey;
      return `<button type="button" role="tab" id="performanceGroupTab-${groupKey}" class="performance-section-button performance-group-button${active ? ' active' : ''}" data-performance-group="${groupKey}" data-performance-group-target="${items[0][0]}" aria-selected="${active}" aria-controls="performanceSubnav-${groupKey}" tabindex="${active ? 0 : -1}">${groupLabel}</button>`;
    })
    .join('');
  const subnav =
    activeGroup && activeGroup[2].length > 1
      ? `<div class="performance-subsection-nav" id="performanceSubnav-${activeGroup[0]}" role="tablist" aria-label="Seções de ${activeGroup[1]}">${activeGroup[2].map(([key, label]) => sectionButton(key, label, viewState.section === key)).join('')}</div>`
      : '';
  const intro = pending[viewState.section];
  const body =
    sectionHtml ||
    (viewState.section === 'exam'
      ? '<div id="examIntelligenceMount"></div>'
      : viewState.section === 'overview'
        ? '<div class="empty-state empty-state--compact" role="status"><strong>Visão geral de Desempenho</strong><p>Selecione um período para acompanhar a preparação. Os registros desta área aparecerão aqui.</p></div>'
        : `<div class="empty-state empty-state--compact" role="status"><strong>${escapeHtml(intro.title)}</strong><p>${escapeHtml(intro.description)}</p><button type="button" class="btn ghost small" data-performance-open="${escapeAttr(intro.tab)}">${escapeHtml(intro.action)}</button></div>`);
  return `<div class="performance-page"><header class="page-header"><div class="page-header__text"><h2>Desempenho</h2><p>Acompanhe sua evolução, compare períodos e identifique mudanças na sua preparação.</p></div></header>
    <div class="performance-section-nav" role="tablist" aria-label="Análises de desempenho">${nav}</div>${subnav}
    ${
      viewState.section === 'exam' ||
      viewState.section === 'history' ||
      viewState.section === 'diagnosis'
        ? ''
        : `<div class="performance-toolbar ui-filter-bar"><label>Período<select class="select-control" id="performancePeriod" data-performance-period><option value="7" ${viewState.period === '7' ? 'selected' : ''}>7 dias</option><option value="30" ${viewState.period === '30' ? 'selected' : ''}>30 dias</option><option value="90" ${viewState.period === '90' ? 'selected' : ''}>90 dias</option><option value="all" ${viewState.period === 'all' ? 'selected' : ''}>Tudo</option></select></label>
    <label class="performance-compare"><input type="checkbox" id="performanceCompare" data-performance-compare ${viewState.comparePrevious ? 'checked' : ''} ${viewState.period === 'all' ? 'disabled' : ''}> Comparar período anterior</label><div class="performance-scope-control"><span>${activeExamCount ? `Concurso ativo · ${pluralize(activeExamCount, 'escopo', 'escopos')}` : 'Todos os concursos'}</span><button type="button" class="btn ghost small" data-performance-open="metas">Alterar concurso</button></div></div>`
    }
    <p class="performance-scope-note">${viewState.section === 'exam' ? 'Histórico de provas · ' : viewState.section === 'history' ? 'Seletor de período próprio · ' : viewState.section === 'diagnosis' ? 'Situação atual · ' : escapeHtml(range.label) + ' · '}${activeExamCount ? 'Concurso ativo · ' + pluralize(activeExamCount, 'escopo') : 'Todos os concursos'}${viewState.section === 'exam' || viewState.section === 'diagnosis' ? '' : range.previous ? ' · comparação: ' + escapeHtml(formatPeriodBR(range.previous.start, range.previous.end)) : ''}</p>
    <div id="performanceSectionContent" role="tabpanel" aria-labelledby="performanceTab-${viewState.section}">${body}</div></div>`;
}
