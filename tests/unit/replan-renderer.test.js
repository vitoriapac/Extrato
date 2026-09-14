import test from 'node:test';
import assert from 'node:assert/strict';
import {renderReplanProposal} from '../../src/features/replan/replan-renderer.js';

test('prévia de recuperação mostra conteúdo, motivo, destino e capacidade',()=>{const html=renderReplanProposal({plannedMinutes:120,executedMinutes:30,deficitMinutes:90,redistributedMinutes:60,discardedMinutes:30,allocations:[{subjectId:'s1',topicId:'t1',minutes:60,date:'2026-09-16',reason:'revisão próxima do vencimento'}],retainedItems:[{subjectId:'s1',topicId:'t2',unallocatedMinutes:30,reason:'alta prioridade'}],capacityByDay:[{date:'2026-09-16',availableMinutes:90,allocatedMinutes:60,remainingMinutes:30}]},{subjectName:()=> 'Português',topicName:id=>id==='t1'?'Interpretação':'Gramática'});assert.match(html,/Português — Interpretação/);assert.match(html,/revisão próxima do vencimento/);assert.match(html,/2026-09-16/);assert.match(html,/30 min livres/);assert.match(html,/Gramática/)});
