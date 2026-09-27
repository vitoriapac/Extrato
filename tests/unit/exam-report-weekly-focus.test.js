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
  const recommendations=[{date:'2026-09-25',topicId:'gap-a',outcome:{state:'positive',measuredAt:'2026-09-25T12:00:00Z'}},{date:'2026-09-25',topicId:'gap-b',outcome:{state:'neutral',measuredAt:'2026-09-25T12:00:00Z'}}];
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
  const undated=buildWeeklyStrategicFocus({sessions,candidates,recommendations:[{date:'2026-09-25',topicId:'gap-a',outcome:{state:'positive'}}],start:'2026-09-19',end:'2026-09-25'});
  assert.equal(undated.improved,0);
  assert.equal(undated.unmeasured,2);
  assert.equal(buildWeeklyStrategicFocus({sessions:[],candidates,start:'2026-09-19',end:'2026-09-25'}).state,'insufficient');
  assert.match(renderWeeklyStrategicFocus({state:'insufficient'}),/Registre sessões/);
});

test('foco semanal descreve zero, uma e várias lacunas sem impor meta de percentual',()=>{
  const base={state:'available',highImpactPercent:0,highImpactMinutes:0,totalMinutes:120,unknownMinutes:0,improved:0,stable:0,declined:0,unmeasured:0};
  const empty=renderWeeklyStrategicFocus({...base,workedGaps:0});
  assert.match(empty,/0%/);assert.match(empty,/Nenhuma lacuna/);assert.match(empty,/sem meta mínima/);
  const one=renderWeeklyStrategicFocus({...base,highImpactPercent:50,highImpactMinutes:60,workedGaps:1,unmeasured:1});
  assert.match(one,/1 lacuna prioritária trabalhada/);assert.match(one,/1h 00min/);assert.match(one,/1 ainda sem medida posterior/);
  const many=renderWeeklyStrategicFocus({...base,highImpactPercent:75,highImpactMinutes:90,workedGaps:4,improved:2,stable:1,declined:1});
  assert.match(many,/4 lacunas prioritárias trabalhadas/);assert.match(many,/2 melhoraram/);assert.match(many,/1 pioraram/);
});

test('PDF usa o mesmo cálculo de foco semanal e limita a semana ao período escolhido',()=>{
  const state={subjects:[{id:'s',name:'Matemática',topics:[{id:'t',name:'Juros',status:'Em andamento'}]}],studySessions:[
    {date:'2026-09-10',subjectId:'s',topicId:'t',durationSeconds:3600},
    {date:'2026-09-25',subjectId:'s',topicId:'t',durationSeconds:5400}
  ],questoes:[],simulados:[],reviewAgenda:[],dailyPlans:[{date:'2026-09-25',items:[{plannedMinutes:120}]}],recommendationFeedback:[{date:'2026-09-25',topicId:'t',outcome:{state:'positive',measuredAt:'2026-09-25T12:00:00Z'}}]};
  const candidates=[{topicId:'t',examImpact:85,mastery:40}];
  const report=buildStrategicReport({state,generatedAt:'2026-09-25T12:00:00Z',period:{preset:'30'},candidates});
  const focus=report.weeklyFocus;
  assert.deepEqual(focus.period,{start:'2026-09-19',end:'2026-09-25'});
  assert.equal(focus.plannedMinutes,120);
  assert.equal(focus.executedMinutes,90);
  assert.equal(focus.executionRate,75);
  assert.equal(focus.focus.highImpactPercent,100);
  assert.equal(focus.focus.workedGaps,1);
  assert.equal(focus.focus.improved,1);
  const html=renderStrategicReport(report);
  assert.match(html,/Foco estratégico da semana/);
  assert.match(html,/100%<\/strong><span>Tempo em tópicos de alto impacto/);
  assert.match(html,/sem meta mínima/);
  assert.doesNotMatch(html,/matriz histórica completa/i);
});

test('PDF não inventa foco ou melhora quando a semana não tem sessões',()=>{
  const report=buildStrategicReport({state:{subjects:[],studySessions:[],questoes:[],simulados:[],reviewAgenda:[],dailyPlans:[],recommendationFeedback:[]},generatedAt:'2026-09-25T12:00:00Z'});
  assert.equal(report.weeklyFocus.focus.state,'insufficient');
  assert.match(renderStrategicReport(report),/Sem sessões atribuíveis ao concurso/);
});
