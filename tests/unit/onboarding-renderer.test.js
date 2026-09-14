import test from 'node:test';
import assert from 'node:assert/strict';
import {renderOnboardingContent,renderOnboardingActions} from '../../src/features/onboarding/onboarding-renderer.js';

const base={steps:[{id:'goal'},{id:'availability'},{id:'content'},{id:'plan'}],presets:[{id:'bb',name:'Banco do Brasil'}],presetId:'bb',today:'2026-09-14',examDate:'',weekdays:[],subjects:[],availableMinutes:0,topicCount:0,estimatedNeedMinutes:0,weeksUntilExam:null,currentIndex:0,canAdvance:false};

test('renderer de entrada percorre objetivo, disponibilidade, conteúdo e prévia',()=>{
  assert.match(renderOnboardingContent({...base,current:{id:'goal'}}),/guidedExamDate/);
  assert.match(renderOnboardingContent({...base,current:{id:'availability'},weekdays:[{day:1,label:'Seg',hours:2}],availableMinutes:120}),/data-guided-day="1"/);
  assert.match(renderOnboardingContent({...base,current:{id:'content'},subjects:[{id:'s1',name:'Português',level:'Médio'}]}),/data-guided-level="s1"/);
  assert.match(renderOnboardingContent({...base,current:{id:'plan'},availableMinutes:300,topicCount:4,estimatedNeedMinutes:240,weeksUntilExam:8,canCreatePlan:true}),/4/);
  assert.match(renderOnboardingActions({...base,current:{id:'plan'},currentIndex:3,canCreatePlan:true}),/Confirmar e criar meu plano/);
});
