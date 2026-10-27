import { test, expect } from '@playwright/test';
import { generateDemoData } from '../../src/demo/demo-generator.js';
import { activateTab } from './helpers.js';

async function prepare(page) {
  await page.clock.install({ time: new Date('2026-10-01T12:00:00-03:00') });
  await page.goto('/?test=1');
  await expect(page.locator('#testReport')).toBeVisible();
  await page.locator('#testReport').evaluate(node => node.remove());

  const state = generateDemoData({ today: '2026-10-01' });

  await page.evaluate(state => {
    const api = window.__EXTRATO_TEST__;
    const validation = api.validateBackupData(state);
    if (!validation.valid) throw Error(validation.message);
    api.setState(validation.normalized);
    api.renderAll();
  }, state);

  await activateTab(page, 'questoes');
}

test('Caderno de Erros alterna visão, cria flashcard e processa repetição espaçada', async ({
  page,
}) => {
  await prepare(page);

  const toggleBtn = page.locator('#errorNotebookToggleBtn');
  await expect(toggleBtn).toBeVisible();
  await expect(toggleBtn).toContainText('Caderno de Erros (Flashcards)');

  // Alterna para o Caderno de Erros
  await toggleBtn.click();
  await expect(toggleBtn).toContainText('Visão de questões');

  const mount = page.locator('#errorNotebookMount');
  await expect(mount).toBeVisible();
  await expect(page.locator('#questionsMainContainer')).toBeHidden();

  // Verifica cabeçalho e métricas
  await expect(mount).toContainText('Caderno de Erros Ativo & Flashcards');
  await expect(mount).toContainText('Revisões Hoje');

  // Abre modal de novo card
  const newCardBtn = mount.getByRole('button', { name: /\+ Novo Card/i });
  await expect(newCardBtn).toBeVisible();
  await newCardBtn.click();

  const modal = page.locator('dialog[open]');
  await expect(modal).toBeVisible();
  await expect(modal).toContainText('Novo Card de Erro & Flashcard');

  // Preenche formulário do card
  const textareas = modal.locator('textarea');
  await textareas
    .nth(0)
    .fill('Em contratos de concessão, cabe mandado de segurança contra ato de gestão comercial?');
  await textareas
    .nth(1)
    .fill('A banca tenta induzir que qualquer ato de concessionária admite MS.');
  await textareas.nth(2).fill('Não cabe MS contra ato de pura gestão comercial (Súmula 333/STJ).');

  // Salva o card
  const saveBtn = modal.getByRole('button', { name: /Salvar Flashcard/i });
  await saveBtn.click();
  await expect(modal).not.toBeVisible();

  // O card deve estar ativo no deck
  await expect(mount).toContainText(
    'Em contratos de concessão, cabe mandado de segurança contra ato de gestão comercial?'
  );

  // Clica para revelar a resposta
  const revealBtn = mount.getByRole('button', { name: /Revelar Pegadinha & Resposta/i });
  await expect(revealBtn).toBeVisible();
  await revealBtn.click();

  // Verifica revelação da pegadinha e do conceito
  await expect(mount).toContainText('Pegadinha da Banca / Armadilha:');
  await expect(mount).toContainText('Conceito Correto / Fundamento:');
  await expect(mount).toContainText('Não cabe MS contra ato de pura gestão comercial');

  // Avalia com "Bom (4 dias)"
  const goodRatingBtn = mount.getByRole('button', { name: /Bom/i });
  await expect(goodRatingBtn).toBeVisible();
  await goodRatingBtn.click();

  // Alterna para o catálogo de todos os cards
  const catalogBtn = mount.getByRole('button', { name: /Todos/i });
  await catalogBtn.click();

  // Verifica que o card aparece no catálogo
  await expect(mount).toContainText('Em contratos de concessão');
  await expect(mount).toContainText('Revisões: 1');
});

test('Acessibilidade por teclado fecha modais com Escape sem keyboard traps', async ({ page }) => {
  await prepare(page);

  // Alterna para o Caderno de Erros
  await page.locator('#errorNotebookToggleBtn').click();
  const mount = page.locator('#errorNotebookMount');

  // Abre modal
  await mount.getByRole('button', { name: /\+ Novo Card/i }).click();
  const modal = page.locator('dialog[open]');
  await expect(modal).toBeVisible();

  // Pressiona Escape para fechar
  await page.keyboard.press('Escape');
  await expect(modal).not.toBeVisible();
});
