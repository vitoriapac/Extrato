import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CANDIDATE_PROFILE_LIST,
  normalizeCandidateProfile,
  resolveEffectiveExamPhase,
} from '../../src/domain/onboarding/candidate-profile.js';
import {
  suggestBancaRatios,
  normalizeEditableRatios,
} from '../../src/domain/planning/banca-strategy-policy.js';

test('candidate-profile — veterano pula Construção e inicia direto em Consolidação', () => {
  assert.equal(CANDIDATE_PROFILE_LIST.length, 3);
  assert.equal(normalizeCandidateProfile('desconhecido'), 'iniciante');
  assert.equal(resolveEffectiveExamPhase(120, 'iniciante').state, 'construction');
  assert.equal(resolveEffectiveExamPhase(120, 'intermediario').state, 'construction');
  const vet = resolveEffectiveExamPhase(120, 'veterano');
  assert.equal(vet.state, 'consolidation');
  assert.equal('overriddenFrom' in vet ? vet.overriddenFrom : null, 'construction');
  // Em fases finais, veterano não altera a fase da prova
  assert.equal(resolveEffectiveExamPhase(10, 'veterano').state, 'final_stretch');
});

test('banca-strategy-policy — sugere proporções por banca e preserva Reta Final', () => {
  const fcc = suggestBancaRatios({ banca: 'FCC', phaseState: 'construction', candidateProfile: 'iniciante' });
  assert.equal(fcc.banca, 'FCC');
  assert.ok(fcc.recommendedBlocks.includes('Bloco de Lei Seca'));
  assert.equal(fcc.editable, true);

  const cebraspe = suggestBancaRatios({ banca: 'cebraspe', phaseState: 'consolidation' });
  assert.equal(cebraspe.banca, 'Cebraspe');
  assert.ok(cebraspe.recommendedBlocks.includes('Treino de branco/chute'));

  // Na reta final, o piso de 85% prática/revisão prevalece sobre a sugestão de banca
  const finalStretch = suggestBancaRatios({ banca: 'FCC', phaseState: 'final_stretch' });
  assert.deepEqual(finalStretch.ratios, { theory: 0.15, questions: 0.5, reviews: 0.35 });

  assert.deepEqual(normalizeEditableRatios({ theory: 50, questions: 30, reviews: 20 }), {
    theory: 0.5,
    questions: 0.3,
    reviews: 0.2,
  });
});
