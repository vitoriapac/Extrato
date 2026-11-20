import { test, expect } from '@playwright/test';
import { openDemo, activateTab } from './helpers.js';

test('Agenda: criar atividade, alternar visão Semana e concluir em Hoje sem gerar horas fictícias', async ({
  page,
}) => {
  await openDemo(page);

  const getSessionsCount = () =>
    page.evaluate(() => {
      const raw = localStorage.getItem('bb-premium-study-demo');
      return raw ? (JSON.parse(raw).studySessions || []).length : 0;
    });

  const initialSessionsCount = await getSessionsCount();

  await activateTab(page, 'agenda');
  await expect(page.locator('#panel-agenda')).toBeVisible();

  // Abre modal de nova atividade pelo botão principal
  await page.locator('#addCalRowBtn').click();
  const modal = page.locator('#calendarActivityModal');
  await expect(modal).toBeVisible();

  await page.locator('#calActivityTitle').fill('Redação sobre tecnologia');
  await page.locator('#calActivityKind').selectOption('essay');
  await page.locator('#calEssayTheme').fill('Ética e IA no setor público');
  await page.locator('#calEssayScore').fill('920');
  await page.locator('#calEssayMaxScore').fill('1000');
  await modal.getByRole('button', { name: /Mais detalhes/i }).click();
  await page.locator('#calActivityStart').fill('14:00');
  await modal.getByRole('button', { name: 'Adicionar atividade', exact: true }).click();
  await expect(modal).toBeHidden();

  // Confirma exibição na aba Agenda (drawer do dia + evolução de redações + visão Semana)
  await expect(page.locator('#calendarDayDrawerMount')).toContainText('Redação sobre tecnologia');
  await expect(page.locator('#calendarDayDrawerMount')).toContainText('920/1000');
  await expect(page.locator('#essayEvolutionCard')).toContainText('Redação sobre tecnologia');
  await expect(page.locator('#essayEvolutionCard')).toContainText('920/1000 (92%)');
  await page.locator('[data-calendar-view="week"]').click();
  await expect(page.locator('#calendarWeekCard')).toContainText('Redação sobre tecnologia');
  await expect(page.locator('#calendarWeekCard')).toContainText('14:00');

  // Navega para Hoje e confirma sincronização sem duplicidade
  await activateTab(page, 'hoje');
  const hojeList = page.locator('#hojeTarefasHoje');
  await expect(hojeList).toContainText('Redação sobre tecnologia');
  await expect(hojeList).toContainText('14:00');
  await expect(hojeList).toContainText('Redação');

  // Conclui a tarefa em Hoje e garante que nenhuma sessão de estudo fictícia foi criada
  await hojeList.getByRole('button', { name: 'Concluir tarefa' }).first().click();
  await expect(hojeList).not.toContainText('Redação sobre tecnologia');

  const finalSessionsCount = await getSessionsCount();
  expect(finalSessionsCount).toBe(initialSessionsCount);
});

test('Agenda e Hoje: aviso proativo de sobrecarga ao cadastrar simulado e exibição única em Hoje', async ({
  page,
}) => {
  await openDemo(page);

  await activateTab(page, 'agenda');
  await page.locator('#addCalRowBtn').click();
  const modal = page.locator('#calendarActivityModal');
  await expect(modal).toBeVisible();

  await page.locator('#calActivityTitle').fill('Simulado Nacional Completo');
  await page.locator('#calActivityKind').selectOption('mock_exam');
  await modal.getByRole('button', { name: /Mais detalhes/i }).click();
  await page.locator('#calActivityMinutes').fill('480');

  // Aviso proativo de sobrecarga não bloqueante aparece no modal
  await expect(modal.getByRole('status')).toContainText(/disponibilidade configurada/i);

  await modal.getByRole('button', { name: 'Adicionar atividade', exact: true }).click();
  await expect(modal).toBeHidden();

  // Em Hoje, aparece em Simulados planejados (com ação contextual) e não duplica em Eventos do calendário
  await activateTab(page, 'hoje');
  await expect(page.locator('#hojeSimuladosPlanejados')).toContainText('Simulado Nacional Completo');
  await expect(page.locator('#hojeSimuladosPlanejados')).toContainText('Registrar resultado');
  await expect(page.locator('#hojeTarefasHoje')).not.toContainText('Simulado Nacional Completo');

  // Fluxo completo: Registrar resultado a partir de Hoje -> preencher e salvar -> diagnóstico automático -> concluído em Hoje
  await page.locator('#hojeSimuladosPlanejados [data-today-sim-register]').first().click();
  await expect(page.locator('#panel-questoes')).toBeVisible();

  const totalInput = page.locator('[data-delegated-input*="updateSimulationDraft(\'total\'"]');
  const correctInput = page.locator('[data-delegated-input*="updateSimulationDraft(\'correct\'"]');
  await totalInput.fill('80');
  await correctInput.fill('64');
  await page.locator('[data-delegated-click="saveSimulationEdit()"]').click();

  // Modal de Raio-X / Remediação abre automaticamente após salvar simulado vinculado
  const remediationModal = page.locator('#simulatedRemediationMount dialog[open]');
  await expect(remediationModal).toBeVisible();
  await remediationModal.getByRole('button', { name: /Fechar/i }).first().click();

  // Volta para Hoje: simulado concluído não aparece mais como pendente
  await activateTab(page, 'hoje');
  await expect(page.locator('#hojeSimuladosPlanejados')).not.toContainText('Simulado Nacional Completo');
});

test('Experiente: consultar Ficha Inteligente do Tópico em Disciplinas e validar ciclo flexível em Hoje', async ({
  page,
}) => {
  await openDemo(page);
  await activateTab(page, 'hoje');

  // Em Hoje, alterna entre Ciclo (Sequência) e Agenda preservando o painel
  await expect(page.locator('#planoHojeContent')).toBeVisible();
  const agendaModeBtn = page.locator('#executionAgendaBtn');
  if (await agendaModeBtn.isVisible()) {
    await agendaModeBtn.click();
    await expect(agendaModeBtn).toHaveAttribute('aria-pressed', 'true');
  }

  // Navega para Disciplinas e abre a Ficha Inteligente do primeiro tópico
  await activateTab(page, 'disciplinas');
  await expect(page.locator('#panel-disciplinas')).toBeVisible();
  const fichaBtn = page.locator('#verticalizedSyllabusMount button[aria-label*="Ficha Inteligente"]').first();
  if (await fichaBtn.isVisible()) {
    await fichaBtn.click();
    const topicModal = page.locator('#topicIntelligenceModal');
    await expect(topicModal).toBeVisible();
    await expect(topicModal).toContainText(/Continuidade do estudo/i);
    await topicModal.getByRole('button', { name: 'Fechar', exact: true }).click();
    await expect(topicModal).toBeHidden();
  }
});
