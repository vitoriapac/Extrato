import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveExperienceDensity } from '../../src/domain/analytics/experience-density.js';
import {
  normalizeExamCutoff,
  buildCutoffReference,
} from '../../src/domain/analytics/cutoff-reference.js';
import { calculateMultibancaEssayScore } from '../../src/domain/exams/essay-scoring.js';

test('resolveExperienceDensity — alterna entre Modo Essencial e Modo Analítico', () => {
  const beginner = resolveExperienceDensity({ questionCount: 10, daysSinceStart: 3 });
  assert.equal(beginner.mode, 'essential');
  assert.equal(beginner.showAdvancedOverviewGrids, false);

  const mature = resolveExperienceDensity({ questionCount: 80, daysSinceStart: 20 });
  assert.equal(mature.mode, 'full');
  assert.equal(mature.showAdvancedOverviewGrids, true);

  const forcedEssential = resolveExperienceDensity({ mode: 'essential', questionCount: 500, daysSinceStart: 100 });
  assert.equal(forcedEssential.isEssential, true);
  assert.equal(forcedEssential.label, 'Modo Essencial');
});

test('cutoff-reference — suporta modalidade (ampla/cotas/pcd) e praça/localidade', () => {
  const normalized = normalizeExamCutoff({
    score: 76,
    maxScore: 100,
    year: 2024,
    modality: 'cotas',
    region: 'Sudeste',
  });
  assert.equal(normalized?.modality, 'cotas');
  assert.equal(normalized?.region, 'Sudeste');

  const ref = buildCutoffReference({ informed: normalized });
  assert.equal(ref.kind, 'informed');
  assert.equal(ref.modality, 'cotas');
  assert.match(ref.text, /Cotas raciais/);
  assert.match(ref.text, /Sudeste/);
});

test('calculateMultibancaEssayScore — calcula Cebraspe, FCC, FGV e Cesgranrio', () => {
  const cebraspe = calculateMultibancaEssayScore({
    banca: 'Cebraspe',
    maxScore: 20,
    contentScore: 18,
    linesWritten: 25,
    grammarErrors: 5,
  });
  assert.equal(cebraspe.banca, 'Cebraspe');
  assert.equal(cebraspe.netScore, 17.6);

  const fcc = calculateMultibancaEssayScore({
    banca: 'FCC',
    maxScore: 100,
    criteriaScores: { conteudo: 80, estrutura: 70, expressao: 90 },
  });
  assert.equal(fcc.banca, 'FCC');
  assert.equal(fcc.netScore, 79);

  const fgv = calculateMultibancaEssayScore({
    banca: 'FGV',
    maxScore: 30,
    criteriaScores: { tema: 12, estrutura: 8, norma: 6 },
  });
  assert.equal(fgv.banca, 'FGV');
  assert.equal(fgv.netScore, 26);

  const cesgranrio = calculateMultibancaEssayScore({
    banca: 'Cesgranrio',
    maxScore: 100,
    criteriaScores: { tema: 20, argumentacao: 22, coesao: 18, norma: 20 },
  });
  assert.equal(cesgranrio.banca, 'Cesgranrio');
  assert.equal(cesgranrio.netScore, 80);
});
