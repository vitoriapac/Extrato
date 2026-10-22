import test from 'node:test';
import assert from 'node:assert/strict';
import {buildSessionResultViewModel} from '../../src/application/sessions/build-session-result-view-model.js';
import {renderSessionResult} from '../../src/ui/renderers/session-result-renderer.js';

const options={subjectName:()=>'Português',topicName:()=>'Crase',formatMinutes:value=>value+' min'};
const session={subjectId:'s',topicId:'t',type:'study',durationSeconds:2700,questionsResolved:0,correctAnswers:0};
const day={before:{studiedMinutes:35,progress:25,completedActivities:1},after:{studiedMinutes:80,progress:75,completedActivities:2},total:3};

test('lançamento mostra crédito e saldo do dia antes e depois',()=>{
  const model=buildSessionResultViewModel(session,null,false,{...options,day});
  assert.deepEqual(model.ledger,{credit:'+45 min',detail:null,studied:{before:'35 min',after:'80 min'},plan:{before:'25%',after:'75%'},completed:{done:2,total:3}});
  const html=renderSessionResult(model,{escapeHtml:String});
  assert.match(html,/aria-label="Lançamento no extrato de hoje"/);
  assert.match(html,/Estudado hoje<\/dt><dd>35 min → <strong class="session-ledger__after">80 min/);
  assert.match(html,/Plano de hoje<\/dt><dd>25% → <strong class="session-ledger__after">75%/);
  assert.match(html,/Atividade do plano concluída · 2 de 3/);
});

test('lançamento omite plano e conclusão quando não há dados do dia',()=>{
  const noPlan=buildSessionResultViewModel(session,null,false,{...options,day:{...day,after:{...day.after,progress:null,completedActivities:1}}});
  assert.equal(noPlan.ledger.plan,null);assert.equal(noPlan.ledger.completed,null);
  const html=renderSessionResult(noPlan,{escapeHtml:String});
  assert.doesNotMatch(html,/Plano de hoje/);assert.doesNotMatch(html,/concluída/);
  const past=buildSessionResultViewModel(session,null,false,options);
  assert.equal(past.ledger,null);assert.doesNotMatch(renderSessionResult(past,{escapeHtml:String}),/session-ledger/);
});

test('resultado aponta a próxima atividade do plano antes da sugestão do motor',()=>{
  const planNext={subjectId:'s',topicId:'t',subjectName:'Português',topicName:'Crase',remainingSeconds:1800};
  const other={subjectId:'x',topicId:'y',subjectName:'Inglês',topicName:'Leitura',estimatedMinutes:40};
  const html=renderSessionResult(buildSessionResultViewModel(session,other,false,{...options,planNext}),{escapeHtml:String});
  assert.match(html,/Próxima atividade do plano: <strong>Português — Crase · 30 min<\/strong>/);
  assert.match(html,/Sugestão fora do plano: Inglês — Leitura/);
  assert.doesNotMatch(html,/continua sendo|Nova prioridade/);
  const same=renderSessionResult(buildSessionResultViewModel(session,{...other,subjectId:'s',topicId:'t'},false,{...options,planNext}),{escapeHtml:String});
  assert.doesNotMatch(same,/Sugestão fora do plano/);
  const noPlan=renderSessionResult(buildSessionResultViewModel(session,other,true,options),{escapeHtml:String});
  assert.match(noPlan,/Nova prioridade: <strong>Inglês — Leitura · 40 min<\/strong>/);
});

test('sessão curta lança o que foi feito em vez de +0 min',()=>{
  const short={...session,durationSeconds:21,questionsResolved:10,correctAnswers:7};
  const flat={before:{studiedMinutes:35,progress:25,completedActivities:1},after:{studiedMinutes:35,progress:25,completedActivities:1},total:3};
  const model=buildSessionResultViewModel(short,null,false,{...options,day:flat});
  assert.equal(model.ledger.credit,'+10 questões');assert.equal(model.ledger.detail,'70% de acerto');
  assert.equal(model.ledger.studied,null);assert.equal(model.ledger.plan,null);
  const html=renderSessionResult(model,{escapeHtml:String});
  assert.ok(html.includes('<strong>+10 questões</strong>'));assert.match(html,/70% de acerto/);
  assert.doesNotMatch(html,/0 min → |<dl>/);
  const seconds=buildSessionResultViewModel({...session,durationSeconds:21},null,false,{...options,day:flat});
  assert.equal(seconds.ledger.credit,'+21 s');
  const one=buildSessionResultViewModel({...short,questionsResolved:1,correctAnswers:1},null,false,{...options,day:flat});
  assert.equal(one.ledger.credit,'+1 questão');
});

test('resumo de sessão curta mostra segundos em vez de 0 min',()=>{
  const html=renderSessionResult(buildSessionResultViewModel({...session,durationSeconds:21},null,false,options),{escapeHtml:String});
  assert.ok(html.includes('· 21 s'));assert.ok(!html.includes('· 0 min'));
});
