import {test,expect} from '@playwright/test';
import {openDemo} from './helpers.js';

test('gera relatório estratégico identificado como demonstração',async({page})=>{
  await openDemo(page);await page.locator('#reportPeriodSelect').selectOption('90');await page.getByRole('button',{name:/Exportar relatório PDF/i}).click();
  const report=page.locator('.strategic-print-report');await expect(report).toBeAttached();await expect(report).toContainText(/demonstração|fictício/i);
  await expect(report).toContainText('Últimos 90 dias');await expect(report).toContainText('Planejamento versus execução');await expect(report).toContainText('Prioridades do próximo período');
  await expect(report).toContainText('Comparação entre períodos');await expect(report).toContainText('Alvos cadastrados');
  await page.emulateMedia({media:'print'});await expect(report).toBeVisible();
});

test('metas comparam intervalos e a busca global abre comandos',async({page})=>{
  await openDemo(page);await page.locator('[data-tab="metas"]').click();
  await expect(page.locator('#periodComparisonResults')).toContainText('Últimos 7 dias');
  await page.locator('#periodComparisonPreset').selectOption('30');
  await expect(page.locator('#periodComparisonResults')).toContainText('Últimos 30 dias');
  await page.locator('#periodComparisonPreset').selectOption('custom');
  await expect(page.locator('#periodComparisonStartWrap')).toBeVisible();
  await page.locator('#periodComparisonStart').fill('2026-08-01');await page.locator('#periodComparisonEnd').fill('2026-08-10');
  await expect(page.locator('#periodComparisonResults')).toContainText('2026-08-01 a 2026-08-10');
  const search=page.locator('#globalSearchInput');await search.fill('abrir instruções');
  const command=page.getByRole('button',{name:'Abrir Instruções'});await expect(command).toBeVisible();await command.click();
  await expect(page.locator('#panel-instrucoes')).toBeVisible();
});
