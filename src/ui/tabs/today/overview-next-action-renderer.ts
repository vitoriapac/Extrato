import { unmountPreact } from '../../preact-mount.js';
import {
  buildStudyAction,
  recommendationActionLabel,
} from '../../../application/recommendations/recommendation-action.js';
import { buildPriorityViewModel } from '../../view-models/priority-view-model.js';
import { buildRecommendationExplanation } from '../../../application/recommendations/build-recommendation-explanation.js';
import { renderRecommendationExplanation } from '../../renderers/recommendation-explanation-renderer.js';
import { renderPlannedAction } from '../../renderers/daily-execution-renderer.js';
import { createDashboardTabController } from '../dashboard/dashboard-tab-controller.js';
import { buildPracticeLinks } from '../../../domain/questions/practice-link-generator.js';
import type { StudyRecommendationControllerDeps } from './study-recommendation-controller.js';

export type OverviewNextActionDeps = Pick<
  StudyRecommendationControllerDeps,
  | 'document'
  | 'getState'
  | 'metaHoursToday'
  | 'dailyExecutionController'
  | 'hasStartedStudyTimer'
  | 'renderActiveStudyTimerNotice'
  | 'formatPlanMinutes'
  | 'escapeHtml'
  | 'escapeAttr'
  | 'topicResumeLabel'
  | 'activeTimerMatchesRecommendation'
  | 'getTopicById'
> & { getCurrentRecommendations: () => any[] };

/** Card "próxima ação" da Visão geral: prioriza o plano do dia e cai na recomendação do motor. */
export function createOverviewNextActionRenderer(deps: OverviewNextActionDeps) {
  const {
    document,
    getState,
    metaHoursToday,
    dailyExecutionController,
    hasStartedStudyTimer,
    renderActiveStudyTimerNotice,
    formatPlanMinutes,
    escapeHtml,
    escapeAttr,
    topicResumeLabel,
    activeTimerMatchesRecommendation,
    getTopicById,
    getCurrentRecommendations,
  } = deps;

  function renderOverviewNextAction(availableMinutes?: number) {
    const container = document.getElementById('overviewNextAction');
    if (!container) return;
    const effectiveMinutes = availableMinutes ?? Math.max(0, Math.round(metaHoursToday() * 60));
    const state = getState();
    const outcome = '';
    const item = getCurrentRecommendations()[0];
    const { priority } = dailyExecutionController.build();

    if (
      priority?.nextItem &&
      !(
        item &&
        priority.nextItem.subjectId === item.subjectId &&
        priority.nextItem.topicId === item.topicId
      )
    ) {
      const suggestion = item
        ? {
            subjectId: item.subjectId,
            topicId: item.topicId,
            subjectName: item.subjectName,
            topicName: item.topicName,
            score: item.score,
            actionId: buildStudyAction(item, { source: 'overview' })?.id,
          }
        : null;
      const ownTimer =
        hasStartedStudyTimer() && state.activeTimer?.planItemId === priority.nextItem.id;
      unmountPreact(container);
      container.innerHTML = `${ownTimer ? '' : renderActiveStudyTimerNotice(null)}${outcome}${renderPlannedAction(
        priority,
        {
          suggestion,
          escapeHtml,
          escapeAttr,
          formatMinutes: formatPlanMinutes,
          timer: { active: hasStartedStudyTimer(), planItemId: state.activeTimer?.planItemId },
          resumeLabel: topicResumeLabel(priority.nextItem.topicId),
        }
      )}`;
      return;
    }
    unmountPreact(container);
    container.replaceChildren();
    const dashboardController = createDashboardTabController();
    if (!item) {
      const hasPlan =
        (Array.isArray(state.studyPlans) && state.studyPlans.length > 0) ||
        (state.dailyPlans || []).some((plan: any) => (plan.items || []).length > 0);
      const hasHistory =
        (state.studySessions || []).length > 0 || (state.questoes || []).length > 0;
      const hasActiveContent = (state.subjects || []).some(
        (s: any) => !s.archived && (s.topics || []).some((t: any) => !t.archived)
      );
      const isFirstRun = !hasPlan && !hasHistory;

      dashboardController.mountNextActionCard(container, {
        model: null,
        emptyState: {
          isFirstRun,
          message:
            effectiveMinutes < 15
              ? 'Defina pelo menos 15 minutos para hoje para receber uma sugestão.'
              : 'Ainda não há uma atividade elegível com os dados atuais.',
          timerHref: hasActiveContent ? '#study-timer' : null,
        },
        activeTimerNoticeHtml: renderActiveStudyTimerNotice(null),
      });
      return;
    }
    const action = buildStudyAction(item, { source: 'overview' }),
      model = buildPriorityViewModel(item, 1),
      label = recommendationActionLabel(action!),
      mastery =
        action!.evidence.mastery == null
          ? 'Domínio ainda sem evidência'
          : `Domínio ${Math.round(action!.evidence.mastery)}/100`,
      minutes =
        action!.suggestedMinutes == null
          ? 'Tempo não estimado'
          : formatPlanMinutes(action!.suggestedMinutes);
    const inProgress = activeTimerMatchesRecommendation(item),
      blocked = hasStartedStudyTimer() && !inProgress;

    const buttonAction = inProgress
      ? { type: 'timer-focus' }
      : blocked
        ? {
            type: 'blocked',
            reason: 'Retome ou finalize a sessão em andamento antes de iniciar outra.',
          }
        : { type: 'recommendation', actionId: action!.id, source: action!.source };

    const buttonText = inProgress ? 'Retomar sessão' : blocked ? 'Finalize a sessão atual' : label;

    const topicObj = getTopicById(item.topicId);
    const customPracticeUrl =
      topicObj?.topic?.customPracticeUrl ||
      topicObj?.topic?.bookmark?.customPracticeUrl ||
      (topicObj?.topic?.link &&
      (topicObj.topic.link.includes('tecconcursos') || topicObj.topic.link.includes('qconcursos'))
        ? topicObj.topic.link
        : undefined);

    const practiceLinks = buildPracticeLinks({
      topicName: item.topicName,
      subjectName: item.subjectName,
      customUrl: customPracticeUrl,
    });

    dashboardController.mountNextActionCard(container, {
      model: {
        what: {
          subjectName: item.subjectName,
          topicName: item.topicName,
        },
        why: {
          primaryReason:
            action!.evidence.label ||
            model.evidenceLabel ||
            'Recomendação baseada em prioridade de edital',
          additionalReasons: (item.reasons || []).slice(0, 3),
        },
        duration: {
          minutesFormatted: minutes,
          minutesNumeric: action!.suggestedMinutes ?? undefined,
        },
        importance: {
          priorityScore: action!.priority ?? null,
          impactLabel:
            item.examImpact != null ? `impacto ${Math.round(item.examImpact)}/100` : undefined,
        },
        evidence: {
          masteryLabel: mastery,
          accuracyLabel:
            item.accuracy != null ? `precisão recente ${Math.round(item.accuracy)}%` : undefined,
          historicalPresenceLabel:
            item.examIntelligence?.presencePercent != null
              ? `${Math.round(item.examIntelligence.presencePercent)}% das provas`
              : undefined,
        },
        nextStep: {
          activityType: action!.activityType,
          actionLabel: label,
          buttonText,
          buttonAction,
        },
        bookmark: getTopicById(item.topicId)?.topic.bookmark,
        resumeLabel: topicResumeLabel(item.topicId),
        practiceLinks,
      },
      practiceLinks,
      isInProgress: inProgress,
      activeTimerNoticeHtml: renderActiveStudyTimerNotice(item),
      explanationHtml: renderRecommendationExplanation(
        item.explanation || buildRecommendationExplanation(item),
        { headingLevel: 4 }
      ),
      dataAttributes: {
        'data-study-action-source': action!.source,
        'data-study-action-id': escapeAttr(action!.id),
        'data-activity-type': action!.activityType,
      },
    });
  }

  return { renderOverviewNextAction };
}
