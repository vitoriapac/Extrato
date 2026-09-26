import test from 'node:test';
import assert from 'node:assert/strict';
import {buildExamIntelligenceStressFixture} from '../fixtures/exam-intelligence-stress.js';
import {buildStrategicReport} from '../../src/reports/report-data.js';
import {renderStrategicReport} from '../../src/reports/report-template.js';
import {buildWeeklyStrategicFocus} from '../../src/application/analytics/build-weekly-strategic-focus.js';
import {renderWeeklyStrategicFocus} from '../../src/ui/renderers/studytrack32-renderer.js';

test('PDF resume base histórica e somente três lacunas estratégicas do concurso ativo',()=>{
  const {state,topics}=buildExamIntelligenceStressFixture(),candidates=topics.map((topic,index)=>({topicId:topic.id,subjectName:topic.subjectName,topicName:topic.name,examImpact:[81,78,72,90,65,80][index],mastery:[91,42,49,35,50,61][index]}));
  const report=buildStrategicReport({state,generatedAt:'2026-09-25T12:00:00Z',diagnosis:{bottlenecks:[],opportunities:[]},candidates});
  assert.equal(report.examIntelligence.examCount,6);
  assert.equal(report.examIntelligence.completeExamCount,5);
  assert.equal(report.examIntelligence.gaps.length,3);
  assert.ok(report.examIntelligence.gaps.every(item=>item.impact>=70&&item.mastery<70));
  const html=renderStrategicReport(report);
  assert.match(html,/Inteligência da prova/);
  assert.match(html,/Principais lacunas estratégicas/);
  assert.match(html,/Provas completas analisadas/);
  assert.match(html,/Cobertura conhecida/);
  assert.doesNotMatch(html,/stress-bb-2018/);
});

test('fechamento usa tempo atribuível e resultados posteriores sem inventar melhora',()=>{
  const sessions=[{date:'2026-09-25',topicId:'gap-a',durationSeconds:1800},{date:'2026-09-25',topicId:'gap-b',durationSeconds:1200},{date:'2026-09-25',topicId:'low',durationSeconds:600},{date:'2026-09-25',durationSeconds:600}];
  const candidates=[{topicId:'gap-a',examImpact:85,mastery:42},{topicId:'gap-b',examImpact:78,mastery:61},{topicId:'low',examImpact:30,mastery:40}];
  const recommendations=[{date:'2026-09-25',topicId:'gap-a',outcome:{state:'positive'}},{date:'2026-09-25',topicId:'gap-b',outcome:{state:'neutral'}}];
  const model=buildWeeklyStrategicFocus({sessions,candidates,recommendations,start:'2026-09-19',end:'2026-09-25'});
  assert.equal(model.highImpactPercent,71);
  assert.equal(model.workedGaps,2);
  assert.deepEqual([model.improved,model.stable,model.unmeasured],[1,1,0]);
  assert.equal(model.unknownMinutes,10);
  assert.match(renderWeeklyStrategicFocus(model),/Foco estratégico da semana/);
  assert.match(renderWeeklyStrategicFocus(model),/71%/);
  const withoutOutcome=buildWeeklyStrategicFocus({sessions,candidates,recommendations:[],start:'2026-09-19',end:'2026-09-25'});
  assert.equal(withoutOutcome.unmeasured,2);
  assert.equal(withoutOutcome.improved,0);
  assert.equal(buildWeeklyStrategicFocus({sessions:[],candidates,start:'2026-09-19',end:'2026-09-25'}).state,'insufficient');
  assert.equal(renderWeeklyStrategicFocus({state:'insufficient'}),'');
});
