## Design direction

- A single, reading-focused text column. The header is the site name linking home, plus a short nav (About, Work, Posts, Online).
- The post header has a back link ("◂ Posts"), the title, and a metadata block with small uppercase, letter-spaced labels (Published, Reading time, Topics) above the values, shown inline as `27 October 2026 · topic · 5 MIN`.
- Optional full-width hero image, then prose with H2 section headings.
- Posts close with a centered `— END —` marker, then a short author block (photo, bio, social links), a subscribe card, and a "Latest posts" list (`13 Oct 2026` date format with linked titles).
- Its distinctive touch is a print-ephemera, "typeset" aesthetic: tracked uppercase micro-labels, and a subscribe box styled as a postcard ("Reply card", "No stamp needed"). Offer RSS as an alternative to email.
- The footer repeats the nav.

The list above describes the reference site. Where it conflicts with SPEC.md (for example the subscribe card or the About/Work nav), SPEC.md wins.

## Tokens (approved 2026-11-25)

**Fonts** (both self-hosted):
- **VT323** (`--font-display`, approved by Leonard 2026-11-25): headings (h1, h2, h3, section headings) and navigation (site name, header nav, footer nav). It has a single weight (400), so it is never bolded, and it is set in sentence case without tracking, roughly 1.3x the size Literata would use.
- **Literata**, variable (`wght` and `opsz` axes; `--font`): body text, the landing hook (which needs the variable axes), list titles and labels. Labels are small, uppercase, letter-spaced Literata.
- Code uses the system monospace stack (approved by Leonard 2026-11-25; no web font is loaded for it).

**Theme:** dark only (`color-scheme: dark`). No light mode, no toggle.

| Token | Hex | Use | Contrast on `--bg` |
| --- | --- | --- | --- |
| `--bg` | `#14130F` | page background (warm near-black) | |
| `--surface` | `#1C1A16` | cards, code blocks | |
| `--text` | `#ECE6D9` | body text (warm paper) | 14.9:1 |
| `--muted` | `#A8A091` | metadata, labels | 7.2:1 |
| `--faint` | `#7A7366` | decorative only, never text | 4.0:1 |
| `--rule` | `#34302A` | hairlines, borders | |
| `--accent` | `#E8A25A` | links, focus ring, hook highlight (amber) | 8.6:1 |

**Landing illustration** (requested by Leonard 2026-11-26): the corner-grid tiles behind the hook use `--rule`, mixed with up to 25% `--accent` while the hook swells (no new colour token). Square, right-aligned in the column, `min(100%, 27rem)` wide, top-aligned with the hero. No caption, no frame.

**Layout:** one reading column of about 66 characters, works from 375 px wide.
