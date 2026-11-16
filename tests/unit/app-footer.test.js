import test from 'node:test';
import assert from 'node:assert/strict';
import { h } from 'preact';
import { render } from 'preact-render-to-string';
import { AppFooter, APP_FOOTER_SHORTCUTS } from '../../src/ui/shell/AppFooter.js';
import { mountAppFooter } from '../../src/ui/shell/mount-app-footer.js';

test('AppFooter preserva os IDs ligados pelos controladores de demonstração, backup e planos', () => {
  const html = render(h(AppFooter, { onOpenSearch: () => {} }));
  for (const id of ['enterDemoBtn', 'openSalesLandingBtn', 'openSaasPlansBtn', 'openDataManagementBtn']) {
    assert.match(html, new RegExp(`id="${id}"`), `botão ${id} ausente`);
  }
  assert.match(html, /aria-describedby="enterDemoNote"/);
  assert.match(html, /id="enterDemoNote"/);
  assert.match(html, /id="openDataManagementBtn"[^>]*aria-expanded="false"|aria-expanded="false"[^>]*id="openDataManagementBtn"/);
});

test('AppFooter organiza blocos Produto, Seus dados e Ajuda com títulos acessíveis e links legais', () => {
  const html = render(h(AppFooter, { onOpenSearch: () => {} }));
  for (const title of ['Produto', 'Seus dados', 'Ajuda']) {
    assert.ok(html.includes(`>${title}</h2>`), `bloco ${title} ausente`);
  }
  assert.equal((html.match(/aria-labelledby="appFooter\w+Title"/g) || []).length, 3);
  assert.match(html, /href="#instrucoes"/);
  assert.match(html, /id="openLegalTermsBtn"/);
  assert.match(html, /Termos de uso/);
  assert.match(html, /id="openLegalPrivacyBtn"/);
  assert.match(html, /Política de privacidade/);
});

test('AppFooter mostra a linha de atalhos com kbd e assinatura completa sem emojis', () => {
  const html = render(h(AppFooter, { onOpenSearch: () => {} }));
  assert.match(html, /aria-label="Atalhos de teclado"/);
  const kbdCount = (html.match(/<kbd>/g) || []).length;
  const expected = APP_FOOTER_SHORTCUTS.reduce((sum, shortcut) => sum + shortcut.keys.length, 0);
  assert.equal(kbdCount, expected);
  assert.match(html, /Extrato de Estudos/);
  assert.match(html, /Feito com/);
  assert.match(html, /para estudantes brasileiros/);
  assert.match(html, /icon-lucide-heart/);
  assert.doesNotMatch(html, /\p{Extended_Pictographic}/u);
});

test('mountAppFooter não falha sem ponto de montagem', () => {
  assert.equal(mountAppFooter(/** @type {any} */ ({ getElementById: () => null })), false);
});
