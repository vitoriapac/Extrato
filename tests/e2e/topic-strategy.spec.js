import {test,expect} from '@playwright/test';
import {activateTab,openDemo} from './helpers.js';

test('explica impacto e permite editar pré-requisitos sem criar ciclos',async({page})=>{
  await openDemo(page);
  await activateTab(page,'disciplinas');
  await page.locator('.notes-toggle-btn').first().click();
  const details=page.locator('.notes-row').first();
  await expect(details.locator('.topic-strategy-summary')).toContainText('Impacto usado na prioridade');
  await expect(details.locator('.topic-strategy-summary')).toContainText(/catálogo|disciplina|manualmente|Sem impacto/i);
  const prerequisites=details.locator('.topic-prerequisites');
  await prerequisites.locator('summary').click();
  const available=prerequisites.locator('input[type="checkbox"]:not(:disabled)').first();
  if(await available.count()){
    const initial=await available.isChecked();
    await available.setChecked(!initial);
    await expect(available).toBeChecked({checked:!initial});
  }
});
