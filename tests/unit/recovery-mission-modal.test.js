import test from 'node:test';
import assert from 'node:assert/strict';
import { h } from 'preact';
import { render } from 'preact-render-to-string';
import { RecoveryMissionModal } from '../../src/ui/components/RecoveryMissionModal.js';

test('RecoveryMissionModal — não renderiza nada quando open é false', () => {
  const html = render(
    h(RecoveryMissionModal, {
      open: false,
      onClose: () => {},
      overdueItems: [],
      onCompleteReview: () => {},
    })
  );
  assert.equal(html, '');
});

test('RecoveryMissionModal — renderiza setup e blocos calculados quando aberto', () => {
  const overdue = [
    {
      id: 'rev-1',
      origin: 'Agenda de Revisões',
      date: '2026-11-01',
      subjectName: 'Direito Constitucional',
      topicId: 'top-1',
      topicName: 'Direitos Fundamentais',
      daysOverdue: 8,
      priorityScore: 80,
    },
    {
      id: 'rev-2',
      origin: 'Calendário',
      date: '2026-11-04',
      subjectName: 'Português',
      topicId: 'top-2',
      topicName: 'Crase',
      daysOverdue: 5,
      priorityScore: 50,
    },
  ];

  const html = render(
    h(RecoveryMissionModal, {
      open: true,
      onClose: () => {},
      overdueItems: overdue,
      criticalTopicIds: ['top-1'],
      onCompleteReview: () => {},
    })
  );

  assert.match(html, /Centro de Recuperação — Missão de Resgate/);
  assert.match(html, /30 minutos/);
  assert.match(html, /45 minutos/);
  assert.match(html, /Direitos Fundamentais/);
  assert.match(html, /Iniciar Missão/);
});

test('RecoveryMissionModal — exibe mensagem amigável quando não há revisões atrasadas', () => {
  const html = render(
    h(RecoveryMissionModal, {
      open: true,
      onClose: () => {},
      overdueItems: [],
      onCompleteReview: () => {},
    })
  );

  assert.match(html, /Nenhuma revisão atrasada pendente/);
  assert.match(html, /100% em dia/);
});
