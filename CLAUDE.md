# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Leonard's personal website (poppenb.org): a static site built with Astro 7, TypeScript (strict), and Node 22. There is no test suite; `npm run check` (Astro's type and template checker) plus a clean `npm run build` are the verification steps.

## Commands

- `npm run dev`: dev server on http://localhost:4321 (draft posts are visible here).
- `npm run build`: static build into `dist/` (drafts excluded). Also writes `sitemap-index.xml` and `rss.xml`.
- `npm run preview`: serve the built `dist/`.
- `npm run check`: type-check `.ts` and `.astro` files.

## Architecture

- Posts are Markdown in `src/content/posts/`, loaded as the `posts` content collection defined in `src/content.config.ts`. The frontmatter schema there (`title`, `description`, `pubDate`, `topics`, `draft`) is the single source of truth; add fields there first.
- Always read posts through `getPosts()` in `src/posts.ts`, never `getCollection` directly. It applies the draft filter and newest-first sort that the index, post pages, and RSS feed all rely on.
- A post's URL is `/posts/<id>/`, where `id` is the Markdown filename without its extension. `src/pages/posts/[id].astro` renders it.
- `site` in `astro.config.mjs` must stay the production URL, because the sitemap and RSS links are built from it.
- The pages are unstyled placeholders. No layout component, styles, or design tokens exist yet; the first design draft should introduce a shared layout in `src/layouts/` and move the duplicated `<head>` markup into it.

## Design direction

Visual inspiration is Felix Rieseberg's blog, for example https://felixrieseberg.com/hunger-beats-tenure-advice-for-junior-engineers/ (a Ghost site). Take its feel and structure, not its code, copy, or assets. What is known about it:

- A single, reading-focused text column. The header is the site name linking home, plus a short nav (About, Work, Posts, Online).
- The post header has a back link ("◂ Posts"), the title, and a metadata block with small uppercase, letter-spaced labels (Published, Reading time, Topics) above the values, shown inline as `27 October 2026 · topic · 5 MIN`.
- Optional full-width hero image, then prose with H2 section headings.
- Posts close with a centered `— END —` marker, then a short author block (photo, bio, social links), a subscribe card, and a "Latest posts" list (`13 Oct 2026` date format with linked titles).
- Its distinctive touch is a print-ephemera, "typeset" aesthetic: tracked uppercase micro-labels, and a subscribe box styled as a postcard ("Reply card", "No stamp needed"). Offer RSS as an alternative to email.
- The footer repeats the nav.

Exact fonts, colors, and dark-mode behaviour of the reference were not captured. Decide them deliberately for this site and record the chosen design tokens here once they exist.
