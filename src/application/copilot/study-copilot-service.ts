/**
 * Copiloto de Estudos Guiado (COP-01 a COP-10).
 *
 * Sem chat livre e sem IA externa. Fornece respostas determinísticas baseadas nos
 * motores existentes (Hoje, Próxima Melhor Ação, Estudo Rápido, Fechamento Semanal,
 * Ciclo de Estudos 2.0 e Ponto de Parada). Totalmente somente-leitura (`COP-09`).
 */

import { formatPlanMinutes } from '../../core/format-duration.js';
import { formatDateBR } from '../../core/format-date.js';
import { formatBookmarkLabel } from '../../domain/topic-bookmark.js';
import { buildNextBestAction } from '../diagnostics/build-next-best-action.js';
import { buildQuickStudyProposal } from '../../domain/quick-study/quick-study-engine.js';
import {
  explainCycleVsPriority,
  getCurrentCycleBlock,
  type StudyCycleQueue,
} from '../../domain/planning/study-cycle-engine.js';
import { sameStudyActionTarget } from '../recommendations/recommendation-action.js';
import { buildWeeklyClosingRitualViewModel } from './../weekly-closing/weekly-closing-ritual.js';
import type { OverdueReviewItem } from '../../domain/recovery/recovery-mission-engine.js';

export type CopilotQuestionKey =
  | 'what_now'
  | 'why_this'
  | 'quick_30'
  | 'week_status'
  | 'did_it_work'
  | 'cycle_vs_diagnosis'
  | 'where_left_off';

export interface CopilotAnswer {
  key: CopilotQuestionKey;
  question: string;
  headline: string;
  body: string;
  evidenceSummary: string | null;
  limitations: string[];
  actionLabel: string | null;
  actionKind: 'execute_action' | 'open_quick_study' | 'open_planning_preview' | 'open_weekly_close' | 'none';
  targetSubjectId?: string | null;
  targetTopicId?: string | null;
}

export interface CopilotViewModel {
  recommendationId: string | null;
  title: string;
  evidence: string;
  limitations: string[];
  action: Record<string, any> | null;
  source: 'copilot' | 'today' | 'diagnosis' | 'cycle' | 'empty';
  generatedAt: string;
  confidence: {
    level: 'high' | 'moderate' | 'low';
    label: string;
  };
  answers: Record<CopilotQuestionKey, CopilotAnswer>;
  questionsList: CopilotAnswer[];
  mutatedState: false;
}

export interface BuildStudyCopilotInput {
  today: string;
  nowISO: string;
  isDemo?: boolean;
  recommendations?: Array<Record<string, any>>;
  candidates?: Array<Record<string, any>>;
  diagnosis?: Record<string, any> | null;
  activePlan?: Record<string, any> | null;
  weeklyCapacityMinutes?: number;
  projection?: Record<string, any> | null;
  studyCycle?: StudyCycleQueue | null;
  overdueReviews?: readonly OverdueReviewItem[];
  subjects?: Array<Record<string, any>>;
  sessions?: Array<Record<string, any>>;
  questions?: Array<Record<string, any>>;
  dailyPlans?: Array<Record<string, any>>;
  weeklyCloseSnapshots?: Array<Record<string, any>>;
  recommendationFeedback?: Array<Record<string, any>>;
  activeExamTags?: string[];
  studyDaysCount?: number;
}

function findBookmarkTarget(
  subjects: Array<Record<string, any>> = [],
  sessions: Array<Record<string, any>> = [],
  preferredTopicId?: string | null
) {
  const allTopics: Array<{ subject: any; topic: any }> = [];
  for (const subject of subjects) {
    if (!subject || subject.archived) continue;
    for (const topic of subject.topics || []) {
      if (!topic || topic.archived) continue;
      allTopics.push({ subject, topic });
    }
  }

  const preferred = preferredTopicId
    ? allTopics.find(entry => entry.topic.id === preferredTopicId && entry.topic.bookmark)
    : null;
  const bookmarked = preferred || allTopics.find(entry => entry.topic.bookmark) || null;
  const latestSession = [...sessions]
    .filter(s => s && s.date)
    .sort((a, b) => String(b.endedAt || b.createdAt || b.date).localeCompare(String(a.endedAt || a.createdAt || a.date)))[0] || null;

  return { bookmarked, latestSession };
}

export function buildStudyCopilotViewModel(input: BuildStudyCopilotInput): CopilotViewModel {
  const {
    today,
    nowISO,
    isDemo = false,
    recommendations = [],
    candidates = [],
    diagnosis = null,
    activePlan = null,
    weeklyCapacityMinutes = 0,
    projection = null,
    studyCycle = null,
    overdueReviews = [],
    subjects = [],
    sessions = [],
    questions = [],
    dailyPlans = [],
    weeklyCloseSnapshots = [],
    recommendationFeedback = [],
    activeExamTags = [],
  } = input;

  const nextBest = buildNextBestAction({
    recommendations,
    diagnosis,
    activePlan,
    weeklyCapacityMinutes,
    projection,
  });

  const topRec = recommendations[0] || null;
  const canonicalAction = nextBest.action || null;
  const hasAnySubjects = subjects.some(s => s && !s.archived);
  const totalQuestions = questions.reduce((sum, q) => sum + (Number(q?.resolved) || 0), 0);
  const hasEvidence = Boolean(topRec || sessions.length > 0 || totalQuestions > 0);

  const confidenceLevel: 'high' | 'moderate' | 'low' =
    totalQuestions >= 30 && sessions.length >= 3
      ? 'high'
      : totalQuestions >= 10 || sessions.length >= 1
        ? 'moderate'
        : 'low';
  const confidenceLabel =
    confidenceLevel === 'high'
      ? 'evidência alta'
      : confidenceLevel === 'moderate'
        ? 'evidência moderada'
        : 'evidência baixa';

  const limitations: string[] = [];
  if (!hasAnySubjects) {
    limitations.push('Nenhuma disciplina cadastrada ainda; comece adicionando matérias ou um modelo de prova.');
  } else if (totalQuestions < 30) {
    limitations.push(
      `Amostra de ${totalQuestions} ${totalQuestions === 1 ? 'questão' : 'questões'} — abaixo de 30, domínio/100 e retenção/100 usam cautela estatística.`
    );
  }
  if (isDemo) {
    limitations.push('Você está explorando o perfil de demonstração; nenhuma leitura altera seus dados.');
  }

  // COP-01: O que estudar agora?
  const whatNowHeadline = canonicalAction
    ? `${nextBest.subjectName} — ${nextBest.topicName}`
    : !hasAnySubjects
      ? 'Cadastre ou escolha sua prova para receber a primeira recomendação'
      : 'Sem ação prioritária elegível agora';

  const whatNowBody = canonicalAction
    ? `${nextBest.label}${canonicalAction.suggestedMinutes ? ` (${formatPlanMinutes(canonicalAction.suggestedMinutes)})` : ''}. A sugestão vem exatamente do mesmo motor usado na aba Hoje.`
    : nextBest.reason ||
      'Ainda não há registros suficientes. Faça uma primeira sessão rápida ou registre questões para destravar a prioridade.';

  const whatNow: CopilotAnswer = {
    key: 'what_now',
    question: 'O que estudar agora?',
    headline: whatNowHeadline,
    body: whatNowBody,
    evidenceSummary: canonicalAction
      ? `Prioridade ${Math.round(Number(canonicalAction.priority) || 0)}/100 · ${nextBest.evidence}`
      : null,
    limitations: [...limitations],
    actionLabel: canonicalAction ? nextBest.label || null : 'Abrir Estudo Rápido',
    actionKind: canonicalAction ? 'execute_action' : 'open_quick_study',
    targetSubjectId: canonicalAction?.subjectId || null,
    targetTopicId: canonicalAction?.topicId || null,
  };

  // COP-02: Por quê? (prova x você x ação)
  const masteryVal = canonicalAction?.evidence?.mastery;
  const retentionVal = canonicalAction?.evidence?.retention;
  const reasons = Array.isArray(nextBest.reasons) && nextBest.reasons.length
    ? nextBest.reasons.join(' · ')
    : topRec?.reasons?.join(' · ') || null;

  const whyThis: CopilotAnswer = {
    key: 'why_this',
    question: 'Por quê?',
    headline: canonicalAction
      ? `Prova × você × ação: ${nextBest.subjectName}`
      : 'Por que nenhuma ação foi priorizada',
    body: canonicalAction
      ? `Critério: ${reasons || 'combinação entre relevância na prova, lacuna atual e urgência de revisão.'}${nextBest.projectionReason ? ` ${nextBest.projectionReason}` : ''}`
      : 'Sem base mínima de tópicos elegíveis ou evidências recentes. Confira pré-requisitos e disciplinas ativas.',
    evidenceSummary: canonicalAction
      ? `Você: ${masteryVal != null ? `domínio ${Math.round(masteryVal)}/100` : 'domínio não medido'}${retentionVal != null ? ` · retenção ${Math.round(retentionVal)}/100` : ''} · ${nextBest.evidence} · amostra total: ${totalQuestions} questões.`
      : `Amostra atual: ${sessions.length} sessões e ${totalQuestions} questões.`,
    limitations: [...limitations],
    actionLabel: null,
    actionKind: 'none',
  };

  // COP-03: Tenho 30 minutos
  const quick30Proposal = buildQuickStudyProposal({
    durationMinutes: 30,
    focusMode: 'priority',
    candidates,
    overdueReviews,
    currentCycleBlock: studyCycle ? getCurrentCycleBlock(studyCycle) : null,
    subjects,
    source: 'today',
  });
  const quick30: CopilotAnswer = {
    key: 'quick_30',
    question: 'Tenho 30 minutos',
    headline: `${quick30Proposal.subjectName}${quick30Proposal.topicName ? ` — ${quick30Proposal.topicName}` : ''}`,
    body: `${quick30Proposal.reasoning} Bloco sugerido de ${formatPlanMinutes(quick30Proposal.plannedMinutes)} sem alterar seu planejamento.`,
    evidenceSummary: quick30Proposal.action
      ? `Mesmo executor canônico da aba Hoje · origem: Estudo Rápido (${formatPlanMinutes(quick30Proposal.plannedMinutes)}).`
      : 'Estudo livre claramente identificado.',
    limitations: [...limitations],
    actionLabel: 'Iniciar bloco de 30 min',
    actionKind: 'open_quick_study',
    targetSubjectId: quick30Proposal.subjectId,
    targetTopicId: quick30Proposal.topicId,
  };

  // COP-04: Como foi minha semana?
  const ritual = buildWeeklyClosingRitualViewModel({
    today,
    sessions,
    questions,
    dailyPlans,
    subjects,
    weeklyCloseSnapshots,
    activeExamTags,
    studyCycle,
  });
  const weekStatus: CopilotAnswer = {
    key: 'week_status',
    question: 'Como foi minha semana?',
    headline: `${ritual.window.windowLabel} (${ritual.period.start ? ritual.window.periodLabel : 'semana atual'})`,
    body:
      ritual.windowStatus === 'insufficient_data'
        ? ritual.whatWorked[0]
        : `${ritual.whatWorked[0] || ''} ${ritual.needsAttention[0] || ''}`.trim(),
    evidenceSummary:
      ritual.metrics.studiedMinutes > 0 || ritual.metrics.resolved > 0
        ? `${formatPlanMinutes(ritual.metrics.studiedMinutes)} estudados · ${ritual.metrics.resolved} questões${ritual.metrics.accuracy != null ? ` (${ritual.metrics.accuracy}% de acerto)` : ''}.`
        : 'Nenhum registro nesta janela civil.',
    limitations: ritual.comparisonWarning ? [ritual.comparisonWarning] : [],
    actionLabel: 'Abrir ritual de fechamento',
    actionKind: 'open_weekly_close',
  };

  // COP-05: Minha recomendação funcionou?
  const measuredFeedbacks = recommendationFeedback.filter(f => f?.outcome?.state || f?.completed);
  const improvedCount = measuredFeedbacks.filter(f => f?.outcome?.state === 'improved').length;
  const didItWork: CopilotAnswer = {
    key: 'did_it_work',
    question: 'Minha recomendação funcionou?',
    headline: measuredFeedbacks.length
      ? `${measuredFeedbacks.length} ${measuredFeedbacks.length === 1 ? 'acompanhamento medido' : 'acompanhamentos medidos'}`
      : 'Ainda sem medições concluídas',
    body: measuredFeedbacks.length
      ? `Em ${improvedCount} de ${measuredFeedbacks.length} recomendações concluídas houve melhora nos indicadores após a prática; isso descreve a evolução medida no período, sem garantir causalidade isolada.`
      : 'Aceite e conclua uma recomendação prioritária em Hoje para acompanhar a variação antes e depois em domínio/100 e acerto.',
    evidenceSummary: measuredFeedbacks.length
      ? `${improvedCount} com melhora observada · ${recommendationFeedback.filter(f => f?.accepted).length} aceitas no histórico.`
      : null,
    limitations: [
      'A evolução observada pode refletir estudo acumulado em múltiplas sessões e revisões no mesmo intervalo.',
    ],
    actionLabel: null,
    actionKind: 'none',
  };

  // COP-06: Por que meu ciclo sugere X e o diagnóstico Y?
  const cycleDiff = explainCycleVsPriority(studyCycle, topRec);
  const cycleVsDiagnosis: CopilotAnswer = {
    key: 'cycle_vs_diagnosis',
    question: 'Por que meu ciclo sugere X e o diagnóstico Y?',
    headline: !studyCycle
      ? 'Nenhum ciclo de sequência flexível configurado'
      : cycleDiff.diverges
        ? `Ciclo (${cycleDiff.currentBlockSubject}) × Prioridade (${cycleDiff.recommendedSubject})`
        : `Ciclo e diagnóstico alinhados em ${cycleDiff.currentBlockSubject || 'sua fila'}`,
    body: studyCycle
      ? cycleDiff.explanation
      : 'Você está no modo Agenda ou ainda não criou blocos no Ciclo de Estudos. Quando ativar o ciclo, explicaremos qualquer diferença antes de qualquer troca.',
    evidenceSummary: studyCycle
      ? `Volta ${(studyCycle.completedCyclesCount || 0) + 1} · versão ${studyCycle.version || 1}.`
      : null,
    limitations: [],
    actionLabel: studyCycle && cycleDiff.diverges ? 'Conferir prévia do planejamento' : null,
    actionKind: studyCycle && cycleDiff.diverges ? 'open_planning_preview' : 'none',
  };

  // COP-07: Onde parei?
  const { bookmarked, latestSession } = findBookmarkTarget(
    subjects,
    sessions,
    canonicalAction?.topicId || topRec?.topicId || null
  );
  const bookmarkText = bookmarked ? formatBookmarkLabel(bookmarked.topic.bookmark) : '';
  const whereLeftOff: CopilotAnswer = {
    key: 'where_left_off',
    question: 'Onde parei?',
    headline: bookmarked
      ? `${bookmarked.subject.name} — ${bookmarked.topic.name}`
      : latestSession
        ? `Última sessão em ${formatDateBR(latestSession.date)}`
        : 'Nenhum ponto de parada registrado',
    body: bookmarked
      ? `Ponto de parada salvo: ${bookmarkText}.`
      : latestSession
        ? `Seu último registro durou ${formatPlanMinutes(Math.round((Number(latestSession.durationSeconds) || 0) / 60))}; você pode marcar página ou aula ao concluir uma sessão.`
        : 'Ao concluir uma sessão no cronômetro, abra "Onde você parou?" para retomar da página ou aula exata.',
    evidenceSummary: bookmarkText
      ? `Ponto de parada em "${bookmarked?.topic.name}"`
      : latestSession
        ? `Sessão ${latestSession.id}`
        : null,
    limitations: [],
    actionLabel: bookmarked ? 'Retomar tópico' : null,
    actionKind: bookmarked ? 'execute_action' : 'none',
    targetSubjectId: bookmarked?.subject.id || null,
    targetTopicId: bookmarked?.topic.id || null,
  };

  const answers: Record<CopilotQuestionKey, CopilotAnswer> = {
    what_now: whatNow,
    why_this: whyThis,
    quick_30: quick30,
    week_status: weekStatus,
    did_it_work: didItWork,
    cycle_vs_diagnosis: cycleVsDiagnosis,
    where_left_off: whereLeftOff,
  };

  return {
    recommendationId: canonicalAction?.recommendationId || topRec?.recommendationId || null,
    title: whatNow.headline,
    evidence: hasEvidence
      ? whatNow.evidenceSummary || `${sessions.length} sessões · ${totalQuestions} questões`
      : 'Sem dados suficientes para recomendação personalizada.',
    limitations,
    action: canonicalAction,
    source: canonicalAction ? 'today' : !hasAnySubjects ? 'empty' : 'diagnosis',
    generatedAt: nowISO,
    confidence: {
      level: confidenceLevel,
      label: confidenceLabel,
    },
    answers,
    questionsList: [
      whatNow,
      whyThis,
      quick30,
      weekStatus,
      didItWork,
      cycleVsDiagnosis,
      whereLeftOff,
    ],
    mutatedState: false,
  };
}

export function answerCopilotQuestion(
  key: CopilotQuestionKey,
  input: BuildStudyCopilotInput
): CopilotAnswer {
  const vm = buildStudyCopilotViewModel(input);
  return vm.answers[key] || vm.answers.what_now;
}

/**
 * Revalida uma ação do Copiloto no momento do clique contra o estado atual (COP-10).
 */
export function revalidateCopilotAction(
  action: Record<string, any> | null | undefined,
  {
    candidates = [],
    recommendations = [],
    subjects = [],
  }: {
    candidates?: Array<Record<string, any>>;
    recommendations?: Array<Record<string, any>>;
    subjects?: Array<Record<string, any>>;
  }
) {
  if (!action) {
    return {
      valid: false,
      changed: false,
      reason: 'Nenhuma ação selecionada.',
    };
  }

  const subject = action.subjectId
    ? subjects.find(s => s && s.id === action.subjectId)
    : null;
  if (action.subjectId && (!subject || subject.archived)) {
    return {
      valid: false,
      changed: true,
      reason: 'A disciplina desta orientação foi arquivada ou removida.',
    };
  }

  const topic =
    action.topicId && subject
      ? (subject.topics || []).find((t: any) => t && t.id === action.topicId)
      : null;
  if (action.topicId && (!topic || topic.archived)) {
    return {
      valid: false,
      changed: true,
      reason: 'O tópico desta orientação foi arquivado ou removido.',
    };
  }

  const candidate = action.topicId
    ? candidates.find(c => c.topicId === action.topicId)
    : null;
  if (candidate && candidate.blockedPrerequisites?.length) {
    return {
      valid: false,
      changed: true,
      reason: 'Este tópico passou a aguardar pré-requisitos antes do estudo.',
    };
  }

  const currentTop = recommendations[0] || null;
  const matchesTop = currentTop ? sameStudyActionTarget(action, currentTop) : false;

  return {
    valid: true,
    changed: Boolean(currentTop && !matchesTop),
    reason: currentTop && !matchesTop ? 'A prioridade principal mudou desde a última leitura.' : undefined,
    currentTop,
  };
}
