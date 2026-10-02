import test from 'node:test';
import assert from 'node:assert/strict';
import {renderDecisionCoherenceDebug} from '../../src/ui/renderers/decision-coherence-debug-renderer.js';

const escapeHtml=value=>String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');

test('diagnóstico interno resume divergências e escapa identificadores',()=>{
  const html=renderDecisionCoherenceDebug({status:'needs_review',summary:{risks:1,aligned:0,explained:0,unexplained:1},
    signals:[{subjectId:'math',topicId:'<topic>',trajectoryRisk:true,highExamImpact:true,planned:false,nextAction:false}],
    divergences:[{type:'trajectory_action_mismatch',riskTopicId:'<topic>',actionTopicId:'other',reasonCode:'unknown'}]}, {escapeHtml});
  assert.match(html,/data-decision-debug/);
  assert.match(html,/A investigar: 1/);
  assert.match(html,/&lt;topic&gt;/);
  assert.doesNotMatch(html,/<topic>/);
});
