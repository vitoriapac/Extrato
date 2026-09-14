import {test,expect} from '@playwright/test';
import {activateTab} from './helpers.js';

test.beforeEach(async({page})=>{await page.goto('/');await page.evaluate(()=>{localStorage.clear();sessionStorage.clear()});await page.reload();await activateTab(page,'disciplinas')});

test('importa CSV com confirmação e não duplica tópicos',async({page})=>{
  const file={name:'meu-edital.csv',mimeType:'text/csv',buffer:Buffer.from('disciplina,topico,dificuldade,importancia,esforco,tags\nDireito Eleitoral,Alistamento,Médio,75,120,edital|prioridade')};
  const input=page.locator('#structuredContentFile');
  await input.setInputFiles(file);
  await expect(page.locator('#modalMessage')).toContainText('Importar 1 tópicos em 1 disciplinas');
  await page.getByRole('button',{name:'Confirmar'}).click();
  const imported=page.locator('.subject-block',{hasText:'Direito Eleitoral'});
  await expect(imported).toHaveCount(1);
  await expect(imported.locator('input[placeholder="Nome do tópico"]')).toHaveValue('Alistamento');
  const subjectCount=await page.locator('.subject-block').count();
  await input.setInputFiles(file);
  await expect(page.locator('#modalMessage')).toContainText('1 tópicos existentes');
  await page.getByRole('button',{name:'Confirmar'}).click();
  await expect(page.locator('.subject-block')).toHaveCount(subjectCount);
  await expect(imported.locator('.ledger tbody tr[id^="topic-row-"]')).toHaveCount(1);
});
