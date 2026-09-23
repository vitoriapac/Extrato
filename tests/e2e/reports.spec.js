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
  await expect(page.locator('#periodComparisonResults .comparison-insight')).toContainText('A variação descreve os registros dos períodos');
  await page.locator('#periodComparisonPreset').selectOption('30');
  await expect(page.locator('#periodComparisonResults')).toContainText('Últimos 30 dias');
  await page.locator('#periodComparisonPreset').selectOption('custom');
  await expect(page.locator('#periodComparisonStartWrap')).toBeVisible();
  await page.locator('#periodComparisonStart').fill('2026-08-01');await page.locator('#periodComparisonEnd').fill('2026-08-10');
  await expect(page.locator('#periodComparisonResults')).toContainText('2026-08-01 a 2026-08-10');
  const search=page.locator('#globalSearchInput');await search.fill('abrir instruções');
  const command=page.getByRole('option',{name:'Abrir Instruções Ação da aplicação'});await expect(command).toBeVisible();await expect(search).toHaveAttribute('aria-expanded','true');await search.press('ArrowDown');await expect(command).toBeFocused();await search.press('Enter');
  await expect(page.locator('#panel-instrucoes')).toBeVisible();
});

test('paleta executa ações de registro por teclado e fecha com Escape',async({page})=>{
  await openDemo(page);
  const search=page.locator('#globalSearchInput');
  await page.keyboard.press('Control+k');
  await expect(search).toBeFocused();
  await search.fill('registrar questões');
  const command=page.getByRole('option',{name:'Registrar questões Ação da aplicação'});
  await expect(command).toBeVisible();
  await search.press('ArrowDown');
  await search.press('Enter');
  await expect(page.locator('#panel-questoes')).toHaveClass(/active/);
  await expect(page.locator('#questoesBody tr.row-editing')).toBeVisible();
  await expect(page.locator('#questoesBody tr.row-editing input[type="number"]').first()).toBeVisible();
  await page.keyboard.press('Control+k');
  await search.fill('abrir calendário');
  await expect(page.getByRole('option',{name:/Abrir Calendário/})).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('#globalSearchResults')).not.toHaveClass(/show/);
});
