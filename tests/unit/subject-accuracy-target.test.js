import test from 'node:test';
import assert from 'node:assert/strict';
import {resolveSubjectAccuracyTarget} from '../../src/domain/analytics/subject-accuracy-target.js';
import {buildSubjectAccuracy} from '../../src/application/analytics/build-subject-accuracy.js';
import {buildSavedSubjectConfig} from '../../src/application/exams/save-subject-config.js';
import {normalizeExamBlueprint} from '../../src/state/strategic.js';
test('meta opcional herda a geral e preserva zero e peso oficial',()=>{
 const current={subjectId:'s',expectedQuestions:10,questionWeight:1,priority:'normal',masteryTarget:80,official:true};
 const input={priority:'normal',masteryTarget:'80',expectedQuestions:'10',questionWeight:'1',accuracyTarget:'0'};
 const saved=buildSavedSubjectConfig('s',current,input);assert.equal(saved.official,true);assert.equal(saved.masteryTarget,80);
 const blueprint=normalizeExamBlueprint({subjects:[saved]});assert.equal(resolveSubjectAccuracyTarget('s',blueprint,85),0);assert.equal(resolveSubjectAccuracyTarget('missing',blueprint,85),85);
 assert.equal(buildSavedSubjectConfig('s',current,{...input,accuracyTarget:'101'}),null);
 assert.equal(buildSavedSubjectConfig('s',current,{...input,accuracyTarget:''}).accuracyTarget,null);
});
test('amostras pequenas permanecem insuficientes e streams não são duplicados',()=>{
 const rows=buildSubjectAccuracy({subjects:[{id:'s',name:'Disciplina'}],blueprint:{subjects:[{subjectId:'s',accuracyTarget:75}]},questions:[{subjectId:'s',resolved:8,correct:4}],simulations:[{breakdown:[{subjectId:'s',total:40,correct:32}]}]});
 assert.equal(rows[0].personal.state,'insufficient');assert.equal(rows[0].simulation.state,'on_target');assert.equal(rows[0].simulation.total,40);
});
