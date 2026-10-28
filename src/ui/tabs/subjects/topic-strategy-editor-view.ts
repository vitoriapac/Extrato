import { buildTopicStrategyViewModel } from '../../../features/topic-strategy/topic-strategy-view-model.js';
import { renderTopicStrategyEditor as renderTopicStrategyEditorView } from '../../../features/topic-strategy/topic-strategy-renderer.js';

export interface TopicStrategyEditorViewOptions {
  subject: Record<string, any>;
  topic: Record<string, any>;
  subjectConfig: Record<string, any> | null;
  activeExamTags: readonly string[];
  topics: readonly any[];
  exams: readonly any[];
  examQuestions: readonly any[];
}

export function renderTopicStrategyEditor(opts: TopicStrategyEditorViewOptions): string {
  const model = buildTopicStrategyViewModel({
    subject: opts.subject,
    topic: opts.topic,
    subjectConfig: opts.subjectConfig,
    activeExamTags: opts.activeExamTags,
    topics: opts.topics,
    exams: opts.exams,
    examQuestions: opts.examQuestions,
  });
  return renderTopicStrategyEditorView(model);
}
