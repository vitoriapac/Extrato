import type { ComponentChildren, JSX } from 'preact';
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
  practiceLinks?: {
    tecUrl: string;
    qcUrl: string;
    customUrl?: string | null;
    isCustom?: boolean;
  } | null;
}

export interface NextActionCardProps {
  model: NextActionSixQuestions | null;
  practiceLinks?: {
    tecUrl: string;
    qcUrl: string;
    customUrl?: string | null;
    isCustom?: boolean;
  } | null;
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
  activeTimerNotice?: ComponentChildren;
  suggestionNotice?: ComponentChildren;
  explanationNode?: ComponentChildren;
  activeTimerNoticeHtml?: string;
  suggestionNoticeHtml?: string;
  explanationHtml?: string;
  dataAttributes?: Record<string, string>;
  onExecuteAction?: () => void;
  onOpenTopicIntelligence?: () => void;
}

export function NextActionCard({
  model,
  emptyState,
  practiceLinks,
  isInProgress = false,
  activeTimerNotice,
  suggestionNotice,
  explanationNode,
  activeTimerNoticeHtml = '',
  suggestionNoticeHtml = '',
  explanationHtml = '',
  dataAttributes = {},
  onExecuteAction,
  onOpenTopicIntelligence,
}: NextActionCardProps): JSX.Element {
  if (!model) {
    if (emptyState?.isFirstRun) {
      return (
        <div className="overview-next-action-container">
          {activeTimerNotice ??
            (activeTimerNoticeHtml ? (
              <div dangerouslySetInnerHTML={{ __html: activeTimerNoticeHtml }} />
            ) : null)}
          <section
            className="welcome-hero-card flex flex-col gap-3"
            aria-labelledby="welcomeHeroTitle"
            data-welcome-hero="true"
          >
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold tracking-wide uppercase text-secondary">
                PRIMEIRO ACESSO AO EXTRATO DE ESTUDOS
              </span>
              <h3
                id="welcomeHeroTitle"
                className="text-lg font-semibold text-primary m-0 flex items-center gap-2"
              >
                {emptyState.onboardingTitle || 'Bem-vindo ao Extrato de Estudos'}
              </h3>
              <p className="text-sm text-secondary m-0 leading-relaxed">
                {emptyState.onboardingDescription ||
                  'Organize sua rota de estudos no extrato em menos de 2 minutos.'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="button"
                className="btn inline-flex items-center gap-2"
                data-guided-action="open"
                onClick={emptyState.onOpenOnboarding}
                aria-label="Montar meu plano de estudos agora"
              >
                <Icon name="compass" size={16} class="shrink-0" />
                <span>Montar meu plano de estudos</span>
              </button>
              <button
                type="button"
                className="btn ghost text-secondary hover:text-primary inline-flex items-center gap-2"
                id="enterDemoHeroBtn"
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
                aria-label="Explorar demonstração interativa com dados fictícios"
              >
                <Icon name="player-play" size={14} class="shrink-0" />
                <span>Explorar demonstração</span>
              </button>
            </div>
          </section>
        </div>
      );
    }

    return (
      <div className="overview-next-action-container">
        {activeTimerNotice ??
          (activeTimerNoticeHtml ? (
            <div dangerouslySetInnerHTML={{ __html: activeTimerNoticeHtml }} />
          ) : null)}
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
          title="Retomar sessão (Alt+Enter)"
          aria-keyshortcuts="Alt+Enter"
        >
          {buttonText || 'Retomar sessão'}
        </button>
      );
    }

    if (buttonAction.type === 'daily-resume') {
      return (
        <button
          className="btn"
          type="button"
          data-daily-resume
          onClick={onExecuteAction}
          title="Retomar sessão (Alt+Enter)"
          aria-keyshortcuts="Alt+Enter"
        >
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
          title="Iniciar estudo (Alt+Enter)"
          aria-keyshortcuts="Alt+Enter"
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
          title="Iniciar recomendação (Alt+Enter)"
          aria-keyshortcuts="Alt+Enter"
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
          {why.primaryReason && <p className="overview-action-reason">{why.primaryReason}</p>}

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
            <p className="overview-action-resume flex items-center gap-2">
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
          {nextStep.buttonAction.type === 'blocked' && <p>{nextStep.buttonAction.reason}</p>}
        </div>

        {/* 6. O que devo fazer a seguir? (Ação principal + atalho da Ficha; links externos em linha discreta) */}
        <div className="overview-action-buttons flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            {renderActionButton()}
            {onOpenTopicIntelligence && (
              <button
                type="button"
                onClick={onOpenTopicIntelligence}
                className="btn btn--subtle text-xs inline-flex items-center gap-1 px-3 py-2 rounded-default border border-border-default bg-surface-card hover:bg-surface-subtle text-primary transition-colors cursor-pointer"
                aria-label={`Abrir Ficha Inteligente de ${what.topicName}`}
              >
                <Icon name="sparkles" size={13} class="shrink-0 text-secondary" />
                <span>Detalhar ficha</span>
              </button>
            )}
          </div>
          {(practiceLinks || model.practiceLinks) && (
            <div
              className="practice-action-links flex flex-wrap items-center gap-3 text-xs text-muted pt-0.5"
              role="group"
              aria-label="Atalhos para resolução de questões"
            >
              <span>Praticar em:</span>
              <a
                href={(practiceLinks || model.practiceLinks)!.tecUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-secondary hover:text-primary no-underline font-medium"
                title={`Resolver questões de ${what.topicName} no TEC Concursos`}
                aria-label={`Resolver questões de ${what.topicName} no TEC Concursos (abre em nova aba)`}
              >
                <Icon name="external-link" size={12} class="shrink-0" />
                <span>Questões no TEC</span>
              </a>
              <a
                href={(practiceLinks || model.practiceLinks)!.qcUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-secondary hover:text-primary no-underline font-medium"
                title={`Resolver questões de ${what.topicName} no QConcursos`}
                aria-label={`Resolver questões de ${what.topicName} no QConcursos (abre em nova aba)`}
              >
                <Icon name="external-link" size={12} class="shrink-0" />
                <span>QConcursos</span>
              </a>
              {(practiceLinks || model.practiceLinks)!.customUrl && (
                <a
                  href={(practiceLinks || model.practiceLinks)!.customUrl!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-accent font-medium hover:underline no-underline"
                  title="Abrir caderno personalizado do tópico"
                  aria-label={`Abrir caderno personalizado de ${what.topicName} (abre em nova aba)`}
                >
                  <Icon name="bookmark" size={12} class="shrink-0 text-accent" />
                  <span>Caderno</span>
                </a>
              )}
            </div>
          )}
        </div>

        {/* Sugestão contextual (fora do plano ou alternativa) */}
        {suggestionNotice ?? (suggestionNoticeHtml ? <div dangerouslySetInnerHTML={{ __html: suggestionNoticeHtml }} /> : null)}

        {/* 2. Motivos adicionais: só quando não há a explicação detalhada, que já os traz (um disclose por decisão). */}
        {Boolean(why.additionalReasons?.length) && !explanationNode && !explanationHtml && (
          <details className="daily-execution-reasons mt-2">
            <summary>Por que estudar isso agora?</summary>
            <ul>
              {(why.additionalReasons || []).map((reason, idx) => (
                <li key={idx}>{reason}</li>
              ))}
            </ul>
          </details>
        )}

        {/* Explicação detalhada da recomendação (Provas, Você, Metodologia) */}
        {explanationNode ?? (explanationHtml ? <div dangerouslySetInnerHTML={{ __html: explanationHtml }} /> : null)}
      </article>
    </div>
  );
}
