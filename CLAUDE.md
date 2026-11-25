# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Status

This repository is Leonard's personal website (poppenb.org). As of this file's creation it holds no code: no framework, build tooling, or tests have been chosen yet. When a stack is set up, replace this section with the real build, dev-server, lint, and test commands, and describe the architecture.

## Design direction

Visual inspiration is Felix Rieseberg's blog, for example https://felixrieseberg.com/hunger-beats-tenure-advice-for-junior-engineers/ (a Ghost site). Take its feel and structure, not its code, copy, or assets. What is known about it:

- A single, reading-focused text column. The header is the site name linking home, plus a short nav (About, Work, Posts, Online).
- The post header has a back link ("◂ Posts"), the title, and a metadata block with small uppercase, letter-spaced labels (Published, Reading time, Topics) above the values, shown inline as `27 October 2026 · topic · 5 MIN`.
- Optional full-width hero image, then prose with H2 section headings.
- Posts close with a centered `— END —` marker, then a short author block (photo, bio, social links), a subscribe card, and a "Latest posts" list (`13 Oct 2026` date format with linked titles).
- Its distinctive touch is a print-ephemera, "typeset" aesthetic: tracked uppercase micro-labels, and a subscribe box styled as a postcard ("Reply card", "No stamp needed"). Offer RSS as an alternative to email.
- The footer repeats the nav.

Exact fonts, colors, and dark-mode behaviour of the reference were not captured. Decide them deliberately for this site and record the chosen design tokens here once they exist.
