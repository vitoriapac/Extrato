import { test } from '@playwright/test';
import { assertCriticalResponsive } from './helpers/critical-responsive.js';

for (const [width, theme] of [
  [375, 'light'],
  [1440, 'dark'],
])
  test(`matriz visual crítica não transborda em ${width}px no tema ${theme}`, async ({ page }) => {
    test.setTimeout(120_000);
    await assertCriticalResponsive(page, { width, theme });
  });
