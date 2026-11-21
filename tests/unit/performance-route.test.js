import test from 'node:test';
import assert from 'node:assert/strict';
import { routeOfSection, sectionFromRoute } from '../../src/ui/performance/performance-route.js';
import { PERFORMANCE_GROUPS } from '../../src/ui/performance/PerformancePageNav.js';

test('endereço público de Análise de resultados é em português e os antigos continuam valendo', () => {
  assert.deepEqual(['questions', 'simulations', 'exam'].map(routeOfSection), ['resultados', 'simulados', 'inteligencia']);
  assert.deepEqual(['resultados', 'simulados', 'inteligencia'].map(sectionFromRoute), ['questions', 'simulations', 'exam']);
  // Antigos: a chave interna, "exams" (que caía na Visão geral) e "provas".
  assert.deepEqual(['questions', 'simulations', 'exam', 'exams', 'provas'].map(sectionFromRoute), ['questions', 'simulations', 'exam', 'exam', 'questions']);
  // As demais subabas não mudam, e uma rota desconhecida passa como está (o controller a ignora).
  assert.equal(routeOfSection('diagnosis'), 'diagnosis');
  assert.equal(sectionFromRoute('overview'), 'overview');
  assert.equal(sectionFromRoute('qualquer'), 'qualquer');
});

test('as subabas de Desempenho não repetem os nomes das abas de topo', () => {
  assert.deepEqual(
    PERFORMANCE_GROUPS.map(group => group.label),
    ['Resumo', 'Por disciplina', 'Diagnóstico', 'Análise de resultados', 'Ritmo e aderência']
  );
});
