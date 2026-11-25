/**
 * SPEC.md: "Every missing fact shows a visible TODO, and the TODOs are listed
 * to Leonard." This test is that list: it fails while any TODO is visible on
 * the real site, and its error message names each one with its page.
 */
import { expect, test } from '@playwright/test';
import { builtPages, open, visibleTodos } from './support/site';

test('no missing facts: no visible TODO on any page', async ({ page }) => {
  const todos: string[] = [];
  for (const path of builtPages('site')) {
    await open(page, path);
    for (const t of await visibleTodos(page)) todos.push(`${path}  ${t}`);
  }
  expect(todos, `Missing facts (${todos.length}):\n  ${todos.join('\n  ')}\n`).toEqual([]);
});
