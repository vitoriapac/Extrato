import test from 'node:test';
import assert from 'node:assert/strict';
import {buildPeriodComparison} from '../../src/domain/analytics/period-comparison.js';
import {buildWeeklyClose} from '../../src/domain/analytics/weekly-close.js';
import {buildGapMap} from '../../src/domain/analytics/gap-map.js';
import {buildDecisionHistory} from '../../src/domain/recommendations/decision-history.js';

test('period comparison reports deltas and insufficient values',()=>{const result=buildPeriodComparison({current:{accuracy:72},previous:{accuracy:60,retention:50}});assert.equal(result.metrics.accuracy.delta,12);assert.equal(result.metrics.accuracy.direction,'up');assert.equal(result.metrics.retention.direction,'insufficient')});
test('weekly close avoids invented metrics without evidence',()=>{const result=buildWeeklyClose({period:{start:'2026-01-01',end:'2026-01-07'}});assert.equal(result.state,'insufficient');assert.equal(result.questions.accuracy,null);assert.equal(result.investment.adherence,null)});
test('weekly close aggregates execution and questions',()=>{const result=buildWeeklyClose({current:{plannedMinutes:120,executedMinutes:90},plans:[{status:'completed'},{status:'planned'}],questions:[{resolved:10,correct:7}]});assert.equal(result.investment.adherence,75);assert.equal(result.execution.rate,50);assert.equal(result.questions.accuracy,70)});
test('gap map prioritizes impact and missing mastery',()=>{const result=buildGapMap([{topicId:'a',mastery:40,examImpact:90,retention:70,coverage:20},{topicId:'b',mastery:80,examImpact:20,retention:20,coverage:90}]);assert.equal(result.items[0].topicId,'a');assert.equal(result.items[0].severity,'high')});
test('high retention reduces gap priority',()=>{const low=buildGapMap([{topicId:'a',mastery:60,examImpact:50,retention:20,coverage:50}]).items[0],high=buildGapMap([{topicId:'a',mastery:60,examImpact:50,retention:90,coverage:50}]).items[0];assert.ok(high.priority<low.priority);assert.equal(high.factors.retentionRisk,10)});
test('decision history copies immutable snapshot fields',()=>{const feedback=[{id:'r1',createdAt:'2026-01-02',snapshot:{priorityScore:80,reasons:['risco'],strategy:{label:'bloco'}},outcome:{state:'positive',delta:{mastery:4}}}];const result=buildDecisionHistory(feedback);feedback[0].snapshot.reasons.push('mutação');assert.deepEqual(result.items[0].reasons,['risco']);assert.equal(result.items[0].outcome.state,'positive')});
