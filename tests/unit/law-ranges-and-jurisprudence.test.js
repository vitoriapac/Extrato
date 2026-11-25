import test from 'node:test';
import assert from 'node:assert/strict';
import {
  lawEffectiveRange,
  lawLapProgress,
  registerLawReading,
} from '../../src/domain/law-notebook.js';
import {
  registerJurisprudenceReading,
  jurisprudenceStatus,
  sortJurisprudenceForReview,
} from '../../src/domain/jurisprudence-notebook.js';
import { buildQuickStudyProposal } from '../../src/domain/quick-study/quick-study-engine.js';

test('law-notebook respeita recorte de artigos do edital (startArticle..endArticle) no progresso e fechamento de volta', () => {
  const cfClipped = {
    id: 'law1',
    name: 'CF/88 — Administração Pública',
    subjectId: 'adm',
    totalArticles: 250,
    startArticle: 37,
    endArticle: 41,
    hotArticles: 'Art. 37 §6º, Art. 41',
    currentArticle: 0,
    laps: 0,
    lastReadAt: null,
    lapCompletedAt: null,
    createdAt: '2026-10-01T10:00:00Z',
  };

  assert.deepEqual(lawEffectiveRange(cfClipped), { start: 37, end: 41, span: 5, isRange: true });
  const mid = registerLawReading(cfClipped, 39, '2026-10-10');
  assert.equal(mid.laps, 0);
  assert.equal(lawLapProgress(mid).done, 3);
  assert.equal(lawLapProgress(mid).total, 5);

  const doneLap = registerLawReading(mid, 41, '2026-10-11');
  assert.equal(doneLap.laps, 1);
  assert.equal(doneLap.currentArticle, 0);
  assert.equal(doneLap.lapCompletedAt, '2026-10-11');
});

test('jurisprudence-notebook espaça revisões em 7/21/45 dias e prioriza vencidos', () => {
  /** @type {import('../../src/core/types.ts').JurisprudenceRecord} */
  const base = {
    id: 'j1',
    kind: 'informativo_stf',
    code: 'Info 1152 STF',
    title: 'Responsabilidade civil do Estado',
    thesisSummary: 'Resumo da tese',
    subjectId: 'adm',
    topicId: null,
    laps: 0,
    lastReadAt: null,
    nextReviewDate: null,
    createdAt: '2026-10-01',
  };
  assert.equal(jurisprudenceStatus(base, '2026-10-01').key, 'new');

  const r1 = registerJurisprudenceReading(base, '2026-10-01');
  assert.equal(r1.laps, 1);
  assert.equal(r1.nextReviewDate, '2026-10-08');
  assert.equal(jurisprudenceStatus(r1, '2026-10-07').key, 'resting');
  assert.equal(jurisprudenceStatus(r1, '2026-10-08').key, 'due');

  const r2 = registerJurisprudenceReading(r1, '2026-10-08');
  assert.equal(r2.nextReviewDate, '2026-10-29'); // +21d

  const r3 = registerJurisprudenceReading(r2, '2026-10-29');
  assert.equal(r3.nextReviewDate, '2026-12-13'); // +45d

  const ordered = sortJurisprudenceForReview(
    [
      r3, // resting até dezembro
      { ...base, id: 'j2', code: 'SV 13' }, // pendente agora
    ],
    '2026-10-30'
  );
  assert.equal(ordered[0].id, 'j2');
});

test('quick-study-engine modo law seleciona informativo/lei vencida sem alterar studyPlans', () => {
  const proposal = buildQuickStudyProposal({
    durationMinutes: 20,
    focusMode: 'law',
    subjects: [{ id: 'adm', name: 'Direito Administrativo' }],
    laws: [
      {
        id: 'law1',
        name: 'Lei 8.112/1990',
        subjectId: 'adm',
        totalArticles: 253,
        currentArticle: 0,
        laps: 0,
        lastReadAt: null,
        lapCompletedAt: null,
        createdAt: '2026-10-01',
      },
    ],
    jurisprudence: [
      {
        id: 'j1',
        kind: 'sumula_stj',
        code: 'Súmula 473 STF',
        title: 'Anulação de atos administrativos',
        thesisSummary: 'Autotutela',
        subjectId: 'adm',
        topicId: null,
        laps: 0,
        lastReadAt: null,
        nextReviewDate: null,
        createdAt: '2026-10-01',
      },
    ],
    today: '2026-10-20',
  });
  assert.equal(proposal.kind, 'law_reading');
  assert.equal(proposal.focusMode, 'law');
  assert.equal(proposal.mutatedState, false);
  assert.match(proposal.topicName, /Súmula 473|Lei 8\.112/);
});
