import {test,expect} from '@playwright/test';
import {activateTab,openDemo} from './helpers.js';

test('confirma, distribui e desfaz um plano sem perder a navegação',async({page})=>{
  await openDemo(page);
  await activateTab(page,'metas');

  await page.getByRole('button',{name:'Calcular proposta semanal'}).click();
  const confirmPlan=page.getByRole('button',{name:'Confirmar e salvar plano'});
  await expect(confirmPlan).toBeVisible();
  await confirmPlan.click();
  await expect(page.getByText('Plano confirmado',{exact:true})).toBeVisible();

  await page.getByRole('button',{name:'Distribuir nos próximos 7 dias'}).click();
  const confirmDaily=page.getByRole('button',{name:'Confirmar planos diários'});
  await expect(confirmDaily).toBeVisible();
  await confirmDaily.click();

  const undo=page.getByRole('button',{name:'Desfazer última distribuição'});
  await expect(undo).toBeVisible();
  await undo.click();
  await expect(undo).toBeHidden();

  await activateTab(page,'hoje');
  await expect(page.locator('#panel-hoje')).toBeVisible();
});
