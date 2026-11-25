# poppenb.org: site spec (v1)

Status: draft for Leonard's review, 2026-11-25. Nothing is built until Leonard approves it.

## Purpose

A personal site for a professional audience, mainly other engineers. It shows Leonard's free-time projects as short, well-written stories. The voice is factual, clear and concise, with some humor and an essay-like, story-driven style. The site should leave readers wanting to look at a project, and ideally inspired to get in touch.

## Audience and goals

- **Primary reader:** engineers and other professionals arriving from a link, GitHub or LinkedIn.
- **Primary action:** open a project and read its story.
- **Ideal outcome:** the reader gets in touch. Comments come later. For v1 the contact route is the social and email links in the footer.
- **Language:** English only.

## Structure (v1)

| Page | URL | Notes |
| --- | --- | --- |
| Landing | `/` | Visual hook, then a short intro, then the latest projects (and latest posts once any are published). |
| Projects index | `/projects/` | All projects, newest first. |
| Project | `/projects/<id>/` | One project's story. |
| Posts index | `/posts/` | Built but hidden (see below). |
| Post | `/posts/<id>/` | Same reading layout as a project. |
| Imprint | `/imprint/` | Legally required (Germany). Linked from the footer. |
| Privacy | `/privacy/` | Legally required. Linked from the footer. |
| 404 | `/404.html` | Short, on-voice, links home. |

The nav is the site name (links home), then Projects, plus Posts once a post is published. The footer repeats the nav and adds Imprint, Privacy, RSS and Leonard's social and email links.

### Landing page
1. **Visual hook: one subtle interactive element.** Proposal: a large typographic line set in Literata. Literata is a variable font, so the line's weight and optical size respond gently to the pointer on desktop and to scroll on touch screens. It sits still under `prefers-reduced-motion`. No canvas and no animation library; it must not make the page slower to show content. The line's text comes from content.
2. A short intro of two or three sentences, from content.
3. The latest three projects: title, one-line summary, year, and status.
4. The latest posts appear only when at least one is published.

### Projects
- Each project has its own page with a story written as an essay, in Markdown.
- Header facts: title, year, status (for example `live`, `archived`, `in progress`), and the stack (optional). An optional cover image and links (code, demo).
- Ordered newest first, by year then by date.

### Posts
- The machinery is fully built (collection, index, post page, RSS) so a spontaneous post can go live by adding one Markdown file.
- **Hidden rule:** while no non-draft post exists, `/posts/` is not linked anywhere, isn't in the sitemap, and the landing page shows no posts section. Drafts never appear in a production build.
- The post layout follows DESIGN.md: a "◂ Posts" back link, a tracked uppercase metadata block (Published, Reading time, Topics), a centered `— END —`, and then "Latest posts".

## Content model

All content lives in `src/content/` and is read-only for Claude (the `protect.sh` hook is updated to guard `src/content/` instead of `content/`). Images live in `public/` or next to their entry.

- `src/content/projects/*.md`: `title`, `summary`, `year`, `status`, `stack?`, `cover?`, `links?` (`code`, `demo`), `draft`.
- `src/content/posts/*.md`: `title`, `description?`, `pubDate`, `topics`, `draft` (already defined).
- `src/content/site/`: the landing hook line, the intro, social and email links, and the imprint and privacy texts.

Any missing fact renders as a visible `TODO` and is reported. Claude never writes imprint or privacy wording. Leonard supplies it, ideally from a German generator such as e-recht24.

## Design

- **Font:** Literata (variable, self-hosted via Fontsource, no Google Fonts request, so nothing in the privacy policy). Used for everything. Labels use tracked uppercase small sizes of the same family. Adding a second font needs Leonard's OK.
- **Theme: dark only.** No light mode and no toggle. `color-scheme: dark`.
- **Proposed colour tokens** (contrast against the background in brackets):

| Token | Hex | Use |
| --- | --- | --- |
| `--bg` | `#14130F` | page background, a warm near-black |
| `--surface` | `#1C1A16` | cards, code blocks |
| `--text` | `#ECE6D9` | body text, warm paper (14.9:1) |
| `--muted` | `#A8A091` | metadata, labels (7.2:1) |
| `--faint` | `#7A7366` | decorative only, never body text (4.0:1) |
| `--rule` | `#34302A` | hairlines and borders |
| `--accent` | `#E8A25A` | links, focus ring and the hook's highlight, a lamplight amber (8.6:1) |

- **Layout:** a single reading column of about 66 characters, generous line height, and works from 375 px wide upwards.
- Once approved, these tokens move into DESIGN.md as the source of truth.

## Technical

- Astro 7 static build, TypeScript strict. No client framework. A small amount of plain JS only for the hook.
- **Hosting (recommendation):** GitHub Pages, deployed by a GitHub Actions workflow on push to `main`, with poppenb.org as a custom domain over HTTPS. It's free, the code is already on GitHub, and there are no extra accounts. The alternative is Cloudflare Pages, which is faster worldwide but needs a Cloudflare account and DNS changes.
- **Analytics (recommendation):** GoatCounter (free for personal use, cookieless, no consent banner needed). Plausible (EU-hosted, paid) is the alternative. It must be disclosed on the privacy page.
- RSS at `/rss.xml` (posts and projects) and a sitemap.
- Each page has a title, description and Open Graph tags. The cover image is used for social cards when present.
- `npm run shots`: Playwright screenshots of every page at 375 px and 1280 px, saved to `shots/` (git-ignored).

## Out of scope for v1

- Comments of any kind (Giscus or similar comes later).
- A newsletter or email signup, including the postcard subscribe card.
- A light mode or theme toggle.
- An About page, CV, or "Work" section beyond projects.
- Topic or tag pages, search, and pagination.
- Featured or hand-ordered projects.
- Languages other than English.
- A CMS or any editor UI. Content is Markdown in git.
- Third-party embeds, cookies, or a consent banner.

## Done when

- [ ] `npm run check` reports 0 errors and `npm run build` succeeds with no warnings except the expected empty-posts notice.
- [ ] Landing, projects index, at least one project page, imprint, privacy and 404 render. Every missing fact shows a visible `TODO`, and the TODOs are listed to Leonard.
- [ ] With zero published posts, no link to `/posts/` exists anywhere and the sitemap omits it. Adding one non-draft post makes the nav link, landing section and RSS entry appear without other changes.
- [ ] `npm run shots` captures every page at 375 px and 1280 px, with no horizontal scroll and nothing clipped at 375 px. Screenshots are checked against DESIGN.md.
- [ ] All text meets WCAG AA contrast, every interactive element has a visible focus style, and the hook is still under `prefers-reduced-motion`.
- [ ] No request leaves poppenb.org except the analytics script (fonts are self-hosted).
- [ ] Lighthouse on the landing page scores at least 95 for performance and 100 for accessibility.
- [ ] The site deploys from `main` to https://poppenb.org.

## Open questions

1. Is the variable-font hook what you meant by an interactive element? If you had another idea, describe it.
2. Is the amber accent right, or would you like a different colour?
3. GitHub Pages and GoatCounter: are those OK?
4. There's no `main` branch yet. Should this branch become `main` once the spec is approved?
