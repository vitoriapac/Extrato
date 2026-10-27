import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildStudyCycleQueue,
  getCurrentCycleBlock,
  advanceStudyCycleQueue,
  peekUpcomingCycleBlocks,
} from '../../src/domain/planning/study-cycle-engine.js';

test('buildStudyCycleQueue — cria blocos intercalados proporcionalmente ao peso das disciplinas', () => {
  const subjects = [
    { id: 's1', name: 'Direito Constitucional' },
    { id: 's2', name: 'Raciocínio Lógico' },
  ];
  // s1 tem peso 3, s2 tem peso 1
  const cycle = buildStudyCycleQueue({
    subjects,
    subjectWeights: { s1: 3, s2: 1 },
    blockDurationMinutes: 60,
  });

  // Total de 4 blocos: 3 de s1 e 1 de s2
  assert.equal(cycle.blocks.length, 4);
  assert.equal(cycle.totalDurationMinutes, 240); // 4 * 60

  const s1Blocks = cycle.blocks.filter(b => b.subjectId === 's1');
  const s2Blocks = cycle.blocks.filter(b => b.subjectId === 's2');
  assert.equal(s1Blocks.length, 3);
  assert.equal(s2Blocks.length, 1);

  // Primeiro bloco é de s1, segundo é de s2 (intercalados)
  assert.equal(cycle.blocks[0].subjectId, 's1');
  assert.equal(cycle.blocks[1].subjectId, 's2');
  assert.equal(cycle.blocks[2].subjectId, 's1');
  assert.equal(cycle.blocks[3].subjectId, 's1');
});

test('advanceStudyCycleQueue — avança o ponteiro e completa volta ao atingir o final da fila', () => {
  const subjects = [
    { id: 's1', name: 'Português' },
    { id: 's2', name: 'Matemática' },
  ];
  let cycle = buildStudyCycleQueue({ subjects, blockDurationMinutes: 45 });

  assert.equal(cycle.currentBlockIndex, 0);
  assert.equal(cycle.completedCyclesCount, 0);
  const current = getCurrentCycleBlock(cycle);
  assert.equal(current?.subjectId, 's1');

  // Avança para bloco 1
  const step1 = advanceStudyCycleQueue(cycle);
  cycle = step1.cycle;
  assert.equal(cycle.currentBlockIndex, 1);
  assert.equal(step1.completedLap, false);
  assert.equal(getCurrentCycleBlock(cycle)?.subjectId, 's2');

  // Avança novamente: atinge final e volta para bloco 0 (volta completada!)
  const step2 = advanceStudyCycleQueue(cycle);
  cycle = step2.cycle;
  assert.equal(cycle.currentBlockIndex, 0);
  assert.equal(step2.completedLap, true);
  assert.equal(cycle.completedCyclesCount, 1);
});

test('peekUpcomingCycleBlocks — visualiza os próximos blocos em ordem circular', () => {
  const subjects = [
    { id: 's1', name: 'A' },
    { id: 's2', name: 'B' },
    { id: 's3', name: 'C' },
  ];
  const cycle = buildStudyCycleQueue({ subjects });

  const upcoming = peekUpcomingCycleBlocks(cycle, 2);
  assert.equal(upcoming.length, 2);
  assert.equal(upcoming[0].subjectId, 's2');
  assert.equal(upcoming[1].subjectId, 's3');
});
