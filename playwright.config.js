import {defineConfig,devices} from '@playwright/test';

export default defineConfig({
  testDir:'./tests/e2e',fullyParallel:false,forbidOnly:!!process.env.CI,
  retries:process.env.CI?1:0,workers:process.env.CI?1:undefined,
  reporter:process.env.CI?'github':'list',
  use:{baseURL:'http://127.0.0.1:4173',screenshot:'only-on-failure',trace:'on-first-retry',video:'retain-on-failure'},
  webServer:{command:'npm run serve',url:'http://127.0.0.1:4173',reuseExistingServer:!process.env.CI,timeout:30_000},
  projects:[{name:'chromium',use:{...devices['Desktop Chrome']}}]
});
