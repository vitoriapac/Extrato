import fs from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { h } from 'preact';
import { render } from 'preact-render-to-string';
import { RemoteSyncModal } from '../../src/ui/components/RemoteSyncModal.js';
import { ConfirmPromptModal } from '../../src/ui/components/ConfirmPromptModal.js';

test('RemoteSyncModal — renderiza campos acessíveis, botões Lucide e status sem estilos soltos', () => {
  const closedHtml = render(
    h(RemoteSyncModal, {
      open: false,
      serverUrl: '',
      username: '',
      password: '',
      passphrase: '',
      passphraseHint: 'Mínimo de 12 caracteres.',
      statusText: '',
      statusError: false,
      statusVisible: false,
      onFieldChange: () => {},
      onClose: () => {},
      onSaveConfig: () => {},
      onTestConnection: () => {},
      onReconcile: () => {},
      onPush: () => {},
      onPull: () => {},
    })
  );
  assert.ok(closedHtml.includes('id="remoteSyncOverlay"'));
  assert.ok(!closedHtml.includes('show'));
  assert.ok(closedHtml.includes('hidden'));

  const openHtml = render(
    h(RemoteSyncModal, {
      open: true,
      serverUrl: 'https://dav.exemplo.com/estudos/',
      username: 'estudante',
      password: 'segredo',
      passphrase: 'chave-forte-teste-12',
      passphraseHint: 'Frase forte.',
      statusText: 'Falha ao conectar.',
      statusError: true,
      statusVisible: true,
      onFieldChange: () => {},
      onClose: () => {},
      onSaveConfig: () => {},
      onTestConnection: () => {},
      onReconcile: () => {},
      onPush: () => {},
      onPull: () => {},
    })
  );
  for (const requiredId of [
    'remoteSyncOverlay',
    'remoteSyncUrl',
    'remoteSyncUsername',
    'remoteSyncPassword',
    'remoteSyncPassphrase',
    'remoteSyncPassphraseHint',
    'remoteSyncStatusBox',
    'remoteSyncStatusMsg',
    'testRemoteSyncBtn',
    'reconcileRemoteSyncBtn',
    'pushRemoteSyncBtn',
    'pullRemoteSyncBtn',
    'closeRemoteSyncBtn',
    'saveRemoteSyncConfigBtn',
  ]) {
    assert.ok(openHtml.includes(`id="${requiredId}"`), `Faltando #${requiredId}`);
  }
  assert.ok(openHtml.includes('class="'));
  assert.ok(openHtml.includes('show'));
  assert.ok(openHtml.includes('role="alert"'));
  assert.ok(openHtml.includes('Falha ao conectar.'));
  assert.ok(openHtml.includes('icon-lucide-cloud-upload'));
  assert.ok(openHtml.includes('icon-lucide-cloud-download'));
  assert.ok(!openHtml.includes('style='));
});

test('ConfirmPromptModal — preserva contratos de confirmação e prompt acessível', () => {
  const confirmHtml = render(
    h(ConfirmPromptModal, {
      open: true,
      message: 'Deseja excluir?',
      hasPrompt: false,
      promptValue: '',
      onConfirm: () => {},
      onCancel: () => {},
    })
  );
  assert.ok(confirmHtml.includes('id="modalOverlay"'));
  assert.ok(confirmHtml.includes('show'));
  assert.ok(confirmHtml.includes('id="modalMessage"'));
  assert.ok(confirmHtml.includes('Deseja excluir?'));
  assert.ok(confirmHtml.includes('id="modalCancelBtn"'));
  assert.ok(confirmHtml.includes('id="modalConfirmBtn"'));
  assert.ok(confirmHtml.includes('aria-labelledby="modalMessage"'));

  const promptHtml = render(
    h(ConfirmPromptModal, {
      open: true,
      title: 'Confirmação',
      message: 'Digite LIMPAR para confirmar.',
      hasPrompt: true,
      promptLabel: 'Confirmação',
      promptValue: 'ERRADO',
      promptPlaceholder: 'LIMPAR',
      promptError: 'Digite LIMPAR exatamente como exibido.',
      confirmLabel: 'Limpar dados',
      confirmVariant: 'danger',
      onConfirm: () => {},
      onCancel: () => {},
    })
  );
  assert.ok(promptHtml.includes('id="modalPromptGroup"'));
  assert.ok(promptHtml.includes('id="modalPromptInput"'));
  assert.ok(promptHtml.includes('aria-invalid="true"'));
  assert.ok(promptHtml.includes('Digite LIMPAR exatamente como exibido.'));
  assert.ok(promptHtml.includes('Limpar dados'));
});

test('Governança Onda 1 — zero hex solto, zero style inline e zero emojis nos novos componentes', () => {
  const emojiRegex = /\p{Extended_Pictographic}/u;
  for (const file of [
    'src/ui/components/RemoteSyncModal.tsx',
    'src/ui/components/ConfirmPromptModal.tsx',
  ]) {
    const src = fs.readFileSync(file, 'utf8');
    assert.ok(!emojiRegex.test(src), `Emoji encontrado em ${file}`);
    assert.equal(src.match(/#[0-9a-fA-F]{3,8}\b/g), null, `Hex solto em ${file}`);
    assert.ok(!src.includes('style='), `Atributo style inline em ${file}`);
    assert.ok(!src.includes('innerHTML'), `innerHTML proibido em ${file}`);
  }

  const indexHtml = fs.readFileSync('index.html', 'utf8');
  assert.ok(indexHtml.includes('id="toastViewportMount"'));
  assert.ok(indexHtml.includes('id="remoteSyncMount"'));
  assert.ok(indexHtml.includes('id="confirmModalMount"'));
  assert.ok(!indexHtml.includes('id="remoteSyncOverlay"'));
  assert.ok(!indexHtml.includes('id="modalOverlay"'));
  assert.ok(!indexHtml.includes('id="toast"'));
});
