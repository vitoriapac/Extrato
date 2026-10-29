export const RENDER_SCOPE_SECTIONS = {
  desempenho: new Set(['desempenho']),
  dashboard: new Set([
    'primeiro uso',
    'ação e atenção',
    'dashboard de aprovação',
    'controles do cronômetro',
    'evolução do progresso',
    'conquistas',
    'radar',
    'visão geral',
    'histórico de sessões',
  ]),
  disciplinas: new Set(['disciplinas', 'primeiro uso']),
  calendario: new Set([
    'indicadores do calendário',
    'tarefas de hoje',
    'tarefas atrasadas',
    'filtros do calendário',
    'calendário',
    'calendário mensal',
  ]),
  agenda: new Set(['filtros da agenda', 'agenda', 'avisos do caderno de erros']),
  questoes: new Set(['questões', 'análise de questões', 'simulados']),
  metas: new Set([
    'metas',
    'execução do plano',
    'configuração estratégica',
    'plano até a prova',
    'metas de horas por dia',
    'metas de acerto por disciplina',
    'metas por disciplina',
    'histórico de metas',
    'ritmo',
  ]),
  hoje: new Set([
    'resumo executivo',
    'central de diagnóstico',
    'recomendação de estudo',
    'replanejamento',
    'tarefas da aba hoje',
    'atrasos da aba hoje',
    'simulados planejados',
    'metas de hoje',
    'alertas',
    'plano de hoje',
    'avisos do caderno de erros',
  ]),
};

export interface BuildRenderSectionsOptions {
  renderPerformance: () => void;
  renderKPIs: () => void;
  renderGuidedOnboarding: () => void;
  renderOverviewDecisionArea: () => void;
  renderApprovalDashboard: () => void;
  populateTimerContextControls: () => void;
  renderHeader: () => void;
  renderProgressChart: () => void;
  renderBadges: () => void;
  renderRadarDisciplinas: () => void;
  renderDashboard: () => void;
  renderStudySessionsHistory: () => void;
  renderSubjects: () => void;
  renderCalIndicadores: () => void;
  renderCalTarefasHoje: (elId?: string) => void;
  renderCalAtrasadas: (elId?: string) => void;
  renderCalendarFilters: () => void;
  renderCalendar: () => void;
  renderMonthCalendar: () => void;
  renderAgendaFilters: () => void;
  renderAgenda: () => void;
  renderErrorNotebookDueNotices: () => void;
  renderQuestoes: () => void;
  renderQuestionAnalytics: () => void;
  renderSimulados: () => void;
  renderMetas: () => void;
  renderPlanExecution: () => void;
  renderExamBlueprintConfig: () => void;
  renderStudyPlanBuilder: () => void;
  renderWeeklyHoursGoals: () => void;
  renderSubjectTargetEditor: () => void;
  renderMetasPorDisciplina: () => void;
  renderHistoricoMetas: () => void;
  renderRitmo: () => void;
  renderExecutiveSummary: () => void;
  renderDiagnosisCenter: () => void;
  renderStudyRecommendation: () => void;
  renderWeeklyReplan: () => void;
  renderSimuladosPlanejados: () => void;
  renderMetasHoje: () => void;
  renderAlertasInteligentes: () => void;
  renderPlanoHoje: () => void;
  renderDailyExecutionCard: () => void;
}

export function buildRenderSections(
  opts: BuildRenderSectionsOptions
): Array<[string, () => void]> {
  return [
    ['desempenho', opts.renderPerformance],
    ['indicadores', opts.renderKPIs],
    ['primeiro uso', opts.renderGuidedOnboarding],
    ['ação e atenção', opts.renderOverviewDecisionArea],
    ['dashboard de aprovação', opts.renderApprovalDashboard],
    ['controles do cronômetro', opts.populateTimerContextControls],
    ['cabeçalho', opts.renderHeader],
    ['evolução do progresso', opts.renderProgressChart],
    ['conquistas', opts.renderBadges],
    ['radar', opts.renderRadarDisciplinas],
    ['visão geral', opts.renderDashboard],
    ['histórico de sessões', opts.renderStudySessionsHistory],
    ['disciplinas', opts.renderSubjects],
    ['indicadores do calendário', opts.renderCalIndicadores],
    ['tarefas de hoje', () => opts.renderCalTarefasHoje()],
    ['tarefas atrasadas', () => opts.renderCalAtrasadas()],
    ['filtros do calendário', opts.renderCalendarFilters],
    ['calendário', opts.renderCalendar],
    ['calendário mensal', opts.renderMonthCalendar],
    ['filtros da agenda', opts.renderAgendaFilters],
    ['agenda', opts.renderAgenda],
    ['avisos do caderno de erros', opts.renderErrorNotebookDueNotices],
    ['questões', opts.renderQuestoes],
    ['análise de questões', opts.renderQuestionAnalytics],
    ['simulados', opts.renderSimulados],
    ['metas', opts.renderMetas],
    ['execução do plano', opts.renderPlanExecution],
    ['configuração estratégica', opts.renderExamBlueprintConfig],
    ['plano até a prova', opts.renderStudyPlanBuilder],
    ['metas de horas por dia', opts.renderWeeklyHoursGoals],
    ['metas de acerto por disciplina', opts.renderSubjectTargetEditor],
    ['metas por disciplina', opts.renderMetasPorDisciplina],
    ['histórico de metas', opts.renderHistoricoMetas],
    ['ritmo', opts.renderRitmo],
    ['resumo executivo', opts.renderExecutiveSummary],
    ['central de diagnóstico', opts.renderDiagnosisCenter],
    ['recomendação de estudo', opts.renderStudyRecommendation],
    ['replanejamento', opts.renderWeeklyReplan],
    ['tarefas da aba hoje', () => opts.renderCalTarefasHoje('hojeTarefasHoje')],
    ['atrasos da aba hoje', () => opts.renderCalAtrasadas('hojeAtrasadas')],
    ['simulados planejados', opts.renderSimuladosPlanejados],
    ['metas de hoje', opts.renderMetasHoje],
    ['alertas', opts.renderAlertasInteligentes],
    ['plano de hoje', opts.renderPlanoHoje],
    ['execução diária', opts.renderDailyExecutionCard],
  ];
}
