/**
 * Controlador da Ficha Inteligente do Tópico.
 * Coordena abertura contextual (Edital, Desempenho, Próxima Ação) e execução
 * compartilhada via `buildStudyAction` / `revalidateNextBestAction`.
 */

import type { TopicIntelligenceSnapshot } from '../../domain/topic-intelligence/topic-intelligence-types.js';
import {
  buildTopicIntelligence,
  type BuildTopicIntelligenceInput,
} from '../../application/topic-intelligence/build-topic-intelligence.js';
import {
  buildTopicIntelligenceViewModel,
  type TopicIntelligenceViewModel,
} from './topic-intelligence-view-model.js';

export interface TopicIntelligenceControllerDeps {
  resolveInput: (context: {
    examId?: string | null;
    subjectId: string;
    topicId: string;
    source?: string;
  }) => BuildTopicIntelligenceInput | null;
  onExecuteAction: (action: Record<string, any>) => void;
  onNavigateToQuestions?: (context: { subjectId: string; topicId: string }) => void;
  onNavigateToHistory?: (context: { subjectId: string; topicId: string }) => void;
}

export function createTopicIntelligenceController(deps: TopicIntelligenceControllerDeps) {
  function openTopic(context: {
    examId?: string | null;
    subjectId: string;
    topicId: string;
    source?: string;
  }): TopicIntelligenceViewModel | null {
    const input = deps.resolveInput(context);
    if (!input) return null;
    const snapshot: TopicIntelligenceSnapshot | null = buildTopicIntelligence(input);
    return buildTopicIntelligenceViewModel(snapshot);
  }

  function startSuggestedAction(snapshot: TopicIntelligenceSnapshot): boolean {
    if (!snapshot.nextAction?.action) return false;
    deps.onExecuteAction(snapshot.nextAction.action);
    return true;
  }

  return {
    openTopic,
    startSuggestedAction,
    navigateToQuestions: deps.onNavigateToQuestions,
    navigateToHistory: deps.onNavigateToHistory,
  };
}
