import { test, expect } from '@playwright/test';
import { activateTab, openDemo, openExamImport } from './helpers.js';

const viewports = [
  { name: 'mobile-375', width: 375, height: 812 },
  { name: 'desktop-1366', width: 1366, height: 768 },
  { name: 'desktop-1440', width: 1440, height: 900 },
  { name: 'desktop-1920', width: 1920, height: 1080 },
];
const screenshotOptions = { animations: 'disabled', caret: 'hide', maxDiffPixelRatio: 0.08 };
const screenshotName = name => name.replace(/\.png$/, `-${process.platform}.png`);

async function openStableDemo(page, viewport) {
  await page.clock.install({ time: new Date('2026-09-10T12:00:00-03:00') });
  await page.setViewportSize({ width: viewport.width, height: viewport.height });
  await openDemo(page);
  await page.evaluate(() => document.fonts.ready);
}

for (const viewport of viewports) {
  test(`regressão visual do hero e leitura do fechamento em ${viewport.width}px`, async ({
    page,
  }) => {
    await openStableDemo(page, viewport);
    await expect(page.locator('.statement')).toHaveScreenshot(
      screenshotName(`hero-${viewport.name}.png`),
      screenshotOptions
    );
    await expect(page.locator('#weeklyCloseDashboard .weekly-strategic-focus')).toContainText(
      'Foco estratégico da semana'
    );
    const close = page.locator('#weeklyCloseDashboard');
    await expect(close.locator('.weekly-next')).toContainText('Próxima semana');
    await expect(close.locator('.weekly-decision-summary')).toContainText('Decisão sugerida');
    await expect(close.locator('.weekly-next')).not.toContainText('Próxima ação');
    // Três atos em ordem: a semana, o retrato, a decisão sobre a próxima semana.
    const acts = await close.evaluate(element =>
      [...element.children].map(child => child.querySelector('h4')?.textContent)
    );
    expect(acts).toEqual(['A semana', 'O retrato', 'A decisão']);
    // A semana mostra os três números; a análise completa fica num único disclosure, na ordem de antes.
    const week = await close.evaluate(element =>
      [...element.children[0].children].map(child => child.className)
    );
    expect(week.indexOf('weekly-kpis')).toBeLessThan(
      week.indexOf('weekly-close-analysis editorial-disclosure')
    );
    const analysis = await close.evaluate(element =>
      [...element.querySelector('.weekly-close-analysis').children].map(child => child.className)
    );
    expect(analysis.indexOf('weekly-assessment')).toBeLessThan(
      analysis.indexOf('weekly-strategic-focus')
    );
    // O histórico de foco saiu do fechamento e vive na seção Histórico.
    await expect(close.locator('.weekly-focus-history')).toHaveCount(0);
    await expect(page.locator('#weeklyCloseHistoryDashboard .weekly-focus-history')).toHaveCount(1);
    await expect(close.locator('.weekly-close-act').nth(2).locator('.weekly-next')).toHaveCount(1);
    const bounds = await close.evaluate(element => ({
      right: element.getBoundingClientRect().right,
      viewport: innerWidth,
    }));
    expect(bounds.right).toBeLessThanOrEqual(bounds.viewport + 1);
  });
}

test('regressão visual dos componentes críticos em desktop', async ({ page }) => {
  await openStableDemo(page, { width: 1440, height: 900 });
  await page.locator('.demo-banner').evaluate(element => (element.hidden = true));
  await page.evaluate(() => scrollTo(0, 600));
  await expect(page.locator('.sticky-shell')).toHaveClass(/is-compact/);
  await expect(page.locator('.compact-header')).toHaveScreenshot(
    'cabecalho-compacto-desktop.png',
    screenshotOptions
  );
  await page.evaluate(() => scrollTo(0, 0));
  await page.evaluate(() => {
    for (const [id, height] of [
      ['studySessionsCard', '650px'],
      ['badgesGrid', '520px'],
      ['subjectErrorProfile', '280px'],
      ['examBlueprintConfig', '820px'],
    ]) {
      const element = document.getElementById(id);
      if (element) {
        element.style.height = height;
        element.style.overflow = 'hidden';
      }
    }
  });
  await expect(page.locator('#studySessionsCard')).toHaveScreenshot(
    'historico-sessoes-desktop.png',
    screenshotOptions
  );
  await expect(page.locator('#badgesGrid')).toHaveScreenshot(
    'conquistas-desktop.png',
    screenshotOptions
  );
  await activateTab(page, 'questoes');
  await page.locator('#topicPerformanceCard > summary').click();
  await expect(page.locator('#subjectErrorProfile')).toHaveScreenshot(
    'erros-categorizados-desktop.png',
    screenshotOptions
  );
  await activateTab(page, 'metas');
  await expect(page.locator('#examBlueprintConfig')).toHaveScreenshot(
    'configuracao-estrategica-desktop.png',
    screenshotOptions
  );
});

test('regressão visual do assistente de edital inteligente', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await activateTab(page, 'disciplinas');
  await openExamImport(page);
  await page.getByRole('button', { name: 'Continuar' }).click();
  await page.evaluate(() => document.fonts.ready);
  await expect(page.locator('.exam-import-box')).toHaveScreenshot(
    'edital-inteligente-desktop.png',
    screenshotOptions
  );
});
