import {test,expect} from '@playwright/test';
import {openDemo} from './helpers.js';

test('gera relatório estratégico identificado como demonstração',async({page})=>{
  await openDemo(page);await page.getByRole('button',{name:/Exportar relatório PDF/i}).click();
  const report=page.locator('.strategic-print-report');await expect(report).toBeAttached();await expect(report).toContainText(/demonstração|fictício/i);
  await page.emulateMedia({media:'print'});await expect(report).toBeVisible();
});
