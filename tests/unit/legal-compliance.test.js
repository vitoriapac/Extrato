import test from 'node:test';
import assert from 'node:assert/strict';
import { h } from 'preact';
import { renderToString } from 'preact-render-to-string';
import {
  CURRENT_LEGAL_VERSION,
  LEGAL_METADATA,
  TERMS_OF_SERVICE,
  PRIVACY_POLICY,
  USER_RIGHTS_LGPD,
  getLegalDocument,
  hasUserAcceptedCurrentLegalVersion,
  createLegalAcceptancePayload,
  parseLegalQueryParam,
} from '../../src/domain/legal/legal-documents.js';
import { LegalComplianceView } from '../../src/ui/views/LegalComplianceView.js';

test('CURRENT_LEGAL_VERSION e LEGAL_METADATA — metadados canônicos e canal do DPO', () => {
  assert.equal(CURRENT_LEGAL_VERSION, '2026-11-v1');
  assert.equal(LEGAL_METADATA.version, CURRENT_LEGAL_VERSION);
  assert.equal(LEGAL_METADATA.dpoEmail, 'privacidade@extratodeestudos.com.br');
  assert.ok(LEGAL_METADATA.jurisdiction.includes('Art. 101, I do Código de Defesa do Consumidor'));
});

test('TERMS_OF_SERVICE — possui todas as cláusulas obrigatórias de CDC e Código Civil com Legal Design', () => {
  assert.equal(TERMS_OF_SERVICE.id, 'terms');
  assert.equal(TERMS_OF_SERVICE.version, CURRENT_LEGAL_VERSION);
  assert.ok(TERMS_OF_SERVICE.sections.length >= 6);

  const sectionIds = TERMS_OF_SERVICE.sections.map(s => s.id);
  assert.ok(sectionIds.includes('natureza-servico'));
  assert.ok(sectionIds.includes('licenca-planos'));
  assert.ok(sectionIds.includes('faturamento-pix-cartao'));
  assert.ok(sectionIds.includes('direito-arrependimento-7d'));
  assert.ok(sectionIds.includes('garantia-local-first'));
  assert.ok(sectionIds.includes('cancelamento-recorrencia'));

  // Confere que todas as seções possuem Legal Design (resumo em linguagem simples)
  for (const s of TERMS_OF_SERVICE.sections) {
    assert.ok(s.simpleSummary && s.simpleSummary.length > 10);
    assert.ok(Array.isArray(s.content) && s.content.length > 0);
  }

  // Verifica proteção ao consumidor do Art. 49 CDC
  const arrependimento = TERMS_OF_SERVICE.sections.find(s => s.id === 'direito-arrependimento-7d');
  assert.ok(arrependimento);
  assert.ok(arrependimento.content.some(c => c.includes('7 (sete) dias corridos')));
  assert.ok(arrependimento.content.some(c => c.includes('Art. 49 do Código de Defesa do Consumidor')));
});

test('PRIVACY_POLICY — cobre arquitetura Local-First, bases legais da LGPD e Marco Civil da Internet', () => {
  assert.equal(PRIVACY_POLICY.id, 'privacy');
  assert.ok(PRIVACY_POLICY.sections.length >= 5);

  const sectionIds = PRIVACY_POLICY.sections.map(s => s.id);
  assert.ok(sectionIds.includes('arquitetura-privacy-by-design'));
  assert.ok(sectionIds.includes('bases-legais-e-inventario'));
  assert.ok(sectionIds.includes('subprocessadores'));
  assert.ok(sectionIds.includes('zero-comercializacao'));
  assert.ok(sectionIds.includes('seguranca-retencao'));

  // Valida citação do Marco Civil (6 meses de logs)
  const bases = PRIVACY_POLICY.sections.find(s => s.id === 'bases-legais-e-inventario');
  assert.ok(bases);
  assert.ok(bases.content.some(c => c.includes('Marco Civil da Internet') && c.includes('6 meses')));

  // Valida menção expressa aos operadores homologados
  const subs = PRIVACY_POLICY.sections.find(s => s.id === 'subprocessadores');
  assert.ok(subs);
  const subsText = subs.content.join(' ');
  assert.ok(subsText.includes('Clerk'));
  assert.ok(subsText.includes('Supabase'));
  assert.ok(subsText.includes('AbacatePay'));
  assert.ok(subsText.includes('Resend'));
});

test('USER_RIGHTS_LGPD — detalha os direitos do Art. 18 da LGPD e canal do DPO', () => {
  assert.equal(USER_RIGHTS_LGPD.id, 'rights');
  const sectionIds = USER_RIGHTS_LGPD.sections.map(s => s.id);
  assert.ok(sectionIds.includes('acesso-portabilidade'));
  assert.ok(sectionIds.includes('retificacao'));
  assert.ok(sectionIds.includes('eliminacao-esquecimento'));
  assert.ok(sectionIds.includes('contato-dpo'));
});

test('getLegalDocument — retorna o documento correspondente ou fallback para termos', () => {
  assert.equal(getLegalDocument('terms').id, 'terms');
  assert.equal(getLegalDocument('privacy').id, 'privacy');
  assert.equal(getLegalDocument('rights').id, 'rights');
  assert.equal(getLegalDocument(/** @type {any} */ ('outro')).id, 'terms');
});

test('hasUserAcceptedCurrentLegalVersion — valida compatibilidade com versão vigente', () => {
  assert.equal(hasUserAcceptedCurrentLegalVersion(null), false);
  assert.equal(hasUserAcceptedCurrentLegalVersion({}), false);
  assert.equal(hasUserAcceptedCurrentLegalVersion({ termsAcceptedVersion: 'legacy-v0' }), false);
  assert.equal(hasUserAcceptedCurrentLegalVersion({ termsAcceptedVersion: CURRENT_LEGAL_VERSION }), true);
});

test('createLegalAcceptancePayload — cria payload padronizado para auditoria', () => {
  const payload = createLegalAcceptancePayload();
  assert.equal(payload.termsAcceptedVersion, CURRENT_LEGAL_VERSION);
  assert.ok(payload.termsAcceptedAt);
  assert.ok(payload.privacyAcceptedAt);
  assert.ok(new Date(payload.termsAcceptedAt).getTime() > 0);
});

test('parseLegalQueryParam — extrai parâmetros ?legal=terms | privacy | rights', () => {
  assert.equal(parseLegalQueryParam('https://extrato.app/?legal=terms'), 'terms');
  assert.equal(parseLegalQueryParam('https://extrato.app/?legal=privacy'), 'privacy');
  assert.equal(parseLegalQueryParam('https://extrato.app/?legal=rights'), 'rights');
  assert.equal(parseLegalQueryParam('?legal=TERMS'), 'terms');
  assert.equal(parseLegalQueryParam('?outro=param'), null);
  assert.equal(parseLegalQueryParam(''), null);
});

test('LegalComplianceView — renderiza abas, resumos em linguagem simples e botões do Art. 18 (WCAG AA e Zero Emojis)', () => {
  const html = renderToString(
    h(LegalComplianceView, {
      open: true,
      initialTab: 'terms',
      isModal: true,
      onExportData: () => {},
      onDeleteLocalData: () => {},
    })
  );

  // Verificação de estrutura e Legal Design
  assert.ok(html.includes('Termos e Condições de Uso'));
  assert.ok(html.includes('Privacidade &amp; LGPD') || html.includes('Privacidade & LGPD'));
  assert.ok(html.includes('Seus Direitos'));
  assert.ok(html.includes('Em linguagem simples:'));
  assert.ok(html.includes('icon-tabler'));

  // PROIBIÇÃO ESTRITA DE EMOJIS (Zero Emojis Policy)
  const emojiRegex = /\p{Extended_Pictographic}/u;
  const hasEmoji = emojiRegex.test(html);
  assert.equal(hasEmoji, false, `Violação detectada: a UI gerada contém emojis proibidos: ${html.match(emojiRegex)?.[0]}`);
});

test('LegalComplianceView — renderiza painel de autoatendimento na aba de direitos do titular', () => {
  const html = renderToString(
    h(LegalComplianceView, {
      open: true,
      initialTab: 'rights',
      isModal: false,
      onExportData: () => {},
      onDeleteLocalData: () => {},
    })
  );

  assert.ok(html.includes('Painel de Autoatendimento do Titular'));
  assert.ok(html.includes('Portabilidade de Dados (Art. 18, V)'));
  assert.ok(html.includes('Eliminação Local (Art. 18, VI)'));
  assert.ok(html.includes('privacidade@extratodeestudos.com.br'));

  const emojiRegex = /\p{Extended_Pictographic}/u;
  assert.equal(emojiRegex.test(html), false);
});
