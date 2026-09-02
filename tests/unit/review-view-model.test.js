import test from 'node:test';import assert from 'node:assert/strict';
import {createReviewViewModel} from '../../src/ui/view-models/review-view-model.js';

test('view-model de revisão apenas prepara dados visuais',()=>{
  const review={id:'r1',date:'2026-09-02',tipo:'Revisão 7 dias',status:'Não iniciado',manualDate:true};
  const vm=createReviewViewModel(review,{subjectName:'Direito',topicName:'Atos',difficulty:'Difícil',formatDate:()=> '02/09/2026'});
  assert.deepEqual({...vm},{id:'r1',date:'02/09/2026',subject:'Direito',topic:'Atos',type:'Revisão 7 dias',difficulty:'Difícil',status:'Não iniciado',pending:true,manualDate:true,lastRating:null});
  assert.equal(review.status,'Não iniciado');
});
