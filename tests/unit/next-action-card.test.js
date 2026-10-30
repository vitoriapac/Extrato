import test from 'node:test';
import assert from 'node:assert/strict';
import { h } from 'preact';
import { render } from 'preact-render-to-string';
import { NextActionCard } from '../../src/ui/tabs/dashboard/NextActionCard.js';

test('NextActionCard — renderiza estado vazio quando não há atividade elegível', () => {
  const props = {
    model: null,
    emptyState: {
      message: 'Defina pelo menos 15 minutos para hoje para receber uma sugestão.',
      timerHref: '#overview-timer',
    },
  };

  const html = render(h(NextActionCard, props));
  assert.ok(html.includes('Defina pelo menos 15 minutos para hoje'));
  assert.ok(html.includes('href="#overview-timer"'));
  assert.ok(html.includes('Ver cronômetro e registrar estudo'));
});

test('NextActionCard — neutraliza link do cronômetro quando timerHref é nulo ou ausente', () => {
  const props = {
    model: null,
    emptyState: {
      message: 'Ainda não há uma atividade elegível com os dados atuais.',
      timerHref: null,
    },
  };

  const html = render(h(NextActionCard, props));
  assert.ok(html.includes('Ainda não há uma atividade elegível com os dados atuais.'));
  assert.ok(!html.includes('Ver cronômetro e registrar estudo'));
  assert.ok(!html.includes('#overview-timer'));
});

test('NextActionCard — renderiza WelcomeHeroCard acolhedor quando isFirstRun é true', () => {
  const props = {
    model: null,
    emptyState: {
      isFirstRun: true,
      onboardingTitle: 'Bem-vindo ao StudyTrack',
      onboardingDescription: 'Seu copiloto diário até a aprovação.',
      timerHref: null,
    },
  };

  const html = render(h(NextActionCard, props));
  assert.ok(html.includes('welcome-hero-card'));
  assert.ok(html.includes('PRIMEIRO ACESSO AO STUDYTRACK'));
  assert.ok(html.includes('Bem-vindo ao StudyTrack'));
  assert.ok(html.includes('Seu copiloto diário até a aprovação.'));
  assert.ok(html.includes('data-guided-action="open"'));
  assert.ok(html.includes('Montar meu plano de estudos'));
  assert.ok(html.includes('id="enterDemoHeroBtn"'));
  assert.ok(html.includes('Experimentar demonstração'));
  assert.ok(!html.includes('Ainda não há uma atividade elegível'));
});

test('NextActionCard — renderiza card estruturado respondendo às 6 perguntas contratuais', () => {
  const props = {
    model: {
      what: {
        subjectName: 'Direito Administrativo',
        topicName: 'Atos Administrativos',
      },
      why: {
        primaryReason: 'Desempenho recente em 58% (Meta: 80%)',
        additionalReasons: ['Alta relevância no edital', 'Lacuna crítica detectada'],
      },
      duration: {
        minutesFormatted: '45 min',
        minutesNumeric: 45,
      },
      importance: {
        priorityScore: 88,
        impactLabel: 'peso alto no edital',
      },
      evidence: {
        masteryLabel: 'Domínio 58/100',
        accuracyLabel: 'Precisão recente 54%',
        historicalPresenceLabel: '15% das questões da banca',
      },
      nextStep: {
        activityType: 'study',
        actionLabel: 'Teoria e Fixação',
        buttonText: 'Iniciar estudo',
        buttonAction: {
          type: 'daily-start',
          planItemId: 'plan-item-123',
        },
      },
      bookmark: {
        resourceType: 'pdf',
        label: 'pág. 42 de 110',
        currentUnit: 42,
        totalUnits: 110,
        positionText: '',
        updatedAt: '2026-10-25T14:30:00.000Z',
      },
    },
    isInProgress: false,
    dataAttributes: {
      'data-decision-role': 'planned',
      'data-plan-item-id': 'plan-item-123',
    },
  };

  const html = render(h(NextActionCard, props));

  // 1. O que estudar?
  assert.ok(html.includes('Direito Administrativo · Atos Administrativos'));

  // 2. Por que estudar?
  assert.ok(html.includes('Por que estudar isso agora?'));
  assert.ok(html.includes('Desempenho recente em 58% (Meta: 80%)'));
  assert.ok(html.includes('Alta relevância no edital'));

  // 3. Quanto tempo?
  assert.ok(html.includes('45 min'));

  // 4. Importância?
  assert.ok(html.includes('prioridade 88/100'));
  assert.ok(html.includes('peso alto no edital'));

  // 5. Evidência?
  assert.ok(html.includes('Domínio 58/100'));
  assert.ok(html.includes('Precisão recente 54%'));

  // Ponto de parada (Bookmark)
  assert.ok(html.includes('Continuar de:'));
  assert.ok(html.includes('bookmark-badge'));
  assert.ok(html.includes('pág. 42 de 110'));

  // 6. Próximo passo (Ação)
  assert.ok(html.includes('data-daily-start="plan-item-123"'));
  assert.ok(html.includes('Iniciar estudo'));
  assert.ok(html.includes('data-decision-role="planned"'));
});

test('NextActionCard — renderiza estado de sessão ativa em andamento com botão de retomar', () => {
  const props = {
    model: {
      what: {
        subjectName: 'Português',
        topicName: 'Crase',
      },
      why: {
        primaryReason: 'Atividade em andamento no cronômetro',
      },
      duration: {
        minutesFormatted: '30 min',
      },
      importance: {
        priorityScore: 75,
      },
      evidence: {
        masteryLabel: 'Domínio 70/100',
      },
      nextStep: {
        activityType: 'study',
        actionLabel: 'Sessão em andamento',
        buttonText: 'Retomar sessão',
        buttonAction: {
          type: 'timer-focus',
        },
      },
    },
    isInProgress: true,
  };

  const html = render(h(NextActionCard, props));

  assert.ok(html.includes('is-in-progress'));
  assert.ok(html.includes('Em andamento · Sessão ativa'));
  assert.ok(html.includes('data-delegated-click="openStudyTimerFocus()"'));
  assert.ok(html.includes('Retomar sessão'));
});
