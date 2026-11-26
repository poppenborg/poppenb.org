# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Leonard's personal website (poppenb.org): a static site built with Astro 7, TypeScript (strict), and Node 22. `npm run check` is the verification step: Astro's type and template checker, a build, then the Playwright suite in `tests/` (one test per SPEC.md requirement).

## Commands

- `npm run dev`: dev server on http://localhost:4321 (draft posts are visible here).
- `npm run build`: static build into `dist/` (drafts excluded).
- `npm run preview`: serve the built `dist/`.
- `npm run check`: `astro check`, `astro build`, then `playwright test`.
- `npm test`: only the Playwright tests. `scripts/test-server.mjs` builds and serves two previews: real content on :4330 (project `site`) and real content plus `src/fixtures/` on :4331 (project `fixtures`, files named `*.fixtures.spec.ts`). Build logs go to `test-logs/`. `LIVE=1` adds a check of https://poppenb.org.
- `npm run shots`: build, then screenshot every page at 375 px and 1280 px into `shots/`. Fails if a page scrolls sideways. The build log lists every `[TODO]`.
- `npm run shots:fixtures`: the same, with the sample entries in `src/fixtures/` added, so every layout (project, post, footer links) can be checked before real content exists.

## Rules

- Every fact about me comes from `src/content/` and `public/`. Never invent or embellish.
  If something is missing, render a visible "TODO" and tell me.
- `src/content/` is read-only for you (enforced by `.claude/hooks/protect.sh`). Suggest wording changes in chat.
- Follow DESIGN.md for colours, fonts and spacing. Ask before adding new ones.
- Must work at 375 px wide.
- All pages must be set up in way that they are not indexed by search engines

SPEC.md is the approved scope for v1, including what is out of scope and the "done when" checklist.

@SPEC.md
@DESIGN.md
@REFERENCES.md

## Workflow

- After visual changes, run `npm run shots` (and `npm run shots:fixtures` while content is sparse), open the images and compare them
  with DESIGN.md before saying you're done.
- Small commits, one per section.

## Architecture

- Content collections are defined in `src/content.config.ts`: `projects`, `posts` and `site` (the texts `home`, `imprint`, `privacy`). The schemas there are the single source of truth for frontmatter; `src/fixtures/` shows a valid example of each. An entry's id is its file name, so a project lives at `/projects/<file-name>/`.
- Read content only through `src/lib/content.ts` (`getProjects`, `getPosts`, `getSiteText`), never `getCollection` directly. It applies the draft filter (drafts show in `astro dev` only) and newest-first sorting.
- With `FIXTURES=1` the loaders also read `src/fixtures/`, skipping any sample whose id already exists in `src/content/` (real content wins). Never set it for a deploy.
- A missing fact renders through `src/components/Todo.astro`, which also logs `[TODO]` during the build.
- **Hidden posts:** nav, footer and landing only show posts when `getPosts()` is non-empty. `/posts/` is always built.
- **No search engines:** `Base.astro` puts `noindex` on every page, and there is no sitemap or `robots.txt` (a `Disallow` would stop crawlers from seeing the noindex).
- Layouts: `Base.astro` (head, meta tags, header, footer, optional GoatCounter script), `Article.astro` (reading layout for projects and posts), `Legal.astro` (imprint, privacy).
- The landing hook (`src/components/Hook.astro`) is the only client JS. It splits the line into per-character spans, sets a `--p` intensity (0 to 1) on each, and CSS maps that to font weight, optical size (`opsz`, from the size-matched value at rest down to 24) and amber colour. It locks line breaks at the heaviest weight and lowest optical size so nothing re-wraps, and does nothing under `prefers-reduced-motion`.
- Colour and spacing tokens live in `src/styles/global.css` and must match DESIGN.md. Code blocks are not syntax-highlighted on purpose (it would add colours).
- Settings that are not facts about Leonard (domain, GoatCounter code) live in `src/config.ts`. Analytics stay off while the GoatCounter code is empty.
- `site` in `astro.config.mjs` must stay the production URL, because RSS, canonical and Open Graph links are built from it.
- Deploy: `.github/workflows/deploy.yml` builds and publishes to GitHub Pages on every push to `main`. `public/CNAME` sets the custom domain.
- Claude Code config lives in `.claude/`: `settings.json` wires `hooks/protect.sh` (blocks edits under `src/content/`, and under `tests/` while `.claude/tests.lock` exists) and `hooks/run-checks.sh` (on stop, runs `npm run check` while `.claude/tests.lock` exists).
