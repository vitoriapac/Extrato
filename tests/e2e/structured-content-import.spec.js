import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {activateTab} from './helpers.js';

test.beforeEach(async({page})=>{await page.goto('/');await page.evaluate(()=>{localStorage.clear();sessionStorage.clear()});await page.reload();await activateTab(page,'disciplinas')});

test('importa CSV com confirmação e não duplica tópicos',async({page})=>{
  const file={name:'meu-edital.csv',mimeType:'text/csv',buffer:Buffer.from('disciplina,topico,dificuldade,importancia,esforco,tags\nDireito Eleitoral,Alistamento,Médio,75,120,edital|prioridade')};
  const input=page.locator('#structuredContentFile');
  await input.setInputFiles(file);
  await expect(page.locator('#structuredImportOverlay')).toBeVisible();
  await expect(page.locator('#structuredImportContent')).toContainText('meu-edital.csv');
  await expect(page.locator('#structuredImportContent')).toContainText('1novos tópicos');
  await page.getByRole('button',{name:'Confirmar importação'}).click();
  const imported=page.locator('.subject-block',{hasText:'Direito Eleitoral'});
  await expect(imported).toHaveCount(1);
  await expect(imported.locator('input[placeholder="Nome do tópico"]')).toHaveValue('Alistamento');
  const subjectCount=await page.locator('.subject-block').count();
  const subjectId=await imported.getAttribute('data-subject-id');
  await page.reload();await activateTab(page,'disciplinas');
  await input.setInputFiles(file);
  await expect(page.locator('#structuredImportContent')).toContainText('1 tópicos');
  await page.getByRole('button',{name:'Confirmar importação'}).click();
  await expect(page.locator('.subject-block')).toHaveCount(subjectCount);
  await expect(imported.locator('.ledger tbody tr[id^="topic-row-"]')).toHaveCount(1);
  await expect(imported).toHaveAttribute('data-subject-id',subjectId);
});

test('arquivo inválido exibe erros amigáveis e não altera o estado',async({page})=>{
  const before=await page.locator('.subject-block').count();
  await page.locator('#structuredContentFile').setInputFiles({name:'invalido.csv',mimeType:'text/csv',buffer:Buffer.from('disciplina,topico,importancia\nPortuguês,,130')});
  await expect(page.locator('#structuredImportContent')).toContainText('2 problemas encontrados');
  await expect(page.locator('#structuredImportContent')).toContainText('Linha 2');
  await expect(page.locator('#structuredImportConfirmBtn')).toBeHidden();
  await page.locator('#structuredImportCancelBtn').click();
  await expect(page.locator('.subject-block')).toHaveCount(before);
});

test('prévia estruturada mantém foco no diálogo e não apresenta falhas de acessibilidade',async({page})=>{
  await page.locator('#structuredContentFile').setInputFiles({name:'edital.csv',mimeType:'text/csv',buffer:Buffer.from('disciplina,topico\nPortuguês,Interpretação')});
  await expect(page.locator('#structuredImportCancelBtn')).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(page.locator('#structuredImportConfirmBtn')).toBeFocused();
  const result=await new AxeBuilder({page}).include('#structuredImportOverlay').analyze();
  expect(result.violations).toEqual([]);
  await page.keyboard.press('Escape');
  await expect(page.locator('#structuredImportOverlay')).toBeHidden();
});
