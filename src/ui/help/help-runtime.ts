import { renderHelpCenter } from './help-renderer.js';
import { HELP_CATEGORIES, HELP_GLOSSARY, HELP_FAQ } from './help-content.js';
import { renderHelpVisual } from './help-visuals.js';
import {
  buildHelpSearchIndex,
  matchesHelpSearch,
  rankHelpSearch,
  normalizeHelpText,
} from './help-search.js';
import { calculateEbbinghausRetention } from '../../domain/help/retention-simulator.js';
import {
  getTopicFeedback,
  saveTopicFeedback,
  clearTopicFeedback,
} from '../../domain/help/help-feedback.js';

export interface StudyTrackHelpRuntime {
  renderHelpCenter: typeof renderHelpCenter;
  HELP_CATEGORIES: typeof HELP_CATEGORIES;
  HELP_GLOSSARY: typeof HELP_GLOSSARY;
  HELP_FAQ: typeof HELP_FAQ;
  renderHelpVisual: typeof renderHelpVisual;
  buildHelpSearchIndex: typeof buildHelpSearchIndex;
  matchesHelpSearch: typeof matchesHelpSearch;
  rankHelpSearch: typeof rankHelpSearch;
  normalizeHelpText: typeof normalizeHelpText;
  calculateEbbinghausRetention: typeof calculateEbbinghausRetention;
  getTopicFeedback: typeof getTopicFeedback;
  saveTopicFeedback: typeof saveTopicFeedback;
  clearTopicFeedback: typeof clearTopicFeedback;
}

const runtime: StudyTrackHelpRuntime = {
  renderHelpCenter,
  HELP_CATEGORIES,
  HELP_GLOSSARY,
  HELP_FAQ,
  renderHelpVisual,
  buildHelpSearchIndex,
  matchesHelpSearch,
  rankHelpSearch,
  normalizeHelpText,
  calculateEbbinghausRetention,
  getTopicFeedback,
  saveTopicFeedback,
  clearTopicFeedback,
};

(globalThis as Record<string, any>).StudyTrackHelp = runtime;

export {
  renderHelpCenter,
  HELP_CATEGORIES,
  HELP_GLOSSARY,
  HELP_FAQ,
  renderHelpVisual,
  buildHelpSearchIndex,
  matchesHelpSearch,
  rankHelpSearch,
  normalizeHelpText,
  calculateEbbinghausRetention,
  getTopicFeedback,
  saveTopicFeedback,
  clearTopicFeedback,
};
