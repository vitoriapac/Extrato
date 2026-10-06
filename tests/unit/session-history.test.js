import test from 'node:test';
import assert from 'node:assert/strict';
import {filterStudySessions,groupStudySessionsByDate} from '../../src/ui/session-history.js';
import {buildSessionHistoryPresentation} from '../../src/ui/renderers/study-sessions-renderer.js';

const addDays=(iso,delta)=>{const date=new Date(`${iso}T12:00:00`);date.setDate(date.getDate()+delta);return date.toISOString().slice(0,10)};
const sessions=[{id:'1',date:'2026-08-31',subjectId:'a',type:'study'},{id:'2',date:'2026-08-30',subjectId:'b',type:'review'},{id:'3',date:'2026-07-01',subjectId:'a',type:'study'}];

test('filtra sessões por período, disciplina e tipo',()=>{
  const result=filterStudySessions(sessions,{period:'7',subjectId:'a',type:'study',date:''},{today:'2026-08-31',addDays,subjectIdOf:item=>item.subjectId});
  assert.deepEqual(result.map(item=>item.id),['1']);
});

test('agrupa sessões por data preservando a ordem',()=>{
  assert.deepEqual(groupStudySessionsByDate(sessions).map(([date,items])=>[date,items.length]),[['2026-08-31',1],['2026-08-30',1],['2026-07-01',1]]);
});

test('contagem de sessões distingue total, filtro e ausência de histórico',()=>{
 assert.equal(buildSessionHistoryPresentation({total:1,filtered:1}).count,'1 sessão');
 assert.equal(buildSessionHistoryPresentation({total:1,filtered:1}).summary,'');
 const filtered=buildSessionHistoryPresentation({total:24,filtered:3,dateLabel:'06/10/2026'});
 assert.equal(filtered.count,'24 sessões');assert.equal(filtered.summary,'Dia selecionado: 06/10/2026 · 3 de 24 sessões no filtro atual');
 assert.equal(buildSessionHistoryPresentation({total:0,filtered:0}).emptyTitle,'Seu histórico de estudos começa aqui');
 assert.equal(buildSessionHistoryPresentation({total:3,filtered:0}).emptyTitle,'Nenhuma sessão neste filtro');
});
