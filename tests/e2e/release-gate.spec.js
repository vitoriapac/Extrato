import {test,expect} from '@playwright/test';
import {activateTab,expectNoPageOverflow,openDemo} from './helpers.js';

test('paleta abre sem consulta, agrupa comandos e navega por teclado',async({page})=>{
  await openDemo(page);
  await page.keyboard.press('Control+k');
  const search=page.locator('#globalSearchInput'),panel=page.locator('#globalSearchResults');
  await expect(search).toBeFocused();await expect(search).toHaveAttribute('aria-expanded','true');
  await expect(panel.getByRole('group',{name:'Ações'})).toBeVisible();
  await expect(panel.getByRole('group',{name:'Navegação'})).toBeVisible();
  await search.press('ArrowDown');await expect(panel.locator('.search-result-item').first()).toBeFocused();
  await page.keyboard.press('Escape');await expect(panel).not.toHaveClass(/show/);await expect(search).toHaveAttribute('aria-expanded','false');
});

test('relatório inclui planejamento adaptativo e resultados posteriores',async({page})=>{
  await openDemo(page);await page.getByRole('button',{name:/Exportar relatório PDF/i}).click();
  const report=page.locator('#strategicPrintReport');
  await expect(report).toContainText('Planejamento adaptativo');
  await expect(report).toContainText('Recomendações');
  await expect(report).toContainText('Resultados posteriores');
  await expect(report).toContainText('As medições posteriores não demonstram');
});

for(const width of [320,430])for(const theme of ['light','dark'])test(`configuração estratégica edita sem overflow em ${width}px no tema ${theme}`,async({page})=>{
  await page.setViewportSize({width,height:850});await openDemo(page);
  if(theme==='dark')await page.locator('#themeToggleBtn').click();
  await activateTab(page,'metas');
  const row=page.locator('#examBlueprintConfig .exam-subject-config').first();
  await row.locator('summary').click();await expect(row.locator('.exam-subject-row')).toBeVisible();
  await expectNoPageOverflow(page);
  const original=await row.locator('[name="priority"]').inputValue();
  await row.locator('[name="priority"]').selectOption(original==='high'?'low':'high');
  await row.getByRole('button',{name:'Cancelar'}).click();
  await page.locator('#examBlueprintConfig .exam-subject-config').first().locator('summary').click();
  await expect(page.locator('#examBlueprintConfig .exam-subject-config').first().locator('[name="priority"]')).toHaveValue(original);
  await page.locator('#examBlueprintConfig .exam-subject-config').first().locator('[name="priority"]').selectOption('high');
  await page.locator('#examBlueprintConfig .exam-subject-config').first().getByRole('button',{name:'Salvar'}).click();
  await expect(page.locator('#examBlueprintConfig .exam-subject-config').first().locator('summary')).toContainText('Alta');
  await expectNoPageOverflow(page);
});
