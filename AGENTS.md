<!-- israel-kit -->
<!-- israel-kit templates: 2026-10-17 -->
# Israel Ochoa design system

## Read first (every session)
1. Israel's global kit, start to finish:
   `/Users/israelochoa/Desktop/io-c.design/05_WEB/Getting Hired at Anthropic 🤖/Projects/All-my-global-guidelines/00_START-HERE.md`
2. Then this file, `CLAUDE.md` (the token workflow), `workflow.md`, `stack-and-brand.md`, and the latest entries in `CHANGELOG.md` and `decisions.md`.

## Project facts
- **What it is:** Israel's personal design system (tokens, a Figma plugin that builds the documentation frames) and the Framer portfolio site built on it.
- **Who it's for:** Hiring managers and design leads at Anthropic and other AI-first companies, who decide in seconds whether to look further.
- **Why it exists:** Portfolio piece. The site is how Israel gets hired into AI product design or brand design.
- **Done looks like (v1):** Still open (Oct 17 2026). Israel is user-testing the site and it keeps changing; set the finish line once feedback settles.
- **Type:** Design system + website
- **Status:** Building
- **Case study:** [NEEDS: yes · maybe · no] · tier: [NEEDS]
- **Links:**
  - live: israelochoa.design (the current site, on another platform with domain + hosting through Porkbun, not Framer yet) · Framer staging: sienna-interfaces-909470.framer.app
  - Israel also owns israelochoa.com. io-c.design has lapsed (not renewed).
  - repo: github.com/iochoa15/israel-ochoa-design-system (public)
  - Framer project: framer.com/projects/Israel-Ochoa-Design--T4MU9KJsOdFqQAfuyRnq
  - Figma explorations: file 71RYIBnkaFohQHGeU3MXdN

## Project-specific rules
- **Version every decision.** New ideas go on a new page or a new copy (homepage-N → homepage-N+1). Never overwrite a kept version.
- **Working pages (Oct 17 2026):** /homepage-8 (the working homepage), /homepage-7, /about, /logo-gallery-3. Everything else lives under /archive/ in Framer (kept, not deleted).
- **Token changes** follow the workflow in `CLAUDE.md` (Python for the JSON, keep the Figma plugin in sync).
- **Client logo source files are private.** `web content/` is gitignored and must never be committed (the repo is public).
- **Israel publishes the Framer site himself.** Agents never publish.
- **Framer code components:** the repo copies in `framer/code-components/` must match Framer before every commit.
- Site copy is Israel's own voice (kit `04_my-voice/`): no em-dashes, "10+ years."

## Files in this project
| File | Job |
|---|---|
| `AGENTS.md` | Project facts (this file). Cursor reads it automatically |
| `CLAUDE.md` | Token workflow and Token Studio rules; points Claude Code to this file |
| `workflow.md` | The phases this project follows |
| `stack-and-brand.md` | Tech stack, tools, colors, type, motion |
| `decisions.md` | Log of real choices (case study evidence) |
| `CHANGELOG.md` | Log of changes (case study evidence) |
| `case-study/` | Brief + playbook, created when a case study starts |
