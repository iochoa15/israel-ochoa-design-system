# Workflow · Israel Ochoa design system

How work moves in this project. The agent runs it on its own; Israel doesn't type commands.

**Engine:** Superpowers runs the build phases, with Israel's lean settings from `KIT/08_toolbox/README.md`. This kit adds what Superpowers doesn't: Israel's voice, how to talk to him, logging, case studies, learning.

**Current phase:** Build (homepage-8 polish: hero motion, avatar → nav)

## The loop (for every feature or chunk of work)

| Phase | Superpowers skill | Kit additions |
|---|---|---|
| 1 · Explore | brainstorming | Don't re-ask anything already in `AGENTS.md`. Max four questions at a time |
| 2 · Plan | writing-plans | Show the plan as a short numbered list first. Name the files that will change |
| 3 · Build | executing-plans (default). subagent-driven-development only for big builds, after Israel's yes | Test-first for logic, data, and AI behavior. For visual work, check by looking (screenshot or playwright-cli) |
| 4 · Review | requesting-code-review, verification-before-completion | Also check `stack-and-brand.md` (tokens, type, colors) and, for AI features, the failure and uncertainty states |
| 5 · Log and learn | (kit) | Append to `CHANGELOG.md` and `decisions.md`. Offer one learning moment and a quick quiz (KIT recipe E) |

**When stuck on a bug:** Superpowers systematic-debugging. If it fails twice, revert to the last working version and tell Israel.

## Picks to pull in when they fit (from `KIT/08_toolbox/`)
- UI, components, design system, accessibility → `frontend-ui-engineering`
- Using a framework or library feature → `source-driven-development`
- A design question that needs a quick answer → `prototype`
- Slow app → `performance-optimization`
- Getting ready to launch → `shipping-and-launch`, then (at the very end, optional, costly) the Claude Security scan

## Git habits (explain these to Israel the first time)
- Save points ("commits") after each working task, with a plain-English message.
- Never push, merge, deploy, or publish without asking.

## Project-specific notes
- **Framer:** edit through the `/framer` skill (Framer's local agent). Israel publishes. Check motion on the live page with the headless scripts (puppeteer-core + local Chrome) instead of assuming.
- **Motion fixes:** build a local test page first when possible, compare old vs new with numbers, then upload.
- **Token changes:** follow `CLAUDE.md` (Python for `design-tokens-fixed.json`, then the Figma plugin `figma auto frame tool /code.js`).
- **Versions:** new ideas go on a new page; kept versions are never edited.
