import test from 'node:test';
import assert from 'node:assert/strict';
import {buildProjectionTopicRisks} from '../../src/application/projection/build-projection-topic-risks.js';
import {buildAchievementProjection} from '../../src/application/projection/build-achievement-projection.js';
import {buildProjectionCloseContext} from '../../src/application/projection/build-projection-close-context.js';
import {buildNextBestAction} from '../../src/application/diagnostics/build-next-best-action.js';
import {renderProjectionCloseContext} from '../../src/ui/renderers/projection-close-context-renderer.js';
import {renderExamIntelligence} from '../../src/ui/renderers/exam-intelligence-renderer.js';

const escapeHtml=value=>String(value).replaceAll('&','&amp;').replaceAll('<','&lt;');
const candidate={subjectId:'s',topicId:'t',subjectName:'Matemática',topicName:'Juros',examImpact:85,mastery:42,evidenceStrength:.8};
const simulations=['2026-08-06','2026-08-13','2026-08-20','2026-08-27','2026-09-03','2026-09-10','2026-09-17','2026-09-24']
  .map((date,index)=>({id:`sim-${index}`,date,total:100,correct:62+index*3,breakdown:[{subjectId:'s',total:100}]}));
const base={today:'2026-10-01',examDate:'2026-12-15',targetScore:80,simulations,coverage:75,adherence:85};

test('lacunas usam apenas impacto, domínio e evidência medidos; preservam ordem recebida',()=>{
  const risks=buildProjectionTopicRisks([{...candidate,topicId:'a',mastery:null},candidate,
    {...candidate,topicId:'u',evidenceStrength:.1},{...candidate,topicId:'t'}]);
  assert.deepEqual(risks.map(item=>item.topicId),['t']);
});

test('projeção contextualiza ação existente sem trocar recomendação ou alterar escore',()=>{
  const risks=buildProjectionTopicRisks([candidate]);
  const projection=buildAchievementProjection({...base,topicRisks:risks,openHighImpactPriorities:risks.length});
  const recommendations=[{id:'first',subjectId:'s',topicId:'t',score:80,estimatedMinutes:30,reasons:['Retenção baixa']},
    {id:'second',subjectId:'s',topicId:'other',score:70,estimatedMinutes:30}];
  const before=structuredClone(recommendations);
  const result=buildNextBestAction({recommendations,projection});
  assert.equal(result.action.id,'first');
  assert.match(result.projectionReason,/evidência adicional/);
  assert.deepEqual(recommendations,before);
  assert.equal(projection.status,'attention');
  assert.equal(projection.recovery.steps.some(step=>step.includes('Juros')),true);
});

test('inteligência marca somente tópico da trajetória sem mexer nos pesos',()=>{
  const model={state:'available',completeExamCount:1,scopedExamCount:1,rows:[{topicId:'t',subjectName:'Matemática',name:'Juros',impact:85,presencePercent:80,presentExamCount:4,analyzedExamCount:5,questionCount:7,participationPercent:10,confidenceLabel:'Moderada'}]};
  const projection={status:'attention',topicRisks:[{topicId:'t'}]};
  const html=renderExamIntelligence(model,{projection});
  assert.match(html,/Lacuna pessoal de alto impacto/);
  assert.match(html,/Impacto 85\/100/);
  assert.doesNotMatch(renderExamIntelligence(model,{projection:{status:'insufficient_data',topicRisks:projection.topicRisks}}),/Lacuna pessoal/);
});

test('fechamento compara apenas snapshot anterior do mesmo escopo, meta e versão',()=>{
  const current=buildAchievementProjection(base),snapshot={kind:'achievement',date:'2026-09-20',issuedAt:'2026-09-20T12:00:00Z',
    activeExamTags:['bb'],algorithmVersion:current.algorithmVersion,status:'attention',
    current:{targetScore:80,simulationAccuracy:65},exam:{date:'2026-12-15'}};
  const comparable=buildProjectionCloseContext({current,snapshots:[snapshot],activeExamTags:['bb'],periodStart:'2026-09-25',today:'2026-10-01'});
  assert.equal(comparable.state,'comparable');
  assert.equal(comparable.previous,'attention');
  assert.match(renderProjectionCloseContext(comparable,{escapeHtml}),/sem atribuição|Não atribui/);
  assert.equal(buildProjectionCloseContext({current,snapshots:[snapshot],activeExamTags:['caixa'],periodStart:'2026-09-25',today:'2026-10-01'}).state,'baseline');
  assert.equal(buildProjectionCloseContext({current,snapshots:[{...snapshot,algorithmVersion:1}],activeExamTags:['bb'],periodStart:'2026-09-25',today:'2026-10-01'}).state,'baseline');
});

test('prazo curto muda leitura e orientação sem inventar previsão para o dia da prova',()=>{
  const scores=simulations.map(item=>({...item,correct:72}));
  const far=buildAchievementProjection({...base,simulations:scores});
  const near=buildAchievementProjection({...base,simulations:scores,examDate:'2026-10-11'});
  assert.equal(far.status,'attention');
  assert.equal(near.status,'at_risk');
  assert.equal(near.projection.examDayScore,null);
  assert.ok(near.risks.some(item=>item.includes('Prazo curto')));
  assert.ok(near.recovery.steps.every(step=>!step.includes('aprovação garantida')));
});
