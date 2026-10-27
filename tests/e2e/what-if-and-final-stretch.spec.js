import { test, expect } from '@playwright/test';
import { generateDemoData } from '../../src/demo/demo-generator.js';
import { activateTab } from './helpers.js';

async function prepare(page, { examDate = '2026-10-10' } = {}) {
  await page.clock.install({ time: new Date('2026-10-01T12:00:00-03:00') });
  await page.goto('/?test=1');
  await expect(page.locator('#testReport')).toBeVisible();
  await page.locator('#testReport').evaluate(node => node.remove());

  const state = generateDemoData({ today: '2026-10-01' });
  state.examDate = examDate;

  await page.evaluate(state => {
    const api = window.__EXTRATO_TEST__;
    const validation = api.validateBackupData(state);
    if (!validation.valid) throw Error(validation.message);
    api.setState(validation.normalized);
    api.renderAll();
  }, state);

  await activateTab(page, 'dashboard');
}

test('Modo Reta Final exibe banner de urgência quando a prova está a menos de 15 dias', async ({
  page,
}) => {
  // Prova em 2026-10-10 (faltam 9 dias para 2026-10-01)
  await prepare(page, { examDate: '2026-10-10' });

  const banner = page.locator('#finalStretchBannerSlot aside');
  await expect(banner).toBeVisible();
  await expect(banner).toContainText('Modo Reta Final');
  await expect(banner).toContainText('Faltam 9 dias');

  // Abre simulador a partir do banner
  const simulateBtn = banner.getByRole('button', { name: /Simular "E se\?"/ });
  await expect(simulateBtn).toBeVisible();
  await simulateBtn.click();

  const modal = page.locator('.what-if-modal');
  await expect(modal).toBeVisible();
  await expect(modal).toContainText('Simulador de Cenários — E se?');

  // Interage com os botões de minutos diários
  const btn60m = modal.getByRole('button', { name: '+60 min' });
  await btn60m.click();

  // Verifica que os insights e os deltas reagiram
  await expect(modal).toContainText('+60 min/dia');

  // Fecha o modal via botão
  await modal.getByRole('button', { name: 'Fechar' }).last().click();
  await expect(modal).not.toBeVisible();
});

test('Simulador E se pode ser acionado da Projeção na aba Desempenho e responde ao teclado', async ({
  page,
}) => {
  await prepare(page, { examDate: '2026-11-20' }); // Mais de 15 dias (banner inativo)

  // Banner deve estar ausente
  await expect(page.locator('#finalStretchBannerSlot aside')).toHaveCount(0);

  // Navega para Desempenho
  await activateTab(page, 'desempenho');

  // Localiza botão de simulação
  const openWhatIfBtn = page.locator('[data-open-what-if]').first();
  await expect(openWhatIfBtn).toBeVisible();
  await openWhatIfBtn.click();

  const modal = page.locator('.what-if-modal');
  await expect(modal).toBeVisible();

  // Fecha usando a tecla Escape
  await page.keyboard.press('Escape');
  await expect(modal).not.toBeVisible();
});
