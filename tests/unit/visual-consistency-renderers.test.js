import test from 'node:test';
import assert from 'node:assert/strict';
import {renderHeroHeader,renderCompactHeader} from '../../src/ui/renderers/header-renderer.js';
import {renderWeeklyClose,renderPeriodComparison} from '../../src/ui/renderers/studytrack32-renderer.js';

function fakeDocument(ids){
  const nodes=Object.fromEntries(ids.map(id=>[id,{textContent:'',innerHTML:'',hidden:false}]));
  return {nodes,getElementById:id=>nodes[id]};
}

test('hero e compacto apresentam a mesma prontidão e conteúdo separado',()=>{
  const document=fakeDocument(['balanceFigure','balanceSub','statSubjects','statContent','statAndamento','statConcluido','statRevisoes','statStreak','compactReadiness','compactExamDate','compactPlanNumber']);
  const model={readiness:{value:45,confidence:'Alta',availableFactors:4,totalFactors:5},stats:{subjects:6,contentPercent:26,inProgress:17,completed:12,upcomingReviews:43},streak:{days:7},exam:{date:'2026-12-01'},plan:{number:'2026-001'}};
  renderHeroHeader(model,{document});renderCompactHeader(model,{document,formatDate:value=>value});
  assert.equal(document.nodes.balanceFigure.innerHTML,'45<span>/100</span>');
  assert.equal(document.nodes.compactReadiness.textContent,'45/100');
  assert.equal(document.nodes.statContent.textContent,'26%');
  assert.equal(document.nodes.statStreak.textContent,'7 dias');
  assert.match(document.nodes.balanceSub.textContent,/Confiança alta/);
});

test('cabeçalho compacto oculta integralmente prova ausente',()=>{
  const document=fakeDocument(['compactReadiness','compactExamDate','compactPlanNumber']);
  renderCompactHeader({readiness:{value:null},exam:{date:null},plan:{number:'1'}},{document,formatDate:value=>value});
  assert.equal(document.nodes.compactExamDate.hidden,true);
  assert.equal(document.nodes.compactExamDate.textContent,'');
});

test('fechamento semanal usa hierarquia semântica e comparação em quatro colunas',()=>{
  const weekly=renderWeeklyClose({state:'available',assessment:'attention',investment:{executedMinutes:652},questions:{accuracy:72,resolved:232},mainRisk:{message:'Déficit de execução'},bestSignal:{message:'Mais questões'},recommendedAction:'Replanejar'},{escapeHtml:String,formatMinutes:value=>value+' min'});
  assert.match(weekly,/weekly-kpis/);assert.match(weekly,/weekly-risk/);assert.match(weekly,/Próxima ação/);
  const comparison=renderPeriodComparison({comparison:{accuracy:{previous:60,current:72,delta:12}}},{escapeHtml:String,formatMinutes:String});
  assert.match(comparison,/Métrica/);assert.match(comparison,/Anterior/);assert.match(comparison,/Atual/);assert.match(comparison,/Variação/);
});

import {renderTopicRetentionDashboard} from '../../src/ui/renderers/retention-renderer.js';
import {calculateTopicRetention} from '../../src/domain/analytics/topic-metrics.js';
import {buildTopicSignals} from '../../src/domain/analytics/topic-signals.js';
test('retenção sem evidência não usa saúde da revisão como estimativa zero',()=>{
 const empty=calculateTopicRetention(),rows=Array.from({length:6},(_,i)=>({id:String(i),name:'Tópico',subjectName:'Disciplina',r:empty,h:{value:0,reasons:['Sem revisão']}}));
 const render=rows=>renderTopicRetentionDashboard({rows,subjects:[],filters:{confidence:'all',order:'asc'},showAll:true,renderFooter:()=>'',escapeHtml:String,escapeAttr:String});
 assert.doesNotMatch(render(rows),/retenção estimada em 0/);assert.match(render(rows),/Sem dados/);
 assert.equal(buildTopicSignals({retention:empty}).retentionRisk,null);
 const measured=calculateTopicRetention({resolved:50,correct:0});
 assert.equal(measured.available,true);assert.notEqual(measured.value,null);
 const html=render([{...rows[0],r:measured}]);assert.doesNotMatch(html,/retenção —/);
});

import {matchesSubjectSearch} from '../../src/ui/subjects/subject-navigation.js';
test('busca de disciplinas ignora acentos e cruza disciplina com tópico',()=>{
 const subject={name:'Matemática Financeira'},topic={name:'Juros compostos'};
 assert.equal(matchesSubjectSearch(subject,topic,'matematica juros'),true);assert.equal(matchesSubjectSearch(subject,topic,'portugues'),false);assert.equal(matchesSubjectSearch(subject,topic,''),true);
});

import {formatStudyMinutes,formatStudyMinuteDelta} from '../../src/ui/format-study-time.js';
import {renderCalendarIndicators} from '../../src/ui/renderers/calendar-renderer.js';
test('tempos humanos preservam ausência e arredondam somente na apresentação',()=>{
 assert.equal(formatStudyMinutes(2170.7),'36 h 11 min');assert.equal(formatStudyMinutes(null),'—');assert.equal(formatStudyMinutes(0),'0 min');assert.equal(formatStudyMinuteDelta(-90),'−1 h 30 min');
});
test('calendário explica origens do total de atrasos sem modificar registros',()=>{
 const items=[{date:'2026-10-01',origem:'Calendário'},{date:'2026-10-02',origem:'Agenda de Revisões'},{date:'2026-10-03',origem:'Agenda de Revisões',status:'Concluído'}],before=JSON.stringify(items);
 const html=renderCalendarIndicators({items,today:'2026-10-04',daysUntil:()=>null});assert.match(html,/Calendário: 1 · Agenda: 1/);assert.equal(JSON.stringify(items),before);
});

import {presentEvidence,EVIDENCE_STATES,formatEvidencePercent} from '../../src/ui/evidence-state.js';
test('estados de evidência distinguem zero medido, estimativa, ausência e insuficiência',()=>{
 assert.equal(presentEvidence({value:0,unit:'%'}).text,'0%');
 for(const value of [null,undefined,NaN,Infinity,'0'])assert.equal(presentEvidence({value}).text,'—');
 assert.equal(presentEvidence({state:EVIDENCE_STATES.ESTIMATED,value:0,confidence:'low'}).state,'estimated');
 for(const state of ['no_data','insufficient','not_applicable']){const result=presentEvidence({state,value:0});assert.equal(result.text,'—');assert.equal(result.state,state)}
 assert.equal(presentEvidence({state:'measured',value:null}).state,'no_data');
 assert.equal(formatEvidencePercent(0),'0%');assert.equal(formatEvidencePercent(null),'—');
 assert.throws(()=>presentEvidence({state:'unknown'}),TypeError);
});
test('retenção com disponibilidade inconsistente continua sem declarar zero',()=>{
 const rows=[{id:'t',name:'Tópico',subjectName:'Disciplina',r:{available:true,value:null,score:0},h:{value:0,reasons:[]}}];const before=JSON.stringify(rows);
 const html=renderTopicRetentionDashboard({rows,subjects:[],filters:{},showAll:true,renderFooter:()=>'',escapeHtml:String,escapeAttr:String});
 assert.match(html,/retenção —/);assert.match(html,/Sem dados/);assert.equal(JSON.stringify(rows),before);
});
