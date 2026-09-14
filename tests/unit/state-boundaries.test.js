import test from 'node:test';
import assert from 'node:assert/strict';
import {createUiState,pickPersistentState} from '../../src/state/state-boundaries.js';

test('estado de interface nasce separado dos dados persistentes',()=>{
  const ui=createUiState();
  assert.equal(ui.onboarding.open,false);
  assert.equal(ui.openModal,null);
  assert.deepEqual(ui.previews,{});
});

test('persistência ignora filtros, modais e prévias transitórias',()=>{
  const persisted=pickPersistentState({schemaVersion:19,subjects:[],metas:{semanal:5},activeTab:'metas',openModal:'import',previews:{plan:{}}});
  assert.deepEqual(persisted,{schemaVersion:19,subjects:[],metas:{semanal:5}});
});
