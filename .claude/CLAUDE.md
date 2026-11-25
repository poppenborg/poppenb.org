# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Leonard's personal website (poppenb.org): a static site built with Astro 7, TypeScript (strict), and Node 22. There is no test suite; `npm run check` (Astro's type and template checker) plus a clean `npm run build` are the verification steps.

## Commands

- `npm run dev`: dev server on http://localhost:4321 (draft posts are visible here).
- `npm run build`: static build into `dist/` (drafts excluded). Also writes `sitemap-index.xml` once pages exist.
- `npm run preview`: serve the built `dist/`.
- `npm run check`: type-check `.ts` and `.astro` files.

## Rules

- Every fact about me comes from `content/` and `public/`. Never invent or embellish.
  If something is missing, render a visible "TODO" and tell me.
- `content/` is read-only for you (enforced by `.claude/hooks/protect.sh`). Suggest wording changes in chat.
- Follow DESIGN.md for colours, fonts and spacing. Ask before adding new ones.
- Must work at 375 px wide.

@DESIGN.md
@REFERENCES.md

## Workflow

- After visual changes, run `npm run shots`, open the images and compare them
  with DESIGN.md before saying you're done. (The `shots` script and Playwright are not set up yet.)
- Small commits, one per section.

## Architecture

- Posts are Markdown in `content/posts/`, loaded as the `posts` content collection defined in `src/content.config.ts`. The frontmatter schema there (`title`, `description`, `pubDate`, `topics`, `draft`) is the single source of truth; add fields there first.
- Always read posts through `getPosts()` in `src/posts.ts`, never `getCollection` directly. It applies the draft filter and newest-first sort.
- `site` in `astro.config.mjs` must stay the production URL, because the sitemap (and any RSS feed) builds links from it.
- There are no pages yet (`src/pages/` is empty). The first design draft should introduce a shared layout in `src/layouts/` for the `<head>` markup.
- Claude Code config lives in `.claude/`: `settings.json` wires `hooks/protect.sh` (blocks edits under `content/`, and under `tests/` while `.claude/tests.lock` exists) and `hooks/run-checks.sh` (on stop, runs `npm run check` while `.claude/tests.lock` exists).
