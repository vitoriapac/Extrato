import test from 'node:test';
import assert from 'node:assert/strict';
import {formatTimerTitle} from '../../src/ui/controllers/pip-timer-controller.js';

const baseTitle='StudyTrack — Extrato de Estudos';

test('título da aba mostra o cronômetro enquanto há sessão',()=>{
  assert.equal(formatTimerTitle({started:true,running:true,time:'24:15',subjectName:'Português',baseTitle}),'▶ 24:15 · Português — StudyTrack');
  assert.equal(formatTimerTitle({started:true,running:false,time:'24:15',subjectName:'Português',baseTitle}),'⏸ 24:15 · Português — StudyTrack');
  assert.equal(formatTimerTitle({started:true,running:true,time:'01:02:03',baseTitle}),'▶ 01:02:03 — StudyTrack');
});

test('sem sessão o título volta ao original',()=>{
  assert.equal(formatTimerTitle({started:false,running:false,time:'00:00',subjectName:'Português',baseTitle}),baseTitle);
});
