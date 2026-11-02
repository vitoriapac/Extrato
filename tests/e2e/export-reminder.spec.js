import { test, expect } from '@playwright/test';

async function openDataManagement(page) {
  await page.locator('#openDataManagementBtn').click();
  await expect(page.locator('#dataManagementOverlay, #dataManagementDialog')).toBeVisible();
}

test('lembrete do backup exportado: nunca, hoje e depois de recarregar (F7)', async ({ page }) => {
  await page.goto('/');
  await openDataManagement(page);
  const status = page.locator('#backupExportStatus');
  await expect(status).toHaveText('Nenhum backup exportado ainda');
  await expect(status).toHaveClass(/is-stale/);
  const download = page.waitForEvent('download');
  await page.locator('#exportBackupBtn').click();
  await download;
  await expect(status).toHaveText('Último backup exportado hoje');
  await expect(status).not.toHaveClass(/is-stale/);
  await page.waitForTimeout(600);
  await page.reload();
  await openDataManagement(page);
  await expect(page.locator('#backupExportStatus')).toHaveText('Último backup exportado hoje');
});

test('backup antigo (schema 29) importado mostra que nenhum arquivo foi exportado (F7)', async ({
  page,
}) => {
  await page.goto('/');
  await openDataManagement(page);
  await page.locator('#importBackupFile').setInputFiles({
    name: 'antigo.json',
    mimeType: 'application/json',
    buffer: Buffer.from(
      JSON.stringify({ schemaVersion: 29, subjects: [], lastBackupAt: '2026-10-01T10:00:00.000Z' })
    ),
  });
  await page.locator('#modalConfirmBtn').click();
  await expect(page.locator('#toast')).toContainText('Backup importado');
  await page.waitForTimeout(600);
  await page.reload();
  await openDataManagement(page);
  await expect(page.locator('#backupExportStatus')).toHaveText('Nenhum backup exportado ainda');
});
