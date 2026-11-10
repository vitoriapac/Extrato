import { addLocalDays, parseLocalDate } from '../../core/date-utils.js';
import { formatPeriodBR } from '../../core/format-date.js';
import { pluralize } from '../../core/utils.js';
import { plannedMinutesForPlan } from '../goals/build-plan-execution.js';

export interface WeeklySubjectHighlight {
  id: string;
  name: string;
  resolved: number;
  correct: number;
  accuracy: number;
}

export interface WeeklyBriefChartMetric {
  key: 'studyTime' | 'questions' | 'accuracy';
  label: string;
  currentValue: number;
  previousValue: number;
  currentFormatted: string;
  previousFormatted: string;
  deltaFormatted: string;
  trend: 'up' | 'down' | 'stable';
  currentBarPct: number;
  previousBarPct: number;
}

export interface WeeklyBriefLink {
  label: string;
  icon: string;
  kind: 'tab' | 'section';
  target: string;
  subjectId?: string;
}

export interface WeeklyWindowStats {
  start: string;
  end: string;
  studiedMinutes: number;
  plannedMinutes: number;
  planFulfillmentPct: number | null;
  sessionCount: number;
  activeDays: number;
  resolved: number;
  correct: number;
  accuracy: number | null;
  simulationsCount: number;
}

export interface WeeklyPerformanceBriefViewModel {
  periodLabel: string;
  previousPeriodLabel: string;
  hasActivity: boolean;
  tone: 'positive' | 'attention' | 'neutral';
  current: WeeklyWindowStats;
  previous: WeeklyWindowStats;
  bestSubject: WeeklySubjectHighlight | null;
  weakestSubject: WeeklySubjectHighlight | null;
  overdueReviews: number;
  shortParagraph: string;
  detailedParagraphs: [string, string, string];
  chartMetrics: [WeeklyBriefChartMetric, WeeklyBriefChartMetric, WeeklyBriefChartMetric];
  /** Aderência ao plano, só quando a semana teve plano; a Visão geral a soma às três métricas. */
  adherenceMetric: WeeklyBriefChartMetric | null;
  links: WeeklyBriefLink[];
  /** Como ler o resumo desta semana (amostra, comparação, plano). */
  readingTips: string[];
  /** O que registrar para o resumo continuar útil. */
  keepTips: string[];
}

export interface BuildWeeklyPerformanceBriefInput {
  today: string;
  questions?: any[];
  sessions?: any[];
  dailyPlans?: any[];
  reviews?: any[];
  simulations?: any[];
  subjects?: any[];
  overdueReviewsCount?: number | null;
  subjectIdFor?: (item: any) => string | null;
}

function formatReadableMinutes(minutes: number): string {
  const rounded = Math.max(0, Math.round(Number(minutes) || 0));
  if (rounded === 0) return '0 min';
  const hours = Math.floor(rounded / 60);
  const rem = rounded % 60;
  if (hours === 0) return `${rem} min`;
  if (rem === 0) return `${hours}h`;
  return `${hours}h ${rem}min`;
}

function inDateWindow(date: unknown, start: string, end: string): boolean {
  if (typeof date !== 'string' || !date) return false;
  const iso = date.slice(0, 10);
  return iso >= start && iso <= end;
}

function computeWindowStats(
  start: string,
  end: string,
  questions: any[],
  sessions: any[],
  dailyPlans: any[],
  simulations: any[]
): WeeklyWindowStats {
  const winQuestions = questions.filter(q => inDateWindow(q?.date, start, end));
  const winSessions = sessions.filter(s => inDateWindow(s?.date, start, end));
  const winPlans = dailyPlans.filter(p => inDateWindow(p?.date, start, end));
  const winSimulations = simulations.filter(sim => inDateWindow(sim?.date, start, end));

  const studiedSeconds = winSessions.reduce(
    (sum, s) => sum + Math.max(0, Number(s?.durationSeconds) || 0),
    0
  );
  const studiedMinutes = Math.round(studiedSeconds / 60);

  const plannedMinutes = Math.round(winPlans.reduce((sum, p) => sum + plannedMinutesForPlan(p), 0));
  const planFulfillmentPct =
    plannedMinutes > 0 ? Math.round((studiedMinutes / plannedMinutes) * 100) : null;

  const resolved = winQuestions.reduce((sum, q) => sum + Math.max(0, Number(q?.resolved) || 0), 0);
  const correct = winQuestions.reduce((sum, q) => sum + Math.max(0, Number(q?.correct) || 0), 0);
  const accuracy = resolved > 0 ? Math.round((correct / resolved) * 100) : null;

  const activeDateSet = new Set<string>();
  for (const s of winSessions) {
    if ((Number(s?.durationSeconds) || 0) > 0 && typeof s?.date === 'string') {
      activeDateSet.add(s.date.slice(0, 10));
    }
  }
  for (const q of winQuestions) {
    if ((Number(q?.resolved) || 0) > 0 && typeof q?.date === 'string') {
      activeDateSet.add(q.date.slice(0, 10));
    }
  }
  for (const sim of winSimulations) {
    if (typeof sim?.date === 'string') {
      activeDateSet.add(sim.date.slice(0, 10));
    }
  }

  return {
    start,
    end,
    studiedMinutes,
    plannedMinutes,
    planFulfillmentPct,
    sessionCount: winSessions.length,
    activeDays: activeDateSet.size,
    resolved,
    correct,
    accuracy,
    simulationsCount: winSimulations.length,
  };
}

function findSubjectHighlights(
  start: string,
  end: string,
  questions: any[],
  subjects: any[],
  subjectIdFor?: (item: any) => string | null
): { bestSubject: WeeklySubjectHighlight | null; weakestSubject: WeeklySubjectHighlight | null } {
  const subjectNameById = new Map<string, string>();
  for (const sub of subjects) {
    if (sub?.id && sub?.name) {
      subjectNameById.set(String(sub.id), String(sub.name));
    }
  }

  const bySubject = new Map<
    string,
    { id: string; name: string; resolved: number; correct: number }
  >();

  for (const q of questions) {
    if (!inDateWindow(q?.date, start, end)) continue;
    const resolved = Math.max(0, Number(q?.resolved) || 0);
    if (resolved === 0) continue;
    const correct = Math.max(0, Number(q?.correct) || 0);
    const rawId = (subjectIdFor ? subjectIdFor(q) : null) ?? q?.subjectId ?? null;
    const id = rawId ? String(rawId) : '';
    const name =
      (id && subjectNameById.get(id)) ||
      (typeof q?.subjectName === 'string' && q.subjectName.trim()) ||
      (typeof q?.subject === 'string' && q.subject.trim()) ||
      '';
    if (!name) continue;
    const key = id || name;
    const entry = bySubject.get(key) || { id: id || name, name, resolved: 0, correct: 0 };
    entry.resolved += resolved;
    entry.correct += correct;
    bySubject.set(key, entry);
  }

  const all = [...bySubject.values()].map(item => ({
    ...item,
    accuracy: Math.round((item.correct / item.resolved) * 100),
  }));

  if (all.length === 0) {
    return { bestSubject: null, weakestSubject: null };
  }

  const meaningful = all.filter(item => item.resolved >= 5);
  const pool = meaningful.length > 0 ? meaningful : all;

  const sortedDesc = [...pool].sort((a, b) => b.accuracy - a.accuracy || b.resolved - a.resolved);
  const sortedAsc = [...pool].sort((a, b) => a.accuracy - b.accuracy || b.resolved - a.resolved);

  const topCandidate = sortedDesc[0] || null;
  const bottomCandidate = sortedAsc[0] || null;

  const bestSubject = topCandidate && topCandidate.accuracy >= 70 ? topCandidate : null;
  let weakestSubject: WeeklySubjectHighlight | null = null;

  if (bottomCandidate && bottomCandidate.accuracy < 70) {
    if (!bestSubject || bottomCandidate.id !== bestSubject.id) {
      weakestSubject = bottomCandidate;
    }
  } else if (
    bottomCandidate &&
    bestSubject &&
    bottomCandidate.id !== bestSubject.id &&
    bottomCandidate.accuracy < 75
  ) {
    weakestSubject = bottomCandidate;
  }

  return { bestSubject, weakestSubject };
}

function buildChartMetrics(
  current: WeeklyWindowStats,
  previous: WeeklyWindowStats
): [WeeklyBriefChartMetric, WeeklyBriefChartMetric, WeeklyBriefChartMetric] {
  const maxMinutes = Math.max(60, current.studiedMinutes, previous.studiedMinutes);
  const minDiff = current.studiedMinutes - previous.studiedMinutes;
  const studyTrend: 'up' | 'down' | 'stable' =
    minDiff >= 15 ? 'up' : minDiff <= -15 ? 'down' : 'stable';
  const studyDeltaFormatted =
    previous.studiedMinutes === 0 && current.studiedMinutes === 0
      ? 'Sem variação'
      : minDiff === 0
        ? 'Igual à semana passada'
        : `${minDiff > 0 ? '+' : '−'}${formatReadableMinutes(Math.abs(minDiff))}`;

  const maxQuestions = Math.max(10, current.resolved, previous.resolved);
  const qDiff = current.resolved - previous.resolved;
  const questionsTrend: 'up' | 'down' | 'stable' =
    qDiff >= 5 ? 'up' : qDiff <= -5 ? 'down' : 'stable';
  const questionsDeltaFormatted =
    previous.resolved === 0 && current.resolved === 0
      ? 'Sem variação'
      : qDiff === 0
        ? 'Igual à semana passada'
        : `${qDiff > 0 ? '+' : '−'}${Math.abs(qDiff)} ${Math.abs(qDiff) === 1 ? 'questão' : 'questões'}`;

  const currAcc = current.accuracy;
  const prevAcc = previous.accuracy;
  const accDiff = currAcc != null && prevAcc != null ? currAcc - prevAcc : null;
  const accuracyTrend: 'up' | 'down' | 'stable' =
    accDiff == null ? 'stable' : accDiff >= 2 ? 'up' : accDiff <= -2 ? 'down' : 'stable';
  const accuracyDeltaFormatted =
    accDiff == null
      ? currAcc != null
        ? 'Sem base na semana anterior'
        : 'Sem questões na semana'
      : accDiff === 0
        ? 'Manteve o percentual'
        : `${accDiff > 0 ? '+' : '−'}${Math.abs(accDiff)} p.p.`;

  return [
    {
      key: 'studyTime',
      label: 'Tempo de estudo',
      currentValue: current.studiedMinutes,
      previousValue: previous.studiedMinutes,
      currentFormatted: formatReadableMinutes(current.studiedMinutes),
      previousFormatted: formatReadableMinutes(previous.studiedMinutes),
      deltaFormatted: studyDeltaFormatted,
      trend: studyTrend,
      currentBarPct:
        current.studiedMinutes > 0
          ? Math.max(6, Math.round((current.studiedMinutes / maxMinutes) * 100))
          : 0,
      previousBarPct:
        previous.studiedMinutes > 0
          ? Math.max(6, Math.round((previous.studiedMinutes / maxMinutes) * 100))
          : 0,
    },
    {
      key: 'questions',
      label: 'Questões feitas',
      currentValue: current.resolved,
      previousValue: previous.resolved,
      currentFormatted: String(current.resolved),
      previousFormatted: String(previous.resolved),
      deltaFormatted: questionsDeltaFormatted,
      trend: questionsTrend,
      currentBarPct:
        current.resolved > 0 ? Math.max(6, Math.round((current.resolved / maxQuestions) * 100)) : 0,
      previousBarPct:
        previous.resolved > 0
          ? Math.max(6, Math.round((previous.resolved / maxQuestions) * 100))
          : 0,
    },
    {
      key: 'accuracy',
      label: 'Taxa de acerto',
      currentValue: currAcc ?? 0,
      previousValue: prevAcc ?? 0,
      currentFormatted: currAcc != null ? `${currAcc}%` : '—',
      previousFormatted: prevAcc != null ? `${prevAcc}%` : '—',
      deltaFormatted: accuracyDeltaFormatted,
      trend: accuracyTrend,
      currentBarPct: currAcc != null && currAcc > 0 ? Math.max(6, Math.min(100, currAcc)) : 0,
      previousBarPct: prevAcc != null && prevAcc > 0 ? Math.max(6, Math.min(100, prevAcc)) : 0,
    },
  ];
}

function buildAdherenceMetric(
  current: WeeklyWindowStats,
  previous: WeeklyWindowStats
): WeeklyBriefChartMetric | null {
  const now = current.planFulfillmentPct;
  if (now == null) return null;
  const before = previous.planFulfillmentPct;
  const diff = before != null ? now - before : null;
  const bar = (value: number | null) =>
    value != null && value > 0 ? Math.max(6, Math.min(100, value)) : 0;
  return {
    key: 'accuracy',
    label: 'Aderência ao plano',
    currentValue: now,
    previousValue: before ?? 0,
    currentFormatted: `${now}%`,
    previousFormatted: before != null ? `${before}%` : '—',
    deltaFormatted:
      diff == null
        ? 'Sem plano na semana anterior'
        : diff === 0
          ? 'Manteve o percentual'
          : `${diff > 0 ? '+' : '−'}${Math.abs(diff)} p.p.`,
    trend: diff == null ? 'stable' : diff >= 5 ? 'up' : diff <= -5 ? 'down' : 'stable',
    currentBarPct: bar(now),
    previousBarPct: bar(before),
  };
}

/**
 * Dicas curtas para a aba Desempenho: explicam o limite da leitura e o que registrar,
 * sem repetir números que a Visão geral (Início) já mostra e sem alterar nada sozinhas.
 */
export function buildWeeklyReadingTips(
  current: WeeklyWindowStats,
  previous: WeeklyWindowStats
): { readingTips: string[]; keepTips: string[] } {
  const readingTips: string[] = [];
  const keepTips: string[] = [];
  if (current.resolved > 0 && current.resolved < 30)
    readingTips.push(
      'Com menos de 30 questões na semana, a precisão é um indício, não uma tendência.'
    );
  if (previous.studiedMinutes === 0 && previous.resolved === 0)
    readingTips.push(
      'Ainda não há semana anterior com registros: o comparativo aparece quando houver dois períodos.'
    );
  if (current.planFulfillmentPct != null && current.planFulfillmentPct < 70)
    readingTips.push(
      'Se o plano ficar abaixo do planejado em outras semanas, você decide o ajuste em Planejamento; nada muda sozinho.'
    );
  if (current.sessionCount === 0)
    keepTips.push('Registre as sessões de estudo para o resumo medir o seu tempo.');
  if (current.resolved === 0)
    keepTips.push('Registre as questões, com a disciplina, para ler a precisão por matéria.');
  if (current.simulationsCount === 0)
    keepTips.push('Um simulado comparável por mês ajuda a calibrar a faixa da projeção.');
  if (!keepTips.length)
    keepTips.push('Feche a semana em Planejamento para preservar este retrato como ele foi.');
  return { readingTips: readingTips.slice(0, 3), keepTips: keepTips.slice(0, 2) };
}

export function buildWeeklyPerformanceBrief({
  today,
  questions = [],
  sessions = [],
  dailyPlans = [],
  reviews = [],
  simulations = [],
  subjects = [],
  overdueReviewsCount = null,
  subjectIdFor,
}: BuildWeeklyPerformanceBriefInput): WeeklyPerformanceBriefViewModel {
  const validToday = parseLocalDate(today) ? today : '2026-01-07';
  const start = addLocalDays(validToday, -6)!;
  const end = validToday;
  const prevStart = addLocalDays(validToday, -13)!;
  const prevEnd = addLocalDays(validToday, -7)!;

  const current = computeWindowStats(start, end, questions, sessions, dailyPlans, simulations);
  const previous = computeWindowStats(
    prevStart,
    prevEnd,
    questions,
    sessions,
    dailyPlans,
    simulations
  );

  const { bestSubject, weakestSubject } = findSubjectHighlights(
    start,
    end,
    questions,
    subjects,
    subjectIdFor
  );

  const overdueReviews =
    overdueReviewsCount != null
      ? Math.max(0, Number(overdueReviewsCount) || 0)
      : reviews.filter(
          r =>
            typeof r?.date === 'string' &&
            r.date.slice(0, 10) < validToday &&
            r?.status !== 'Concluído' &&
            !r?.completedAt
        ).length;

  const hasActivity =
    current.studiedMinutes > 0 || current.resolved > 0 || current.simulationsCount > 0;

  const timeFormatted = formatReadableMinutes(current.studiedMinutes);
  const prevTimeFormatted = formatReadableMinutes(previous.studiedMinutes);
  const plannedFormatted = formatReadableMinutes(current.plannedMinutes);

  // --- PARÁGRAFO 1: Ritmo, constância e meta da semana ---
  let p1 = '';
  if (!hasActivity) {
    const prevContext =
      previous.studiedMinutes > 0
        ? ` (na semana anterior você havia estudado ${prevTimeFormatted})`
        : '';
    p1 = `Você ainda não registrou horas de estudo nem questões nos últimos 7 dias${prevContext}. Retomar a rotina com uma sessão curta de 25 a 40 minutos já ajuda a reativar seu ritmo semanal sem pesar no dia a dia.`;
  } else {
    const daysText = `${pluralize(current.activeDays, 'dia ativo', 'dias ativos')} dos últimos 7 dias`;
    const sessionsText =
      current.sessionCount > 0
        ? `somando ${timeFormatted} em ${pluralize(current.sessionCount, 'sessão', 'sessões')}`
        : `com foco direto na resolução de exercícios`;

    let timeCompareText = '';
    if (previous.studiedMinutes > 0 && current.studiedMinutes > 0) {
      const diff = current.studiedMinutes - previous.studiedMinutes;
      if (diff >= 15) {
        timeCompareText = `, superando as ${prevTimeFormatted} da semana passada`;
      } else if (diff <= -15) {
        timeCompareText = `, um pouco abaixo das ${prevTimeFormatted} da semana passada`;
      } else {
        timeCompareText = `, mantendo quase o mesmo tempo da semana passada (${prevTimeFormatted})`;
      }
    }

    let planText = '';
    if (current.planFulfillmentPct != null) {
      if (current.planFulfillmentPct > 150) {
        planText = ` Isso passa bem do que estava planejado (${plannedFormatted}); o plano da semana cobre poucos dias.`;
      } else if (current.planFulfillmentPct >= 95) {
        planText = ` Com isso, você cumpriu ${current.planFulfillmentPct}% do tempo planejado para os últimos 7 dias (${plannedFormatted}), mostrando uma ótima regularidade.`;
      } else if (current.planFulfillmentPct >= 75) {
        planText = ` Isso representa ${current.planFulfillmentPct}% das ${plannedFormatted} que você planejou para a semana, mantendo sua rotina bem encaminhada.`;
      } else {
        planText = ` Esse tempo equivale a ${current.planFulfillmentPct}% das ${plannedFormatted} planejadas para a semana, sinalizando que os últimos dias foram mais corridos que o previsto.`;
      }
    } else {
      planText =
        current.activeDays >= 4
          ? ' Sua frequência na semana mostra que o hábito de estudo está bem firme.'
          : ' Tentar espalhar o estudo em mais dias da semana pode deixar a rotina ainda mais leve.';
    }

    const introTone =
      current.activeDays >= 4 ||
      (current.planFulfillmentPct != null && current.planFulfillmentPct >= 75)
        ? 'Nesta última semana, você manteve uma constância muito boa'
        : 'Nos últimos 7 dias, você manteve seus estudos em movimento';

    p1 = `${introTone}: esteve presente em ${daysText}, ${sessionsText}${timeCompareText}.${planText}`;
  }

  // --- PARÁGRAFO 2: Prática de questões, evolução de acertos, matérias e simulados ---
  let p2 = '';
  if (!hasActivity) {
    p2 =
      previous.resolved > 0 && previous.accuracy != null
        ? `Na semana anterior, você tinha resolvido ${pluralize(previous.resolved, 'questão', 'questões')} com ${previous.accuracy}% de acerto. Resolver uma pequena bateria de questões hoje é a forma mais rápida de medir como está sua lembrança da matéria.`
        : `Como também não houve questões ou simulados registrados nesta semana, ainda não temos acertos recentes para comparar por matéria. Assim que você registrar seus primeiros exercícios, este espaço mostrará em quais disciplinas você está indo melhor.`;
  } else if (current.resolved === 0) {
    const simNote =
      current.simulationsCount > 0
        ? ` Você realizou ${pluralize(current.simulationsCount, 'simulado')} no período, o que já contribui para treinar o tempo de prova.`
        : '';
    p2 = `Apesar do tempo dedicado ao estudo teórico, você ainda não registrou questões avulsas nos últimos 7 dias${previous.resolved > 0 ? ` (contra ${pluralize(previous.resolved, 'questão', 'questões')} na semana passada)` : ''}.${simNote} Incluir pequenas baterias de 10 a 15 questões logo após estudar ajuda a fixar o conteúdo e mostra onde estão suas dúvidas.`;
  } else {
    let accCompare = '';
    if (previous.resolved > 0 && previous.accuracy != null && current.accuracy != null) {
      const diff = current.accuracy - previous.accuracy;
      if (diff >= 2) {
        accCompare = ` — uma evolução positiva frente aos ${previous.accuracy}% da semana passada (em ${pluralize(previous.resolved, 'questão', 'questões')})`;
      } else if (diff <= -2) {
        accCompare = ` — um pouco abaixo dos ${previous.accuracy}% que você alcançou na semana passada (em ${pluralize(previous.resolved, 'questão', 'questões')})`;
      } else {
        accCompare = ` — mantendo a estabilidade em relação aos ${previous.accuracy}% da semana passada`;
      }
    }

    let subjectsSentence = '';
    if (bestSubject && weakestSubject) {
      subjectsSentence = ` Seu destaque positivo foi em ${bestSubject.name} (${bestSubject.accuracy}% de acerto em ${pluralize(bestSubject.resolved, 'questão', 'questões')}), enquanto ${weakestSubject.name} foi a matéria que pediu mais cuidado (${weakestSubject.accuracy}% de acerto em ${pluralize(weakestSubject.resolved, 'questão', 'questões')}).`;
    } else if (weakestSubject) {
      subjectsSentence = ` Entre as matérias praticadas, ${weakestSubject.name} foi a que concentrou mais dificuldades na semana, fechando com ${weakestSubject.accuracy}% de acerto em ${pluralize(weakestSubject.resolved, 'questão', 'questões')}.`;
    } else if (bestSubject) {
      subjectsSentence = ` Seu melhor aproveitamento na semana veio em ${bestSubject.name}, onde você alcançou ${bestSubject.accuracy}% de acerto em ${pluralize(bestSubject.resolved, 'questão', 'questões')}.`;
    }

    const simSentence =
      current.simulationsCount > 0
        ? ` Além disso, você concluiu ${pluralize(current.simulationsCount, 'simulado')} nesta semana.`
        : '';

    p2 = `Na prática de exercícios, você respondeu ${pluralize(current.resolved, 'questão', 'questões')} e acertou ${current.accuracy}% delas${accCompare}.${subjectsSentence}${simSentence}`;
  }

  // --- PARÁGRAFO 3 & LINKS: Próximos passos e indicação de outras abas ---
  let p3 = '';
  const links: WeeklyBriefLink[] = [];
  const addLink = (link: WeeklyBriefLink) => {
    if (links.length < 3 && !links.some(l => l.kind === link.kind && l.target === link.target)) {
      links.push(link);
    }
  };

  if (!hasActivity) {
    p3 = `Para dar o primeiro passo agora sem precisar analisar tabelas longas, abra a aba Hoje para ver a tarefa recomendada do dia, revise seu cronograma na aba Planejamento ou registre sua prática em Questões & Simulados.`;
    addLink({ label: 'Ir para a aba Hoje', icon: 'sun', kind: 'tab', target: 'hoje' });
    addLink({
      label: 'Treinar em Questões & Simulados',
      icon: 'list-check',
      kind: 'tab',
      target: 'questoes',
    });
    addLink({ label: 'Ver Planejamento', icon: 'map-2', kind: 'tab', target: 'metas' });
  } else if (weakestSubject && overdueReviews > 0) {
    p3 = `Para os próximos dias, vale focar em duas frentes simples: abra a seção Disciplinas ou a aba Questões & Simulados para revisar os assuntos de ${weakestSubject.name} em que houve mais erros, e passe na aba Agenda para colocar em dia ${pluralize(overdueReviews, 'revisão pendente', 'revisões pendentes')}.`;
    addLink({
      label: `Analisar ${weakestSubject.name}`,
      icon: 'chart-dots',
      kind: 'section',
      target: 'subjects',
      subjectId: weakestSubject.id,
    });
    addLink({
      label: 'Treinar em Questões & Simulados',
      icon: 'list-check',
      kind: 'tab',
      target: 'questoes',
    });
    addLink({
      label: 'Abrir Agenda de Revisões',
      icon: 'calendar-time',
      kind: 'tab',
      target: 'agenda',
    });
  } else if (weakestSubject) {
    p3 = `Para transformar essa leitura em resultado prático, vale abrir a seção Disciplinas para ver quais assuntos de ${weakestSubject.name} puxaram seus acertos para baixo, ou ir direto à aba Questões & Simulados para treinar uma nova bateria dessa matéria.`;
    addLink({
      label: `Analisar ${weakestSubject.name}`,
      icon: 'chart-dots',
      kind: 'section',
      target: 'subjects',
      subjectId: weakestSubject.id,
    });
    addLink({
      label: 'Treinar em Questões & Simulados',
      icon: 'list-check',
      kind: 'tab',
      target: 'questoes',
    });
    addLink({
      label: 'Ver matérias em Disciplinas',
      icon: 'book',
      kind: 'tab',
      target: 'disciplinas',
    });
  } else if (overdueReviews > 0) {
    p3 = `Como você está com ${pluralize(overdueReviews, 'revisão atrasada', 'revisões atrasadas')}, o melhor próximo passo é passar na aba Agenda para colocá-las em dia e proteger o que já estudou, ou abrir a aba Hoje para seguir a prioridade do dia.`;
    addLink({
      label: 'Abrir Agenda de Revisões',
      icon: 'calendar-time',
      kind: 'tab',
      target: 'agenda',
    });
    addLink({ label: 'Ir para a aba Hoje', icon: 'sun', kind: 'tab', target: 'hoje' });
    addLink({
      label: 'Ver evolução em Questões',
      icon: 'help-circle',
      kind: 'section',
      target: 'questions',
    });
  } else if (current.planFulfillmentPct != null && current.planFulfillmentPct < 65) {
    p3 = `Como o tempo estudado ficou distante da sua meta da semana, considere abrir a aba Planejamento para ajustar sua carga horária à sua rotina real, ou confira a seção Consistência para acompanhar seu ritmo diário com calma.`;
    addLink({ label: 'Ajustar Planejamento', icon: 'map-2', kind: 'tab', target: 'metas' });
    addLink({
      label: 'Ver Consistência',
      icon: 'calendar-time',
      kind: 'section',
      target: 'consistency',
    });
    addLink({ label: 'Ir para a aba Hoje', icon: 'sun', kind: 'tab', target: 'hoje' });
  } else {
    p3 = `Com a rotina em dia e bom aproveitamento, você pode avançar nos próximos conteúdos na aba Disciplinas, aprofundar a evolução de acertos na seção Questões${current.simulationsCount > 0 ? ' ou conferir o detalhamento da sua nota na seção Simulados' : ' ou acompanhar sua regularidade em Consistência'}.`;
    addLink({
      label: 'Abrir aba Disciplinas',
      icon: 'book',
      kind: 'tab',
      target: 'disciplinas',
    });
    addLink({
      label: 'Ver seção Questões',
      icon: 'help-circle',
      kind: 'section',
      target: 'questions',
    });
    if (current.simulationsCount > 0) {
      addLink({
        label: 'Ver seção Simulados',
        icon: 'certificate',
        kind: 'section',
        target: 'simulations',
      });
    } else {
      addLink({
        label: 'Ver Consistência',
        icon: 'calendar-time',
        kind: 'section',
        target: 'consistency',
      });
    }
  }

  // --- PARÁGRAFO CURTO (1 PARÁGRAFO) PARA A ABA INÍCIO (DASHBOARD) ---
  let shortParagraph = '';
  if (!hasActivity) {
    shortParagraph = `Nos últimos 7 dias você ainda não registrou horas de estudo ou questões${previous.studiedMinutes > 0 ? ` (na semana passada foram ${prevTimeFormatted})` : ''}. Abra a aba Desempenho para ver seu comparativo semanal ou inicie uma sessão rápida na aba Hoje.`;
  } else {
    // Tempo, questões, acerto e aderência ficam no comparativo ao lado; o texto só interpreta.
    const questionsSnippet =
      current.resolved > 0 && current.accuracy != null
        ? ''
        : ' e ainda não registrou questões no período';
    let tailSnippet = '.';
    if (weakestSubject && overdueReviews > 0) {
      tailSnippet = `, com ponto de atenção em ${weakestSubject.name} (${weakestSubject.accuracy}%) e ${pluralize(overdueReviews, 'revisão pendente', 'revisões pendentes')}.`;
    } else if (weakestSubject) {
      tailSnippet = `, sendo ${weakestSubject.name} (${weakestSubject.accuracy}% de acerto) a matéria que mais pede reforço agora.`;
    } else if (bestSubject) {
      tailSnippet = `, com destaque positivo para ${bestSubject.name} (${bestSubject.accuracy}% de acerto).`;
    } else if (overdueReviews > 0) {
      tailSnippet = `, restando ${pluralize(overdueReviews, 'revisão atrasada', 'revisões atrasadas')} para colocar em dia na Agenda.`;
    }
    shortParagraph = `Nos últimos 7 dias, você estudou em ${pluralize(current.activeDays, 'dia', 'dias')}${questionsSnippet}${tailSnippet}`;
  }

  const tone: 'positive' | 'attention' | 'neutral' = !hasActivity
    ? 'neutral'
    : weakestSubject ||
        overdueReviews > 3 ||
        (current.planFulfillmentPct != null && current.planFulfillmentPct < 60)
      ? 'attention'
      : 'positive';

  return {
    periodLabel: formatPeriodBR(start, end),
    previousPeriodLabel: formatPeriodBR(prevStart, prevEnd),
    hasActivity,
    tone,
    current,
    previous,
    bestSubject,
    weakestSubject,
    overdueReviews,
    shortParagraph,
    detailedParagraphs: [p1, p2, p3],
    chartMetrics: buildChartMetrics(current, previous),
    adherenceMetric: buildAdherenceMetric(current, previous),
    links,
    ...buildWeeklyReadingTips(current, previous),
  };
}
