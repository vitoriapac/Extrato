import {test,expect} from '@playwright/test';
import {openDemo} from './helpers.js';

test('gera relatório estratégico identificado como demonstração',async({page})=>{
  await openDemo(page);await page.locator('#reportPeriodSelect').selectOption('90');await page.getByRole('button',{name:/Exportar relatório PDF/i}).click();
  const report=page.locator('.strategic-print-report');await expect(report).toBeAttached();await expect(report).toContainText(/demonstração|fictício/i);
  await expect(report).toContainText('Últimos 90 dias');await expect(report).toContainText('Planejamento versus execução');await expect(report).toContainText('Prioridades do próximo período');
  await page.emulateMedia({media:'print'});await expect(report).toBeVisible();
});
