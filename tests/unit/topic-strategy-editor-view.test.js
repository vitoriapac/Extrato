import test from 'node:test';
import assert from 'node:assert/strict';
import { renderTopicStrategyEditor } from '../../src/ui/tabs/subjects/topic-strategy-editor-view.js';

test('renderTopicStrategyEditor — renderiza o editor de estratégia do tópico', () => {
  const subject = { id: 'sub-1', name: 'Português' };
  const topic = {
    id: 'top-1',
    name: 'Crase',
    examImportance: 0.8,
    estimatedStudyMinutes: 60,
    prerequisites: [],
  };
  const subjectConfig = { subjectId: 'sub-1', expectedQuestions: 10 };

  const html = renderTopicStrategyEditor({
    subject,
    topic,
    subjectConfig,
    activeExamTags: ['bb-escriturario'],
    topics: [topic],
    exams: [],
    examQuestions: [],
  });

  assert.ok(html.length > 0);
  assert.ok(html.includes('topic-strategy-summary'));
});
