import test from 'node:test';
import assert from 'node:assert/strict';

import {
  sanitizeMaterialUrl,
  createStudyMaterial,
  setPrimaryStudyMaterial,
  archiveStudyMaterial,
} from '../../src/domain/study-material.ts';
import { validateBackupData } from '../../src/storage/backup-validator.ts';
import { createDefaultState } from '../../src/state/defaults.ts';

test('sanitizeMaterialUrl aceita apenas http e https e bloqueia esquemas inseguros (MAT-07)', () => {
  assert.equal(sanitizeMaterialUrl('https://example.com/aula-01.pdf'), 'https://example.com/aula-01.pdf');
  assert.equal(sanitizeMaterialUrl('http://localhost:3000/material'), 'http://localhost:3000/material');
  assert.equal(sanitizeMaterialUrl('javascript:alert(1)'), null);
  assert.equal(sanitizeMaterialUrl('data:text/html,<script>alert(1)</script>'), null);
  assert.equal(sanitizeMaterialUrl('not-a-url'), null);
});

test('createStudyMaterial, setPrimaryStudyMaterial e archiveStudyMaterial mantêm consistência', () => {
  const now = '2026-11-17T20:00:00.000Z';
  const m1 = createStudyMaterial({
    id: 'mat-1',
    subjectId: 'subj-1',
    topicId: 'top-1',
    title: 'PDF Aula 01',
    kind: 'pdf',
    url: 'https://example.com/aula1.pdf',
    isPrimary: true,
    nowISO: now,
  });
  const m2 = createStudyMaterial({
    id: 'mat-2',
    subjectId: 'subj-1',
    topicId: 'top-1',
    title: 'Caderno de Questões',
    kind: 'questions',
    url: 'https://example.com/questoes',
    isPrimary: false,
    nowISO: now,
  });
  const invalid = createStudyMaterial({
    id: 'mat-bad',
    subjectId: 'subj-1',
    title: 'XSS',
    url: 'javascript:alert(1)',
    nowISO: now,
  });

  assert.ok(m1);
  assert.ok(m2);
  assert.equal(invalid, null);

  const switched = setPrimaryStudyMaterial([m1, m2], 'mat-2', '2026-11-17T20:05:00.000Z');
  assert.equal(switched.find(m => m.id === 'mat-1')?.isPrimary, false);
  assert.equal(switched.find(m => m.id === 'mat-2')?.isPrimary, true);

  const archived = archiveStudyMaterial(switched, 'mat-2', '2026-11-17T20:10:00.000Z');
  assert.equal(archived.find(m => m.id === 'mat-2')?.archived, true);
  assert.equal(archived.find(m => m.id === 'mat-2')?.isPrimary, false);
});

test('validateBackupData rejeita studyMaterials com URL insegura e aceita materiais válidos', () => {
  const validState = createDefaultState();
  validState.studyMaterials = [
    {
      id: 'mat-1',
      subjectId: 'subj-1',
      topicId: 'top-1',
      title: 'Aula 01',
      kind: 'pdf',
      url: 'https://example.com/aula1.pdf',
      isPrimary: true,
      createdAt: '2026-11-17T20:00:00.000Z',
      updatedAt: '2026-11-17T20:00:00.000Z',
    },
  ];
  assert.equal(validateBackupData(validState).valid, true);

  const badState = createDefaultState();
  badState.studyMaterials = [
    {
      id: 'mat-bad',
      subjectId: 'subj-1',
      title: 'XSS',
      kind: 'pdf',
      url: 'javascript:alert(1)',
      isPrimary: true,
      createdAt: '2026-11-17T20:00:00.000Z',
      updatedAt: '2026-11-17T20:00:00.000Z',
    },
  ];
  assert.equal(validateBackupData(badState).valid, false);
});
