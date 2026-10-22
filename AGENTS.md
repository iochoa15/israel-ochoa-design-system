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

## Lanes (Orca worktrees, since Oct 22 2026)
Three copies of this repo, each with its own branch and job. Check `git branch --show-current` to know which lane you are in, and stay in its job.

| Lane | Branch | Folder | Job |
|---|---|---|---|
| Framer | `main` | the original folder on the Desktop | Talking to Framer and building approved designs on the site |
| Design system | `design-system` | `~/orca/workspaces/israel-ochoa-design-system/ruffe` | Tokens, the Figma plugin, and designing the website pages in Figma (account iochoa15@gmail.com, file "IO website 2026"); guides Israel toward a good design |
| Copy | `Copywriting` | `~/orca/workspaces/israel-ochoa-design-system/mizuchi` | Website content and copy in Israel's voice (kit `04_my-voice/`: `my-voice.md` + `humanizer`, facts from `03_about-me.md`) |

- **Handoffs:** the copy lane saves finished copy in `documents/copy/` (one file per page). The design-system lane reads it from there to design pages; the Framer lane builds what's approved. Lanes can read each other's folders on disk; nothing is shared through git until a branch is merged into `main`.
- **Case studies:** Israel's other project folders feed the design-system lane, which turns them into case study pages (the handoff gets written down with the first case study).
- **Merging:** merge a lane into `main` and push only when Israel asks. On conflicts in the shared logs (`CHANGELOG.md`, `decisions.md`, this file), keep both sides' entries.
- The lanes leave out `3d/` (saved on GitHub; `git sparse-checkout add 3d` brings it back). The plugin folder's name ends with a space (`figma auto frame tool `).

## Project-specific rules
- **Version every decision.** New ideas go on a new page or a new copy (homepage-N → homepage-N+1). Never overwrite a kept version.
- **Working pages (Oct 19 2026):** / (the official homepage: the page built as /homepage-11, set as Home by Israel), /about, /logo-gallery-3. Everything else, including the original home (/archive/home-original) and /homepage-8 and /homepage-9 (kept versions), lives under /archive/ in Framer (kept, not deleted). The nav points only at these pages. The Framer plan has no redirects.
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
