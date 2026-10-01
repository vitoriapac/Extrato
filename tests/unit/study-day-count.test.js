import test from 'node:test';
import assert from 'node:assert/strict';
import {countStudyDaysInRange,countStudyDaysThisWeek} from '../../src/application/performance/study-day-count.js';

const session=(date,durationSeconds=1800)=>({date,durationSeconds});

test('conta dias locais distintos com estudo válido na semana atual',()=>{
  const sessions=[session('2026-09-27'),session('2026-09-28'),session('2026-09-28',900),session('2026-09-29'),session('2026-09-30',0),session('2026-10-01'),session('2026-10-02')];
  assert.equal(countStudyDaysThisWeek(sessions,'2026-09-30'),2);
  assert.equal(countStudyDaysThisWeek(sessions,'2026-10-02'),4);
  assert.equal(countStudyDaysThisWeek(sessions,'2026-10-05'),0);
});

test('ignora sessão sem duração e datas inválidas sem deslocar o calendário',()=>{
  const sessions=[session('2026-09-28',3600),session('2026-09-28',1200),session('2026-09-29',-1),session('2026-09-31'),session('2026-09-30T00:00:00Z')];
  assert.equal(countStudyDaysInRange(sessions,{start:'2026-09-28',end:'2026-09-30'}),1);
  assert.equal(countStudyDaysThisWeek([], '2026-09-30'),0);
  assert.equal(countStudyDaysThisWeek(sessions,'data inválida'),0);
});
