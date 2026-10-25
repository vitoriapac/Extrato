import { buildStrategicAchievements } from '../../application/achievements/build-strategic-achievements.js';
import { buildAchievementViewModel } from '../../application/achievements/build-achievement-view-model.js';
import { renderAchievementGroups } from '../renderers/achievement-renderer.js';

export interface AchievementsControllerOptions {
  document: Document;
  getState: () => any;
  allTopics: () => any[];
  activeSubjects: () => any[];
  subjectProgress: (subject: any) => number;
  computeStreak: (dates: Set<string>) => number;
  getActivityDates: () => Set<string>;
  intelligenceCandidates?: () => any[];
  escapeHtml?: (str: string) => string;
}

export const STRATEGIC_BADGES = [
  {
    id: 'strategist',
    icon: '◎',
    name: 'Estrategista',
    desc: 'Estudou 10 tópicos de alto impacto no concurso ativo.',
  },
  {
    id: 'criticalCoverage',
    icon: '▰',
    name: 'Cobertura crítica',
    desc: 'Alcançou domínio 70+ com evidência em todos os tópicos de alto impacto de uma disciplina (mínimo de dois).',
  },
  {
    id: 'mappedExam',
    icon: '▦',
    name: 'Prova mapeada',
    desc: 'Reuniu pelo menos quatro provas históricas completas no concurso ativo.',
  },
];

export const CONSISTENCY_BADGE_IDS = new Set([
  'firstSession',
  'streak3',
  'streak7',
  'streak14',
  'streak30',
  'hours10',
  'hours50',
  'hours100',
]);

export function createAchievementsController(options: AchievementsControllerOptions) {
  const {
    document,
    getState,
    allTopics,
    activeSubjects,
    subjectProgress,
    computeStreak,
    getActivityDates,
    intelligenceCandidates = () => [],
  } = options;

  const escapeHtml =
    options.escapeHtml ||
    ((str: string) =>
      String(str || '').replace(
        /[&<>"']/g,
        m =>
          ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;',
          })[m] || ''
      ));

  function getBadgesDefinitions() {
    const state = getState();
    return [
      {
        id: 'firstSession',
        icon: '▶',
        name: 'Primeiros passos',
        desc: 'Primeira sessão concluída',
        check: () => (state.studySessions || []).length >= 1,
      },
      {
        id: 'streak3',
        icon: '⚡',
        name: 'Ritmo iniciado',
        desc: '3 dias seguidos estudando',
        check: () => computeStreak(getActivityDates()) >= 3,
      },
      {
        id: 'streak7',
        icon: '🔥',
        name: 'Uma semana de foco',
        desc: '7 dias seguidos estudando',
        check: () => computeStreak(getActivityDates()) >= 7,
      },
      {
        id: 'streak14',
        icon: '◆',
        name: 'Duas semanas de foco',
        desc: '14 dias seguidos estudando',
        check: () => computeStreak(getActivityDates()) >= 14,
      },
      {
        id: 'streak30',
        icon: '🏆',
        name: 'Mês de ferro',
        desc: '30 dias seguidos estudando',
        check: () => computeStreak(getActivityDates()) >= 30,
      },
      {
        id: 'subject100',
        icon: '🎯',
        name: 'Disciplina dominada',
        desc: 'Uma disciplina 100% concluída',
        check: () =>
          (state.subjects || []).some(
            (s: any) => (s.topics || []).length > 0 && subjectProgress(s) === 100
          ),
      },
      {
        id: 'allsubjects',
        icon: '🗂️',
        name: 'Plano completo',
        desc: 'Todas as disciplinas 100%',
        check: () => {
          const active = activeSubjects();
          return (
            active.length > 0 &&
            active.every(
              (s: any) =>
                (s.topics || []).some((t: any) => !t.archived) && subjectProgress(s) === 100
            )
          );
        },
      },
      {
        id: 'topics10',
        icon: '✅',
        name: 'Dez tópicos',
        desc: '10 tópicos concluídos',
        check: () => allTopics().filter((t: any) => t.status === 'Concluído').length >= 10,
      },
      {
        id: 'topics50',
        icon: '📚',
        name: 'Cinquenta tópicos',
        desc: '50 tópicos concluídos',
        check: () => allTopics().filter((t: any) => t.status === 'Concluído').length >= 50,
      },
      {
        id: 'q100',
        icon: '✍️',
        name: 'Cem questões',
        desc: '100 questões resolvidas',
        check: () =>
          (state.questoes || []).reduce(
            (sum: number, q: any) => sum + (Number(q.resolved) || 0),
            0
          ) >= 100,
      },
      {
        id: 'q500',
        icon: '🧠',
        name: 'Quinhentas questões',
        desc: '500 questões resolvidas',
        check: () =>
          (state.questoes || []).reduce(
            (sum: number, q: any) => sum + (Number(q.resolved) || 0),
            0
          ) >= 500,
      },
      {
        id: 'q1000',
        icon: '✦',
        name: 'Mil questões',
        desc: '1.000 questões resolvidas',
        check: () =>
          (state.questoes || []).reduce(
            (sum: number, q: any) => sum + (Number(q.resolved) || 0),
            0
          ) >= 1000,
      },
      {
        id: 'hours10',
        icon: '◷',
        name: 'Dez horas',
        desc: '10 horas de estudo registradas',
        check: () =>
          (state.studySessions || []).reduce(
            (sum: number, item: any) => sum + (Number(item.durationSeconds) || 0),
            0
          ) >= 36000,
      },
      {
        id: 'hours50',
        icon: '◷',
        name: 'Cinquenta horas',
        desc: '50 horas de estudo registradas',
        check: () =>
          (state.studySessions || []).reduce(
            (sum: number, item: any) => sum + (Number(item.durationSeconds) || 0),
            0
          ) >= 180000,
      },
      {
        id: 'hours100',
        icon: '◷',
        name: 'Cem horas',
        desc: '100 horas de estudo registradas',
        check: () =>
          (state.studySessions || []).reduce(
            (sum: number, item: any) => sum + (Number(item.durationSeconds) || 0),
            0
          ) >= 360000,
      },
      {
        id: 'sim1',
        icon: '📝',
        name: 'Primeiro simulado',
        desc: 'Completou o primeiro simulado',
        check: () => (state.simulados || []).length >= 1,
      },
      {
        id: 'sim5',
        icon: '🏅',
        name: 'Cinco simulados',
        desc: 'Completou 5 simulados',
        check: () => (state.simulados || []).length >= 5,
      },
      {
        id: 'reviews25',
        icon: '↻',
        name: 'Revisor disciplinado',
        desc: '25 revisões concluídas',
        check: () =>
          (state.reviewAgenda || []).filter((item: any) => item.status === 'Concluído').length >=
          25,
      },
      {
        id: 'coverage50',
        icon: '▰',
        name: 'Edital em andamento',
        desc: '50% do conteúdo concluído',
        check: () => {
          const topics = allTopics();
          return (
            topics.length > 0 &&
            topics.filter((item: any) => item.status === 'Concluído').length / topics.length >= 0.5
          );
        },
      },
      {
        id: 'recommendation1',
        icon: '◎',
        name: 'Inteligência aplicada',
        desc: 'Primeira recomendação concluída',
        check: () => (state.recommendationFeedback || []).some((item: any) => item.completed),
      },
      {
        id: 'recommendationPositive',
        icon: '★',
        name: 'Estratégia funcionando',
        desc: 'Recomendação com resultado positivo',
        check: () =>
          (state.recommendationFeedback || []).some(
            (item: any) => item.outcome?.state === 'positive'
          ),
      },
    ];
  }

  function evaluateAchievements() {
    const state = getState();
    const topics = allTopics();
    const activeTopics = topics.filter((item: any) => !item.archived);

    const progressByBadge: Record<string, { current: number; target: number; unit: string }> = {
      topics10: {
        current: activeTopics.filter((item: any) => item.status === 'Concluído').length,
        target: 10,
        unit: 'tópicos',
      },
      topics50: {
        current: activeTopics.filter((item: any) => item.status === 'Concluído').length,
        target: 50,
        unit: 'tópicos',
      },
      q100: {
        current: (state.questoes || []).reduce(
          (sum: number, item: any) => sum + (Number(item.resolved) || 0),
          0
        ),
        target: 100,
        unit: 'questões',
      },
      q500: {
        current: (state.questoes || []).reduce(
          (sum: number, item: any) => sum + (Number(item.resolved) || 0),
          0
        ),
        target: 500,
        unit: 'questões',
      },
      q1000: {
        current: (state.questoes || []).reduce(
          (sum: number, item: any) => sum + (Number(item.resolved) || 0),
          0
        ),
        target: 1000,
        unit: 'questões',
      },
      hours10: {
        current:
          (state.studySessions || []).reduce(
            (sum: number, item: any) => sum + (Number(item.durationSeconds) || 0),
            0
          ) / 3600,
        target: 10,
        unit: 'horas',
      },
      hours50: {
        current:
          (state.studySessions || []).reduce(
            (sum: number, item: any) => sum + (Number(item.durationSeconds) || 0),
            0
          ) / 3600,
        target: 50,
        unit: 'horas',
      },
      hours100: {
        current:
          (state.studySessions || []).reduce(
            (sum: number, item: any) => sum + (Number(item.durationSeconds) || 0),
            0
          ) / 3600,
        target: 100,
        unit: 'horas',
      },
      sim5: { current: (state.simulados || []).length, target: 5, unit: 'simulados' },
      reviews25: {
        current: (state.reviewAgenda || []).filter((item: any) => item.status === 'Concluído')
          .length,
        target: 25,
        unit: 'revisões',
      },
      coverage50: {
        current: activeTopics.length
          ? (activeTopics.filter((item: any) => item.status === 'Concluído').length /
              activeTopics.length) *
            100
          : 0,
        target: 50,
        unit: '% de conteúdo',
      },
      streak14: { current: computeStreak(getActivityDates()), target: 14, unit: 'dias' },
      streak30: { current: computeStreak(getActivityDates()), target: 30, unit: 'dias' },
    };

    const strategic = buildStrategicAchievements({
      candidates: intelligenceCandidates(),
      sessions: state.studySessions || [],
      exams: state.exams || [],
      activeExamTags: state.examBlueprint?.activeExamTags || [],
    });

    const badges = getBadgesDefinitions();
    return [
      ...badges.map(item => {
        const progress = progressByBadge[item.id];
        return {
          ...item,
          category: CONSISTENCY_BADGE_IDS.has(item.id) ? 'consistency' : 'learning',
          unlocked: item.check(),
          progress: progress
            ? { ...progress, current: Math.min(progress.current, progress.target) }
            : null,
        };
      }),
      ...STRATEGIC_BADGES.map(item => ({
        ...item,
        category: 'strategy',
        ...(strategic as any)[item.id],
      })),
    ];
  }

  function render(): void {
    const grid = document.getElementById('badgesGrid');
    if (!grid) return;
    const achievements = evaluateAchievements();
    grid.innerHTML = renderAchievementGroups(buildAchievementViewModel(achievements), {
      escapeHtml,
    });
  }

  return {
    getBadgesDefinitions,
    evaluateAchievements,
    render,
  };
}
