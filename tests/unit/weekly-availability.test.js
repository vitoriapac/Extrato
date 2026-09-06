import test from 'node:test';import assert from 'node:assert/strict';
import {buildWeeklyAvailability} from '../../src/application/goals/weekly-availability.js';

test('resume disponibilidade semanal e ignora valores inválidos',()=>{
  const result=buildWeeklyAvailability({0:0,1:2,2:1,3:2.5,4:1.5,5:1,6:4});
  assert.equal(result.totalHours,12);assert.equal(result.totalMinutes,720);assert.equal(result.activeDays,6);assert.equal(result.averageHours,2);assert.equal(result.peakHours,4);
});

test('limita cada dia a vinte e quatro horas e representa agenda vazia',()=>{
  assert.equal(buildWeeklyAvailability({1:30}).totalHours,24);
  assert.equal(buildWeeklyAvailability({}).state,'empty');
});

