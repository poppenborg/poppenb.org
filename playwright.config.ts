import { defineConfig, devices } from '@playwright/test';

/**
 * One test file per area of .claude/SPEC.md. Two projects:
 *  - "site":     the production build of the real content (src/content/).
 *                This is what deploys, so every spec requirement is checked here.
 *  - "fixtures": the same build plus src/fixtures/, for machinery that only
 *                shows with content (published posts, project pages, the hook).
 * scripts/test-server.mjs builds both and serves them with `astro preview`.
 */
export default defineConfig({
  testDir: 'tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  reporter: [['list'], ['html', { open: 'never' }]],
  timeout: 60_000,
  use: {
    ...devices['Desktop Chrome'],
    trace: 'off',
  },
  webServer: {
    command: 'node scripts/test-server.mjs',
    url: 'http://localhost:4330/',
    reuseExistingServer: false,
    timeout: 240_000,
    stdout: 'pipe',
  },
  projects: [
    {
      name: 'site',
      testIgnore: /\.fixtures\.spec\.ts$/,
      use: { baseURL: 'http://localhost:4330' },
    },
    {
      name: 'fixtures',
      testMatch: /\.fixtures\.spec\.ts$/,
      use: { baseURL: 'http://localhost:4331' },
    },
  ],
});
