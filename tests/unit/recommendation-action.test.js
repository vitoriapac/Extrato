import test from 'node:test';
import assert from 'node:assert/strict';
import {recommendationActionKind,recommendationActionLabel} from '../../src/application/recommendations/recommendation-action.js';
test('mapeia recomendação para ação especializada',()=>{assert.equal(recommendationActionKind({studyType:'questions'}),'questions');assert.equal(recommendationActionLabel({studyType:'review'}),'Iniciar revisão');assert.equal(recommendationActionKind({blockedPrerequisites:['t1'],studyType:'study'}),'prerequisite')});
