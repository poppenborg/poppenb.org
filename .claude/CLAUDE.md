# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Leonard's personal website (poppenb.org): a static site built with Astro 7, TypeScript (strict), and Node 22. There is no test suite; `npm run check` (Astro's type and template checker) plus a clean `npm run build` are the verification steps.

## Commands

- `npm run dev`: dev server on http://localhost:4321 (draft posts are visible here).
- `npm run build`: static build into `dist/` (drafts excluded). Also writes `sitemap-index.xml` and `rss.xml`.
- `npm run preview`: serve the built `dist/`.
- `npm run check`: type-check `.ts` and `.astro` files.

## Rules
- Every fact about me comes from content/ and public/. Never invent or embellish.
  If something is missing, render a visible "TODO" and tell me.
- content/ is read-only for you. Suggest wording changes in chat.
- Follow DESIGN.md for colours, fonts and spacing. Ask before adding new ones.
- Inspiration can be found in REFERENCES.md
- Must work at 375 px wide.4

## Workflow
- After visual changes, run `npm run shots`, open the images and compare them
  with DESIGN.md before saying you're done.
- Small commits, one per section.

## Architecture

- Posts are Markdown in `src/content/posts/`, loaded as the `posts` content collection defined in `src/content.config.ts`. The frontmatter schema there (`title`, `description`, `pubDate`, `topics`, `draft`) is the single source of truth; add fields there first.
- Always read posts through `getPosts()` in `src/posts.ts`, never `getCollection` directly. It applies the draft filter and newest-first sort that the index, post pages, and RSS feed all rely on.
- A post's URL is `/posts/<id>/`, where `id` is the Markdown filename without its extension. `src/pages/posts/[id].astro` renders it.
- `site` in `astro.config.mjs` must stay the production URL, because the sitemap and RSS links are built from it.
- The pages are unstyled placeholders. No layout component, styles, or design tokens exist yet; the first design draft should introduce a shared layout in `src/layouts/` and move the duplicated `<head>` markup into it.
- Projects are in 
