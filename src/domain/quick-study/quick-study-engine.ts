/**
 * Motor do Modo Estudo Rápido (RAP-01 a RAP-07).
 *
 * Constrói uma prévia não destrutiva de sessão rápida (15, 30, 45, 60 min ou personalizada)
 * reaproveitando candidatos elegíveis, o motor de resgate de revisões / aquecimento e o
 * executor canônico (`buildStudyAction`), sem criar planejamento ou fila paralela.
 */

import type { JurisprudenceRecord, LawRecord, StudyActivityType, TimerStrategy } from '../../core/types.js';
import { buildStudyAction } from '../../application/recommendations/recommendation-action.js';
import { formatBookmarkLabel } from '../topic-bookmark.js';
import { canStudy } from '../study-eligibility.js';
import {
  buildRecoveryMissionPlan,
  type OverdueReviewItem,
} from '../recovery/recovery-mission-engine.js';
import { lawEffectiveRange, lawStatus, sortLawsForReview } from '../law-notebook.js';
import { jurisprudenceStatus, sortJurisprudenceForReview } from '../jurisprudence-notebook.js';
import type { StudyCycleBlock } from '../planning/study-cycle-engine.js';

export type QuickStudyFocusMode =
  | 'priority'
  | 'review'
  | 'questions'
  | 'resume'
  | 'cycle'
  | 'law';

export interface QuickStudyProposalOptions {
  durationMinutes: number;
  focusMode?: QuickStudyFocusMode;
  candidates?: Array<Record<string, any>>;
  overdueReviews?: readonly OverdueReviewItem[];
  criticalTopicIds?: readonly string[];
  currentCycleBlock?: StudyCycleBlock | null;
  subjects?: Array<Record<string, any>>;
  laws?: readonly LawRecord[];
  jurisprudence?: readonly JurisprudenceRecord[];
  today?: string;
  source?: string;
}

export interface QuickStudyProposal {
  kind: 'candidate' | 'recovery_review' | 'cycle_block' | 'law_reading' | 'free_study';
  requestedMinutes: number;
  plannedMinutes: number;
  focusMode: QuickStudyFocusMode;
  subjectId: string | null;
  subjectName: string;
  topicId: string | null;
  topicName: string;
  activityType: StudyActivityType;
  action: ReturnType<typeof buildStudyAction> | null;
  strategy: TimerStrategy | null;
  cycleBlockId: string | null;
  cycleWillFinishBlock: boolean | null;
  reviewId: string | null;
  origin: 'quick' | 'cycle';
  reasoning: string;
  mutatedState: false;
}

function clampMinutes(raw: unknown): number {
  const value = Math.round(Number(raw) || 30);
  return Math.max(10, Math.min(180, value));
}

function buildSegmentedStrategy(
  totalMinutes: number,
  activityType: StudyActivityType
): TimerStrategy | null {
  if (totalMinutes < 25) return null;
  const first = Math.max(10, Math.round(totalMinutes * 0.6));
  const second = Math.max(5, totalMinutes - first);
  if (first + second > totalMinutes) return null;

  if (activityType === 'review') {
    return {
      label: `Bloco rápido guiado (${first + second} min)`,
      steps: [
        { label: 'Recordação ativa', minutes: first },
        { label: 'Questões de fixação', minutes: second },
      ],
    };
  }

  if (activityType === 'questions') {
    return {
      label: `Bateria direcionada (${first + second} min)`,
      steps: [
        { label: 'Resolução focada', minutes: first },
        { label: 'Revisão dos erros', minutes: second },
      ],
    };
  }

  return {
    label: `Estudo rápido em duas etapas (${first + second} min)`,
    steps: [
      { label: 'Teoria essencial / ponto de parada', minutes: first },
      { label: 'Questões do tópico', minutes: second },
    ],
  };
}

function buildCanonicalAction(
  candidate: Record<string, any> | null,
  fallback: {
    id: string;
    subjectId: string | null;
    topicId: string | null;
    activityType: StudyActivityType;
    estimatedMinutes: number;
    reasons: string[];
  },
  source: string
) {
  const payload = {
    ...(candidate || {}),
    id: candidate?.recommendationId || candidate?.id || fallback.id,
    subjectId: candidate?.subjectId ?? fallback.subjectId,
    topicId: candidate?.topicId ?? fallback.topicId,
    activityType: fallback.activityType,
    studyType: fallback.activityType,
    estimatedMinutes: fallback.estimatedMinutes,
    reasons:
      Array.isArray(candidate?.reasons) && candidate.reasons.length
        ? candidate.reasons
        : fallback.reasons,
  };
  return buildStudyAction(payload, { source });
}

function isEligibleCandidate(candidate: Record<string, any> | null | undefined): boolean {
  if (!candidate) return false;
  if (candidate.available === false || candidate.eligible === false) return false;
  return canStudy(candidate, { ignoreToday: true });
}

export function buildQuickStudyProposal(
  options: QuickStudyProposalOptions
): QuickStudyProposal {
  const plannedMinutes = clampMinutes(options.durationMinutes);
  const focusMode: QuickStudyFocusMode = options.focusMode || 'priority';
  const source = options.source || 'today';
  const subjects = Array.isArray(options.subjects) ? options.subjects : [];
  const activeSubjectIds = new Set(
    subjects.filter(s => s && !s.archived).map(s => String(s.id))
  );

  const eligibleCandidates = (options.candidates || [])
    .filter(isEligibleCandidate)
    .filter(c => !subjects.length || !c.subjectId || activeSubjectIds.has(String(c.subjectId)))
    .sort((a, b) => (Number(b.score) || 0) - (Number(a.score) || 0));

  const overdueReviews = Array.isArray(options.overdueReviews) ? options.overdueReviews : [];

  // RAP-04: Bloco ativo do ciclo sob tempo reduzido (sem avançar antecipadamente)
  if (
    focusMode === 'cycle' &&
    options.currentCycleBlock &&
    (!subjects.length || activeSubjectIds.has(String(options.currentCycleBlock.subjectId)))
  ) {
    const block = options.currentCycleBlock;
    const remainingBlock =
      block.remainingMinutes != null && block.remainingMinutes > 0
        ? block.remainingMinutes
        : block.durationMinutes;
    const sessionMinutes = Math.min(plannedMinutes, remainingBlock);
    const willFinish = sessionMinutes >= remainingBlock;
    const match =
      eligibleCandidates.find(c => c.subjectId === block.subjectId && (!block.topicId || c.topicId === block.topicId)) ||
      eligibleCandidates.find(c => c.subjectId === block.subjectId) ||
      null;
    const activityType: StudyActivityType = block.preferredActivity || 'study';
    const action = buildCanonicalAction(
      match,
      {
        id: block.id,
        subjectId: block.subjectId,
        topicId: block.topicId || match?.topicId || null,
        activityType,
        estimatedMinutes: sessionMinutes,
        reasons: [
          willFinish
            ? 'Conclui o saldo do bloco atual do ciclo nesta sessão.'
            : `Execução parcial do bloco do ciclo (${sessionMinutes} de ${remainingBlock} min); o saldo restante é mantido.`,
        ],
      },
      source
    );

    return {
      kind: 'cycle_block',
      requestedMinutes: plannedMinutes,
      plannedMinutes: sessionMinutes,
      focusMode,
      subjectId: block.subjectId,
      subjectName: block.subjectName,
      topicId: action?.topicId || null,
      topicName: match?.topicName || 'Tópico da disciplina no ciclo',
      activityType,
      action,
      strategy: buildSegmentedStrategy(sessionMinutes, activityType),
      cycleBlockId: block.id,
      cycleWillFinishBlock: willFinish,
      reviewId: null,
      origin: 'cycle',
      reasoning: willFinish
        ? `Bloco atual do ciclo (${block.subjectName}) cabe integralmente nos ${sessionMinutes} min e avança o ponteiro somente após confirmação.`
        : `Bloco atual do ciclo (${block.subjectName}) tem ${remainingBlock} min restantes; ${sessionMinutes} min serão executados como saldo parcial.`,
      mutatedState: false,
    };
  }

  // RAP-07: Aquecimento de 15 min ou modo Revisão compartilham motor de resgate de revisões
  const shouldUseRecovery =
    focusMode === 'review' || (focusMode === 'priority' && plannedMinutes <= 15 && overdueReviews.length > 0);
  if (shouldUseRecovery && overdueReviews.length > 0) {
    const blockDuration = Math.min(plannedMinutes, Math.max(10, Math.min(15, plannedMinutes)));
    const recoveryPlan = buildRecoveryMissionPlan({
      overdueItems: overdueReviews,
      availableMinutes: plannedMinutes,
      blockDurationMinutes: blockDuration,
      criticalTopicIds: options.criticalTopicIds,
    });
    const topBlock = recoveryPlan.blocks[0];
    if (topBlock) {
      const match =
        eligibleCandidates.find(c => c.topicId === topBlock.topicId) ||
        eligibleCandidates.find(c => c.subjectId === topBlock.subjectId) ||
        null;
      const totalMinutes = Math.min(plannedMinutes, recoveryPlan.totalAllocatedMinutes || blockDuration);
      const action = buildCanonicalAction(
        match,
        {
          id: topBlock.reviewId,
          subjectId: topBlock.subjectId || null,
          topicId: topBlock.topicId || null,
          activityType: 'review',
          estimatedMinutes: totalMinutes,
          reasons: [topBlock.urgencyReason || 'Revisão prioritária em atraso.'],
        },
        source
      );

      const strategy: TimerStrategy | null =
        recoveryPlan.blocks.length > 1
          ? {
              label: `Resgate de revisões (${totalMinutes} min)`,
              steps: recoveryPlan.blocks.map(b => ({
                label: `${b.subjectName} — ${b.topicName}`,
                minutes: b.durationMinutes,
              })),
            }
          : null;

      return {
        kind: 'recovery_review',
        requestedMinutes: plannedMinutes,
        plannedMinutes: totalMinutes,
        focusMode,
        subjectId: topBlock.subjectId || null,
        subjectName: topBlock.subjectName,
        topicId: topBlock.topicId || null,
        topicName: topBlock.topicName,
        activityType: 'review',
        action,
        strategy,
        cycleBlockId: null,
        cycleWillFinishBlock: null,
        reviewId: topBlock.reviewId,
        origin: 'quick',
        reasoning: `Aproveitando o motor de resgate: ${recoveryPlan.blocks.length} revisão(ões) urgente(s) ajustada(s) para ${totalMinutes} min (${topBlock.urgencyReason}).`,
        mutatedState: false,
      };
    }
  }

  // Modo Lei Seca & Jurisprudência: puxa lei/informativo mais urgente sem mutar o plano semanal
  if (focusMode === 'law') {
    const todayRef = options.today || '2026-01-01';
    const sortedLaws = sortLawsForReview([...(options.laws || [])], todayRef);
    const sortedJuris = sortJurisprudenceForReview([...(options.jurisprudence || [])], todayRef);
    const topLaw = sortedLaws[0] || null;
    const topJuris = sortedJuris[0] || null;
    const topLawUrgent =
      topLaw && ['stalled', 'due'].includes(lawStatus(topLaw, todayRef).key);
    const topJurisUrgent =
      topJuris && ['due', 'new'].includes(jurisprudenceStatus(topJuris, todayRef).key);

    const subjectNameById = new Map(subjects.map(s => [String(s.id), String(s.name || '')]));

    if (topJuris && (topJurisUrgent || !topLaw || (!topLawUrgent && topJuris))) {
      const st = jurisprudenceStatus(topJuris, todayRef);
      return {
        kind: 'law_reading',
        requestedMinutes: plannedMinutes,
        plannedMinutes,
        focusMode,
        subjectId: topJuris.subjectId || null,
        subjectName:
          (topJuris.subjectId && subjectNameById.get(String(topJuris.subjectId))) ||
          'Jurisprudência',
        topicId: topJuris.topicId || null,
        topicName: `${topJuris.code} — ${topJuris.title}`,
        activityType: 'review',
        action: null,
        strategy: null,
        cycleBlockId: null,
        cycleWillFinishBlock: null,
        reviewId: null,
        origin: 'quick',
        reasoning: `Revisão de jurisprudência (${st.label.toLowerCase()}): ${topJuris.code}. Sem alterar seu plano semanal.`,
        mutatedState: false,
      };
    }

    if (topLaw) {
      const range = lawEffectiveRange(topLaw);
      const rangeSuffix =
        topLaw.startArticle != null || topLaw.endArticle != null
          ? range
            ? ` (Arts. ${range.start}–${range.end})`
            : ''
          : '';
      const st = lawStatus(topLaw, todayRef);
      return {
        kind: 'law_reading',
        requestedMinutes: plannedMinutes,
        plannedMinutes,
        focusMode,
        subjectId: topLaw.subjectId || null,
        subjectName:
          (topLaw.subjectId && subjectNameById.get(String(topLaw.subjectId))) || 'Lei Seca',
        topicId: null,
        topicName: `${topLaw.name}${rangeSuffix}`,
        activityType: 'review',
        action: null,
        strategy: null,
        cycleBlockId: null,
        cycleWillFinishBlock: null,
        reviewId: null,
        origin: 'quick',
        reasoning: `Leitura de lei seca (${st.label.toLowerCase()}): ${topLaw.name}${topLaw.hotArticles ? ` · Foco: ${topLaw.hotArticles}` : ''}.`,
        mutatedState: false,
      };
    }
  }

  // Modo Retomar assunto com bookmark ("Onde você parou")
  if (focusMode === 'resume') {
    const resumeTopics: Array<{ candidate: Record<string, any> | null; subject: any; topic: any; bookmarkLabel: string }> = [];
    for (const subject of subjects) {
      if (!subject || subject.archived) continue;
      for (const topic of subject.topics || []) {
        if (!topic || topic.archived || !topic.bookmark) continue;
        const candidate = eligibleCandidates.find(c => c.topicId === topic.id) || null;
        if (candidate || !(Array.isArray(topic.prerequisites) && topic.prerequisites.length > 0)) {
          const label = formatBookmarkLabel(topic.bookmark);
          if (label) resumeTopics.push({ candidate, subject, topic, bookmarkLabel: label });
        }
      }
    }
    const chosenResume = resumeTopics.sort(
      (a, b) => (Number(b.candidate?.score) || 0) - (Number(a.candidate?.score) || 0)
    )[0];

    if (chosenResume) {
      const action = buildCanonicalAction(
        chosenResume.candidate,
        {
          id: `resume-${chosenResume.topic.id}`,
          subjectId: chosenResume.subject.id,
          topicId: chosenResume.topic.id,
          activityType: 'study',
          estimatedMinutes: plannedMinutes,
          reasons: [`Retomar de onde parou: ${chosenResume.bookmarkLabel}`],
        },
        source
      );

      return {
        kind: 'candidate',
        requestedMinutes: plannedMinutes,
        plannedMinutes,
        focusMode,
        subjectId: chosenResume.subject.id,
        subjectName: chosenResume.subject.name,
        topicId: chosenResume.topic.id,
        topicName: chosenResume.topic.name,
        activityType: 'study',
        action,
        strategy: buildSegmentedStrategy(plannedMinutes, 'study'),
        cycleBlockId: null,
        cycleWillFinishBlock: null,
        reviewId: null,
        origin: 'quick',
        reasoning: `Retomada direta pelo ponto de parada registrado: ${chosenResume.bookmarkLabel}.`,
        mutatedState: false,
      };
    }
  }

  // Candidato elegível por foco ('priority', 'questions', 'review' sem atraso ou fallback)
  let picked: Record<string, any> | null = null;
  if (focusMode === 'questions') {
    picked =
      eligibleCandidates.find(c => c.studyType === 'questions' || (c.masteryGap ?? 0) > 20) ||
      eligibleCandidates[0] ||
      null;
  } else if (focusMode === 'review') {
    picked =
      eligibleCandidates.find(
        c => c.studyType === 'review' || (c.reviewUrgency ?? 0) >= 20 || (c.retentionRisk ?? 0) >= 20
      ) ||
      eligibleCandidates[0] ||
      null;
  } else {
    picked = eligibleCandidates[0] || null;
  }

  if (picked) {
    const resolvedType: StudyActivityType =
      focusMode === 'questions'
        ? 'questions'
        : focusMode === 'review'
          ? 'review'
          : picked.studyType === 'questions' || picked.studyType === 'review'
            ? picked.studyType
            : 'study';
    const action = buildCanonicalAction(
      picked,
      {
        id: picked.id || picked.topicId || 'quick-candidate',
        subjectId: picked.subjectId || null,
        topicId: picked.topicId || null,
        activityType: resolvedType,
        estimatedMinutes: plannedMinutes,
        reasons: Array.isArray(picked.reasons) ? picked.reasons : ['Melhor prioridade elegível para o tempo informado.'],
      },
      source
    );

    return {
      kind: 'candidate',
      requestedMinutes: plannedMinutes,
      plannedMinutes,
      focusMode,
      subjectId: picked.subjectId || null,
      subjectName: picked.subjectName || 'Disciplina prioritária',
      topicId: picked.topicId || null,
      topicName: picked.topicName || 'Tópico prioritário',
      activityType: resolvedType,
      action,
      strategy: buildSegmentedStrategy(plannedMinutes, resolvedType),
      cycleBlockId: null,
      cycleWillFinishBlock: null,
      reviewId: null,
      origin: 'quick',
      reasoning:
        (Array.isArray(picked.reasons) && picked.reasons[0]) ||
        `Selecionado pelo motor de prioridade vigente para ${plannedMinutes} min sem alterar seu plano semanal.`,
      mutatedState: false,
    };
  }

  // RAP-05: Sem candidato elegível -> estudo livre claramente identificado
  return {
    kind: 'free_study',
    requestedMinutes: plannedMinutes,
    plannedMinutes,
    focusMode,
    subjectId: null,
    subjectName: 'Sessão de estudo livre',
    topicId: null,
    topicName: 'Escolha disciplina e tópico no cronômetro',
    activityType: focusMode === 'questions' ? 'questions' : focusMode === 'review' ? 'review' : 'study',
    action: null,
    strategy: null,
    cycleBlockId: null,
    cycleWillFinishBlock: null,
    reviewId: null,
    origin: 'quick',
    reasoning:
      'Nenhuma atividade elegível automática disponível agora. Sessão de estudo livre claramente identificada; nenhuma recomendação foi inventada.',
    mutatedState: false,
  };
}
