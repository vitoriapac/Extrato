import test from 'node:test';
import assert from 'node:assert/strict';
import { h } from 'preact';
import { render } from 'preact-render-to-string';
import { WhatIfSimulatorModal } from '../../src/ui/forecasts/WhatIfSimulatorModal.js';
import { FinalStretchBanner } from '../../src/ui/components/FinalStretchBanner.js';

test('WhatIfSimulatorModal — renderiza controles de simulação, cards comparativos e aviso de não mutação', () => {
  const html = render(
    h(WhatIfSimulatorModal, {
      open: true,
      onClose: () => {},
      currentMetrics: {
        readinessScore: 62,
        coverageScore: 45,
        masteryScore: 55,
        weeklyStudyMinutes: 720,
      },
    })
  );

  assert.match(html, /Simulador de Cenários — E se\?/);
  assert.match(html, /Ajuste de Tempo Diário de Estudo/);
  assert.match(html, /Prontidão Geral/);
  assert.match(html, /Carga Semanal/);
  assert.match(html, /Cobertura do Edital/);
  assert.match(html, /Simulação 100% isolada em memória/);
});

test('FinalStretchBanner — não renderiza nada se banner estiver inativo', () => {
  const html = render(
    h(FinalStretchBanner, {
      banner: {
        active: false,
        daysToExam: null,
        badge: '',
        title: '',
        message: '',
        urgency: 'normal',
      },
    })
  );

  assert.equal(html, '');
});

test('FinalStretchBanner — renderiza badge, dias restantes e botão de simulação quando ativo', () => {
  const html = render(
    h(FinalStretchBanner, {
      banner: {
        active: true,
        daysToExam: 8,
        badge: '🚨 Modo Reta Final',
        title: 'Reta Final Ativada: faltam 8 dias',
        message: 'Foco total em questões de fixação.',
        urgency: 'high',
      },
      onOpenWhatIf: () => {},
    })
  );

  assert.match(html, /Modo Reta Final/);
  assert.match(html, /Faltam 8 dias/);
  assert.match(html, /Foco total em questões de fixação/);
  assert.match(html, /Simular &quot;E se\?&quot;/);
});
