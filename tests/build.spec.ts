/**
 * SPEC.md "Done when": `npm run build` succeeds with no warnings except the
 * expected empty-posts notice. Reads the log of the build the tests ran on
 * (written by scripts/test-server.mjs).
 */
import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';

const EXPECTED = [
  /No files found matching "src\/content\/posts\//,
  /The collection "posts" does not exist or is empty/,
];

test('the production build has no warnings except the empty-posts notice', () => {
  const log = readFileSync('test-logs/build-site.log', 'utf8').replace(/\x1b\[[0-9;]*m/g, '');
  const warnings = log
    .split(/\r?\n|(?=\d\d:\d\d:\d\d \[WARN\])/)
    .filter((l) => /\[WARN\]|\[TODO\]|warning/i.test(l))
    .filter((l) => !EXPECTED.some((re) => re.test(l)))
    .map((l) => l.trim());
  expect([...new Set(warnings)]).toEqual([]);
});
