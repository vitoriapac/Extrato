import test from 'node:test';
import assert from 'node:assert/strict';
import { h } from 'preact';
import { render } from 'preact-render-to-string';
import { FirstAccessModal } from '../../src/ui/components/FirstAccessModal.js';

test('FirstAccessModal — não renderiza nada quando open é false', () => {
  const html = render(
    h(FirstAccessModal, {
      open: false,
      onClose: () => {},
      onStartGuidedPlan: () => {},
      onStartDemo: () => {},
    })
  );

  assert.equal(html, '');
});

test('FirstAccessModal — renderiza opções de plano guiado e demonstração quando aberto', () => {
  const html = render(
    h(FirstAccessModal, {
      open: true,
      onClose: () => {},
      onStartGuidedPlan: () => {},
      onStartDemo: () => {},
      onExploreManually: () => {},
    })
  );

  assert.match(html, /Boas-vindas ao Extrato de Estudos/);
  assert.match(html, /Montar meu plano guiado/);
  assert.match(html, /Experimentar demonstração interativa/);
  assert.match(html, /Configurar manualmente ou explorar livremente/);
  assert.match(html, /Recomendado/);
});
