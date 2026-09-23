import test from 'node:test';import assert from 'node:assert/strict';
import {ALERT_TYPES,buildIntelligentAlerts,createDiagnosticAlert} from '../../src/domain/diagnostics/alerts.js';

test('cria alerta com contrato estruturado e id determinístico',()=>{
  const alert=createDiagnosticAlert({type:'performance_decline',subjectId:'s1',reason:'Queda medida.',recommendedAction:'Revisar.',createdAt:'2026-09-07'});
  assert.equal(alert.id,'performance_decline:s1');assert.equal(alert.resolvedAt,null);assert.ok(ALERT_TYPES.includes(alert.type));
});

test('gera alertas acionáveis para déficit, tendência, revisão e tópico crítico',()=>{
  const alerts=buildIntelligentAlerts({today:'2026-09-07',overdueReviews:2,weeklyBalanceMinutes:-180,subjects:[{subjectId:'s1',name:'Direito',trend:{direction:'down',state:'strong_down',delta:-12},daysSinceStudy:16}],topics:[{topicId:'t1',subjectId:'s1',name:'Constitucional',mastery:40,examImpact:90,evidenceStrength:.2}]});
  assert.deepEqual(new Set(alerts.map(item=>item.type)),new Set(['review_critical','weekly_deficit','performance_decline','subject_neglected','low_mastery_high_exam_impact','insufficient_evidence']));
  assert.ok(alerts.every(item=>item.reason&&item.recommendedAction));
});

test('não interpreta domínio ausente como zero e usa erros apenas com diagnóstico suficiente',()=>{
  const base={topicId:'t1',subjectId:'s1',name:'Probabilidade',mastery:null,examImpact:90,evidenceStrength:.1};
  const without=buildIntelligentAlerts({topics:[base]});
  assert.ok(!without.some(item=>item.type==='low_mastery_high_exam_impact'));
  assert.ok(!without.some(item=>item.type==='error_pattern'));
  const withPattern=buildIntelligentAlerts({topics:[{...base,dominantError:{key:'calculo',label:'cálculo',share:55,recommendation:{action:'Treinar cálculos guiados'}}}]});
  const alert=withPattern.find(item=>item.type==='error_pattern');
  assert.equal(alert.recommendedAction,'Treinar cálculos guiados');
  assert.equal(alert.topicId,'t1');
});
