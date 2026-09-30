import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {activateTab,expectNoPageOverflow} from './helpers.js';

test('saúde, incidência e divergências precedem importação',async({page})=>{
  await page.goto('/?test=1');
  await expect(page.locator('#testReport')).toBeVisible();
  await page.locator('#testReport').evaluate(element=>element.remove());
  await activateTab(page,'desempenho');
  await page.locator('[data-performance-section="exam"]').click();
  const order=await page.locator('.exam-intelligence-hub').evaluate(element=>[...element.querySelectorAll(':scope > section')].map(section=>section.classList.contains('exam-historical-matrix')?'matrix':section.classList.contains('exam-json-import')?'import':section.getAttribute('aria-label')));
  expect(order).toEqual(['Saúde da evidência','matrix','Configuração e evidência histórica','Prova e situação pessoal','import']);
  await expect(page.locator('#examDataQuality')).toContainText('Evidência limitada');
  await expect(page.locator('#examConfigurationAudit')).toContainText('Configurado × histórico');
  await expect(page.locator('.exam-intelligence-topics')).not.toHaveAttribute('open');
  await page.locator('.exam-intelligence-topics summary').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.exam-intelligence-topics')).toHaveAttribute('open');
});

test('filtros avançados da matriz cabem no celular e preservam seleção durante atualização',async({page})=>{
  await page.setViewportSize({width:320,height:740});
  await page.goto('/?test=1');
  await expect(page.locator('#testReport')).toBeVisible();
  await page.locator('#testReport').evaluate(element=>element.remove());
  await page.evaluate(()=>{
    const api=window.__EXTRATO_TEST__,state=structuredClone(api.getState()),subject=state.subjects[0],topic=subject.topics[0];
    topic.examTags=['bb-escriturario'];state.examBlueprint.activeExamTags=['bb-escriturario'];
    state.exams=[{id:'hierarchy-exam',institution:'Banco do Brasil',examName:'BB 2023',role:'Escriturário',board:'Cesgranrio',year:2023,date:null,source:'manual',sourceReference:null,coverage:'complete',examTags:['bb-escriturario']}];
    state.examQuestions=[{id:'hierarchy-question',examId:'hierarchy-exam',subjectId:subject.id,topicId:topic.id,questionNumber:1,weight:1,source:'Teste',classification:{method:'manual',confidence:1}}];
    api.setState(state);api.renderAll();
  });
  await activateTab(page,'desempenho');
  await page.locator('[data-performance-section="exam"]').click();
  const advanced=page.locator('.exam-matrix-more-filters');
  await expect(advanced).not.toHaveAttribute('open');
  await expect(page.locator('[data-exam-matrix-filter="scope"]')).toBeVisible();
  await expect(page.locator('[data-exam-matrix-filter="subject"]')).toBeVisible();
  await advanced.locator('summary').focus();
  await page.keyboard.press('Enter');
  await expect(advanced).toHaveAttribute('open');
  await page.locator('[data-exam-matrix-filter="board"]').selectOption('Cesgranrio');
  await expect(advanced).toHaveAttribute('open');
  await expect(advanced.locator('summary')).toContainText('Mais filtros (1)');
  await expect(page.locator('[data-exam-matrix-filter="board"]')).toHaveValue('Cesgranrio');
  for(const width of [320,375,390,430,768]){
    await page.setViewportSize({width,height:800});
    for(const theme of ['light','dark']){
      await page.evaluate(value=>{document.documentElement.dataset.theme=value},theme);
      await expectNoPageOverflow(page);
    }
  }
  await page.setViewportSize({width:375,height:800});
  const accessibility=await new AxeBuilder({page}).include('.exam-intelligence-hub').analyze();
  expect(accessibility.violations).toEqual([]);
  await page.locator('#openExamClassificationReview').click();
  await expect(page.locator('#examClassificationOverlay')).toHaveClass(/show/);
  await expect(page.locator('#examClassificationFilter')).toBeFocused();
});
