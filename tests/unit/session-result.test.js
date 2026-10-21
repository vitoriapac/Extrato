import test from 'node:test';
import assert from 'node:assert/strict';
import {buildSessionResultViewModel} from '../../src/application/sessions/build-session-result-view-model.js';
import {renderSessionResult} from '../../src/ui/renderers/session-result-renderer.js';

const options={subjectName:()=>'Português',topicName:()=>'Crase',formatMinutes:value=>value+' min'};
const session={subjectId:'s',topicId:'t',type:'study',durationSeconds:2700,questionsResolved:0,correctAnswers:0};
const day={before:{studiedMinutes:35,progress:25,completedActivities:1},after:{studiedMinutes:80,progress:75,completedActivities:2},total:3};

test('lançamento mostra crédito e saldo do dia antes e depois',()=>{
  const model=buildSessionResultViewModel(session,null,false,{...options,day});
  assert.deepEqual(model.ledger,{credit:'+45 min',studied:{before:'35 min',after:'80 min'},plan:{before:'25%',after:'75%'},completed:{done:2,total:3}});
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
