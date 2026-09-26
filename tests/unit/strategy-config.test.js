import test from 'node:test';
import assert from 'node:assert/strict';
import {STRATEGY_THRESHOLDS,isHighImpact,isStrategicGap,hasAdequateMastery} from '../../src/domain/strategy/config.js';
import {EXAM_INTELLIGENCE_CONFIG} from '../../src/domain/exam-intelligence/config.js';
import {buildStrategicAchievements} from '../../src/application/achievements/build-strategic-achievements.js';
import {buildWeeklyStrategicFocus} from '../../src/application/analytics/build-weekly-strategic-focus.js';

test('limites estratégicos preservam as fronteiras calibradas',()=>{
  assert.deepEqual(STRATEGY_THRESHOLDS,{highImpact:70,adequateMastery:70,sufficientEvidence:.5,historicalMinimumExamCount:4});
  assert.equal(EXAM_INTELLIGENCE_CONFIG.minimumHistoricalExams,STRATEGY_THRESHOLDS.historicalMinimumExamCount);
  assert.equal(isHighImpact(69.99),false);
  assert.equal(isHighImpact(70),true);
  assert.equal(isHighImpact(null),false);
  assert.equal(isStrategicGap({examImpact:70,mastery:69.99}),true);
  assert.equal(isStrategicGap({examImpact:70,mastery:70}),false);
  assert.equal(hasAdequateMastery({mastery:70,evidenceStrength:.5}),true);
  assert.equal(hasAdequateMastery({mastery:70,evidenceStrength:.49}),false);
});

test('foco e conquistas classificam o limite de alto impacto da mesma forma',()=>{
  const candidates=[{topicId:'boundary',subjectId:'s',examImpact:70,mastery:69,evidenceStrength:.5},{topicId:'below',subjectId:'s',examImpact:69.99,mastery:69,evidenceStrength:.5}];
  const sessions=[{date:'2026-09-25',topicId:'boundary',durationSeconds:1800},{date:'2026-09-25',topicId:'below',durationSeconds:1800}];
  const focus=buildWeeklyStrategicFocus({sessions,candidates,start:'2026-09-19',end:'2026-09-25'});
  assert.equal(focus.highImpactPercent,50);
  assert.equal(focus.workedGaps,1);
  assert.equal(buildStrategicAchievements({candidates,sessions}).strategist.progress.current,1);
});
