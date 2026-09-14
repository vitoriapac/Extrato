import test from 'node:test';import assert from 'node:assert/strict';
import {buildOnboardingViewModel} from '../../src/application/onboarding/build-onboarding-view-model.js';

test('onboarding aponta a próxima etapa sem substituir histórico real',()=>{const empty=buildOnboardingViewModel({subjects:[],hoursByDay:{0:0}});assert.equal(empty.next.id,'goal');assert.equal(empty.visible,true);const configured=buildOnboardingViewModel({examDate:'2026-12-01',hoursByDay:{1:2},subjects:[{topics:[{archived:false}]}]});assert.equal(configured.completed,3);assert.equal(configured.next.id,'plan');const legacy=buildOnboardingViewModel({sessions:[{id:'session'}]});assert.equal(legacy.visible,false)});
