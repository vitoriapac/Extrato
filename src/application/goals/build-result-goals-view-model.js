const number = value => Number.isFinite(Number(value)) ? Number(value) : 0;

export function buildResultGoalsViewModel({ goals = {}, achieved = {}, period = {} } = {}) {
  const definitions = [
    { id: 'weeklyTopics', key: 'semanal', label: 'Tópicos na semana', description: 'Tópicos concluídos nesta semana' },
    { id: 'monthlyTopics', key: 'mensal', label: 'Tópicos no mês', description: 'Tópicos concluídos neste mês' },
    { id: 'questions', key: 'questoesSemanal', label: 'Questões na semana', description: 'Questões resolvidas nesta semana' },
    { id: 'simulations', key: 'simuladosSemanal', label: 'Simulados na semana', description: 'Simulados registrados nesta semana' },
    { id: 'accuracy', key: 'metaAprovacao', label: 'Meta de acerto', description: 'Taxa de acerto observada' }
  ];
  const items = definitions.map(item => {
    const target = goals[item.key] == null ? null : Math.max(0, number(goals[item.key]));
    const current = Math.max(0, number(achieved[item.id]));
    const measured = item.id !== 'accuracy' || achieved.accuracy != null;
    const value = item.id === 'accuracy' ? (measured ? number(achieved.accuracy) : null) : current;
    const progress = measured && target > 0 ? Math.round(value / target * 100) : null;
    const remaining = measured && target != null ? Math.max(0, target - value) : null;
    return { ...item, target, current: value, measured, progress, progressClamped: progress == null ? 0 : Math.min(100, progress), remaining, state: !measured || target == null || target <= 0 ? 'insufficient' : value >= target ? 'achieved' : 'in_progress' };
  });
  return { period, items, algorithmVersion: '1.0.0' };
}
