// Playwright's web server: builds the site twice and serves both production
// previews, so the tests run against what would be deployed.
//   :4330  site: real content (src/content/)          -> dist/
//   :4331  fixtures: real content plus src/fixtures/       -> dist-fixtures/
// Each build log is saved to test-logs/ so tests can check its warnings.
import { spawn, spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';

export const SERVERS = [
  { name: 'site', port: 4330, outDir: 'dist', env: {} },
  { name: 'fixtures', port: 4331, outDir: 'dist-fixtures', env: { FIXTURES: '1' } },
];

mkdirSync('test-logs', { recursive: true });
// Previews run in this script's process group, which Playwright ends as a whole
// when the tests finish. `exit` covers being stopped by a signal we can catch.
const children = [];
process.on('exit', () => children.forEach((c) => c.kill()));
for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, () => process.exit(0));
const astro = 'node_modules/.bin/astro';

for (const s of SERVERS) {
  const env = { ...process.env, ...s.env, OUT_DIR: s.outDir };
  const build = spawnSync(astro, ['build'], { env, encoding: 'utf8' });
  const log = (build.stdout ?? '') + (build.stderr ?? '');
  writeFileSync(`test-logs/build-${s.name}.log`, log);
  process.stdout.write(`[test-server] ${s.name} build exited ${build.status}\n`);
  if (build.status !== 0) {
    process.stdout.write(log);
    process.exit(build.status ?? 1);
  }
}

// Started in reverse, so the site server (the one Playwright waits for) comes up last.
for (const s of [...SERVERS].reverse()) {
  const env = { ...process.env, ...s.env, OUT_DIR: s.outDir };
  const child = spawn(astro, ['preview', '--port', String(s.port), '--ignore-lock'], { env, stdio: 'ignore' });
  children.push(child);
  for (let i = 0; ; i++) {
    try {
      await fetch(`http://localhost:${s.port}/`);
      break;
    } catch {
      if (i > 200) throw new Error(`${s.name} preview did not start`);
      await new Promise((r) => setTimeout(r, 100));
    }
  }
  process.stdout.write(`[test-server] ${s.name} on http://localhost:${s.port}\n`);
}

// Stay alive until Playwright stops us.
setInterval(() => {}, 1 << 30);
