import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './playwright/tests',
  timeout: 30000,
  use: {
    baseURL: 'http://127.0.0.1:4173',
    headless: true,
  },
  webServer: {
    command: 'node ../node_modules/vite/bin/vite.js --host 127.0.0.1 --port 4173',
    cwd: './frontend',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: true,
    timeout: 120000,
  },
});
