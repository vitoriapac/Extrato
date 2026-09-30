import {renderPerformanceOverview} from './performance-overview-renderer.js';
import {renderPerformanceQuestions} from './performance-questions-renderer.js';
import {renderPerformanceSimulations} from './performance-simulations-renderer.js';
import {renderPerformanceSubjects} from './performance-subjects-renderer.js';
import {renderPerformanceConsistency} from './performance-consistency-renderer.js';

export function renderPerformanceSection(pageModel,{range,today,activeExamTags,formatDate,escapeHtml,escapeAttr,targetScore}={}){
  switch(pageModel.section){
    case 'overview':return renderPerformanceOverview(pageModel.model,{range,today,activeExamTags,formatDate,escapeHtml,comparisonModel:pageModel.comparisonModel,readinessChange:pageModel.readinessChange});
    case 'questions':return renderPerformanceQuestions({...pageModel,range,formatDate,escapeHtml});
    case 'simulations':return renderPerformanceSimulations(pageModel.model,{range,targetScore,formatDate,escapeHtml});
    case 'subjects':return renderPerformanceSubjects(pageModel.model,{range,formatDate,escapeHtml,escapeAttr,topicDetail:pageModel.detail,comparison:pageModel.comparison});
    case 'consistency':return renderPerformanceConsistency(pageModel.model,{range,formatDate,escapeHtml});
    default:return '';
  }
}
