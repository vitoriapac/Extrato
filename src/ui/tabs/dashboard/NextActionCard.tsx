import type { JSX } from 'preact';
import type { TopicBookmark } from '../../../core/types.js';
import { BookmarkBadge } from '../../components/BookmarkBadge.js';
import { Icon } from '../../primitives/icon.js';

export interface NextActionSixQuestions {
  what: {
    subjectName: string;
    topicName: string;
  };
  why: {
    primaryReason: string;
    additionalReasons?: string[];
  };
  duration: {
    minutesFormatted: string;
    minutesNumeric?: number;
  };
  importance: {
    priorityScore?: number | null;
    impactLabel?: string;
    weightLabel?: string;
  };
  evidence: {
    masteryLabel?: string;
    evidenceStrengthLabel?: string;
    accuracyLabel?: string;
    historicalPresenceLabel?: string;
  };
  nextStep: {
    activityType: 'study' | 'review' | 'questions' | 'simulation' | string;
    actionLabel: string;
    buttonText: string;
    buttonAction:
      | { type: 'daily-start'; planItemId: string }
      | { type: 'daily-resume' }
      | { type: 'recommendation'; actionId: string; source: string }
      | { type: 'timer-focus' }
      | { type: 'blocked'; reason: string }
      | { type: string; [key: string]: any };
  };
  bookmark?: TopicBookmark | null | any;
  resumeLabel?: string;
}

export interface NextActionCardProps {
  model: NextActionSixQuestions | null;
  emptyState?: {
    message?: string;
    timerHref?: string | null;
    isFirstRun?: boolean;
    onboardingTitle?: string;
    onboardingDescription?: string;
    onOpenOnboarding?: () => void;
    onOpenDemo?: () => void;
  } | null;
  isInProgress?: boolean;
  activeTimerNoticeHtml?: string;
  suggestionNoticeHtml?: string;
  explanationHtml?: string;
  dataAttributes?: Record<string, string>;
  onExecuteAction?: () => void;
}

export function NextActionCard({
  model,
  emptyState,
  isInProgress = false,
  activeTimerNoticeHtml = '',
  suggestionNoticeHtml = '',
  explanationHtml = '',
  dataAttributes = {},
  onExecuteAction,
}: NextActionCardProps): JSX.Element {
  if (!model) {
    if (emptyState?.isFirstRun) {
      return (
        <div className="overview-next-action-container">
          {activeTimerNoticeHtml && (
            <div dangerouslySetInnerHTML={{ __html: activeTimerNoticeHtml }} />
          )}
          <section
            className="welcome-hero-card p-5 rounded-default border border-border-default bg-surface-card shadow-xs flex flex-col gap-3"
            aria-labelledby="welcomeHeroTitle"
            data-welcome-hero="true"
          >
            <div className="flex flex-col gap-1">
              <span className="text-xs font-bold tracking-wider uppercase text-secondary">
                PRIMEIRO ACESSO AO STUDYTRACK
              </span>
              <h3
                id="welcomeHeroTitle"
                className="text-lg font-bold text-primary m-0 flex items-center gap-2"
              >
                {emptyState.onboardingTitle || 'Bem-vindo ao StudyTrack'}
              </h3>
              <p className="text-sm text-secondary m-0 leading-relaxed">
                {emptyState.onboardingDescription ||
                  'Seu copiloto diário até a aprovação. Vamos montar sua rota de estudos personalizada em menos de 2 minutos?'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              <button
                type="button"
                className="btn inline-flex items-center gap-1.5"
                data-guided-action="open"
                onClick={emptyState.onOpenOnboarding}
                aria-label="Montar meu plano de estudos agora"
              >
                <Icon name="rocket" size={16} class="shrink-0" />
                <span>Montar meu plano de estudos</span>
              </button>
              <button
                type="button"
                className="btn ghost text-secondary hover:text-primary inline-flex items-center gap-1.5"
                id="enterDemoHeroBtn"
                data-delegated-click="openDemoIntro()"
                onClick={() => {
                  if (emptyState.onOpenDemo) {
                    emptyState.onOpenDemo();
                  } else {
                    const enterBtn =
                      document.getElementById('enterDemoBtn') ||
                      document.getElementById('enterDemoEmptyBtn');
                    enterBtn?.click();
                  }
                }}
                aria-label="Experimentar demonstração interativa com dados fictícios"
              >
                <Icon name="player-play" size={14} class="shrink-0" />
                <span>Experimentar demonstração</span>
              </button>
            </div>
          </section>
        </div>
      );
    }

    return (
      <div className="overview-next-action-container">
        {activeTimerNoticeHtml && (
          <div dangerouslySetInnerHTML={{ __html: activeTimerNoticeHtml }} />
        )}
        <p className="overview-alert-empty">
          {emptyState?.message || 'Ainda não há uma atividade elegível com os dados atuais.'}
        </p>
        {Boolean(emptyState?.timerHref) && (
          <a className="btn ghost small" href={emptyState!.timerHref!}>
            Ver cronômetro e registrar estudo
          </a>
        )}
      </div>
    );
  }

  const { what, why, duration, importance, evidence, nextStep, bookmark, resumeLabel } = model;

  const renderActionButton = () => {
    const { buttonAction, buttonText } = nextStep;

    if (buttonAction.type === 'blocked') {
      return (
        <button className="btn" type="button" disabled title={buttonAction.reason}>
          {buttonText || 'Finalize a sessão atual'}
        </button>
      );
    }

    if (buttonAction.type === 'timer-focus') {
      return (
        <button
          className="btn"
          type="button"
          data-delegated-click="openStudyTimerFocus()"
          onClick={onExecuteAction}
        >
          {buttonText || 'Retomar sessão'}
        </button>
      );
    }

    if (buttonAction.type === 'daily-resume') {
      return (
        <button className="btn" type="button" data-daily-resume onClick={onExecuteAction}>
          {buttonText || 'Retomar sessão'}
        </button>
      );
    }

    if (buttonAction.type === 'daily-start') {
      return (
        <button
          className="btn"
          type="button"
          data-daily-start={buttonAction.planItemId}
          onClick={onExecuteAction}
        >
          {buttonText || 'Iniciar estudo'}
        </button>
      );
    }

    if (buttonAction.type === 'recommendation') {
      return (
        <button
          className="btn"
          type="button"
          data-delegated-click={`executeStudyRecommendation('${buttonAction.actionId}','${buttonAction.source}')`}
          onClick={onExecuteAction}
        >
          {buttonText || 'Iniciar'}
        </button>
      );
    }

    return (
      <button className="btn" type="button" onClick={onExecuteAction}>
        {buttonText || 'Iniciar'}
      </button>
    );
  };

  return (
    <div className="overview-next-action-wrapper">
      {activeTimerNoticeHtml && <div dangerouslySetInnerHTML={{ __html: activeTimerNoticeHtml }} />}

      <article
        className={`card card--action overview-action-card ${isInProgress ? 'is-in-progress' : ''}`}
        {...dataAttributes}
      >
        <div>
          {/* 1. O que devo estudar? */}
          <h3>
            {what.subjectName} · {what.topicName}
          </h3>

          {/* Metadados: 3. Quanto tempo? + 4. Importância + Tipo */}
          <p className="daily-execution-metadata">
            <strong>{duration.minutesFormatted}</strong> · {nextStep.actionLabel}
            {importance.priorityScore != null && (
              <> · prioridade {Math.round(importance.priorityScore)}/100</>
            )}
            {importance.impactLabel && <> · {importance.impactLabel}</>}
          </p>

          {/* Ponto de parada (Bookmark) */}
          {Boolean(bookmark || resumeLabel) && (
            <p className="overview-action-resume flex items-center gap-1.5">
              <span>Continuar de: {resumeLabel || ''}</span>
              {bookmark && !resumeLabel && <BookmarkBadge bookmark={bookmark} />}
            </p>
          )}

          {/* 5. Que evidência indica a necessidade? */}
          {(evidence.masteryLabel ||
            evidence.accuracyLabel ||
            evidence.historicalPresenceLabel) && (
            <p className="overview-action-reason text-xs text-secondary mt-1">
              {[evidence.masteryLabel, evidence.accuracyLabel, evidence.historicalPresenceLabel]
                .filter(Boolean)
                .join(' · ')}
            </p>
          )}

          {isInProgress && <span className="active-study-status">Em andamento · Sessão ativa</span>}
        </div>

        {/* 6. O que devo fazer a seguir? (Botão de ação principal) */}
        <div className="overview-action-buttons">{renderActionButton()}</div>

        {/* Sugestão contextual (fora do plano ou alternativa) */}
        {suggestionNoticeHtml && <div dangerouslySetInnerHTML={{ __html: suggestionNoticeHtml }} />}

        {/* 2. Por que devo estudar isso? (Racional estruturado) */}
        {(why.primaryReason || (why.additionalReasons && why.additionalReasons.length > 0)) && (
          <details className="daily-execution-reasons mt-2">
            <summary>Por que estudar isso agora?</summary>
            <ul>
              {why.primaryReason && <li>{why.primaryReason}</li>}
              {(why.additionalReasons || []).map((reason, idx) => (
                <li key={idx}>{reason}</li>
              ))}
            </ul>
          </details>
        )}

        {/* Explicação detalhada da recomendação (Provas, Você, Metodologia) */}
        {explanationHtml && <div dangerouslySetInnerHTML={{ __html: explanationHtml }} />}
      </article>
    </div>
  );
}
