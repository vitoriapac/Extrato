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
