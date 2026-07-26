import { defineConfig, devices } from '@playwright/test';

const backendUrl = 'http://localhost:8000';
const appUrl = 'http://localhost:4200';

export default defineConfig({
  testDir: './tests',
  workers: 1,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['list']] : [['list']],

  use: {
    baseURL: appUrl,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',

    launchOptions: {
      executablePath: process.env.CHROME_BIN || undefined,
    },
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: [
    {
      command:
        'touch database/smoke.sqlite && php artisan migrate --force --no-interaction && php artisan serve --port=8000',
      cwd: '../backend',
      url: `${backendUrl}/up`,
      env: {
        APP_ENV: 'local',
        DB_CONNECTION: 'sqlite',
        DB_DATABASE: 'database/smoke.sqlite',
      },
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
      stdout: 'ignore',
      stderr: 'pipe',
    },
    {
      command: 'npm start -- --port 4200',
      cwd: '../frontend',
      url: appUrl,
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
      stdout: 'ignore',
      stderr: 'pipe',
    },
  ],
});
