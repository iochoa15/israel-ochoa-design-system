# Design Best Practices — Israel Ochoa Design System

Personal reference for designing with Figma, Framer, and Cursor/Claude Code.
Last updated: 2026-06-04

---

## Figma

### Reading a design
- Use `get_design_context` (Figma MCP) with nodeId + fileKey before building anything
- The output is a React+Tailwind reference — adapt to the actual project stack, don't copy verbatim
- Check Code Connect mappings first — if a component is mapped to a codebase component, use that
- Design annotations in the output are designer intent — honor them literally

### Applying variables / tokens
- Always resolve `VARIABLE_ALIAS` chains before applying (loop guard: max depth 10)
- Safe apply pattern: resolve → verify RGB values exist → create baseFill → `setBoundVariableForPaint`
- Apply `textCase: "UPPER"` for ALL CAPS in typography tokens (Token Studio supports this)
- Letter spacing: use number in px, not a string with units
- Figma font names must match exactly what the font picker shows — "Variable" suffix does NOT exist

### Token Studio rules (breaks silently if violated)
- `$value` fields: plain numbers only — no `"16px"` strings
- No references inside `$value` — use literal values (no `{token.path}`)
- No `fontStyle` field in typography composites — encode italic in `fontWeight` (e.g. `"Light Italic"`)
- Correct composite shape:
  ```json
  "$value": {
    "fontFamily": "Newsreader",
    "fontWeight": "Bold",
    "fontSize": 42,
    "lineHeight": 52,
    "textCase": "UPPER",
    "letterSpacing": 2
  }
  ```

### Plugin import
- Import via: Plugins → Development → Import plugin from manifest
- Do NOT use the Widgets menu — triggers `containsWidget` error
- Manifest must NOT have `"containsWidget"` field at all

---

## Framer (via MCP)

### Pre-build checklist
1. Read the Figma reference first (screenshot or design context)
2. Measure exact dimensions — column widths, padding, gap, separator colors
3. Create all named text styles BEFORE building rows/sections
4. Identify highlighted/special rows and their exact background colors

### Text styles
- Create styles via `manageTextStyle` type="create" before referencing them
- Reference in XML: `inlineTextStyle="/DS/Typo/Role"`
- Never inline font properties on individual nodes — always use named styles
- Font selector format: `GF;Newsreader-300`, `GF;Wix Madefor Text-regular`, `GF;Wix Madefor Text-600`
- For breakpoint-specific styles: `/DS/Typo/Tablet/Role` and `/DS/Typo/Mobile/Role`

### Layout rules
- Padding: ALWAYS 4-value `"20px 0px 20px 0px"` — 2-value silently ignored
- Padding set during CREATE may be visually ignored — do a separate UPDATE call to force apply
- Borders don't work: use nested frames (outer = border color, inner = bg color with 2px inset)
- `svg` attribute only works on node creation, not on existing Frame nodes
- Text nodes inside frames default to `position="absolute"` — set parent to `layout="stack"` and text to `position="relative"` to make text flow

### The displacement bug
**What happens:** When you batch-update multiple sibling nodes from their parent context in one call, Framer reorders them — separator frames between rows get displaced.

**Fix:** After any batch update causing displacement, call `updateXmlForNode` on the parent with ALL children listed in the correct order. This reorder call is the only reliable fix.

**Prevention:** Update one node at a time when separator frames must stay between sibling rows.

### Visual hierarchy conventions (this project)
| Element | Value |
|---------|-------|
| Section boundary separator | `rgb(215,212,203)` |
| Between-row separator | `rgb(242,241,239)` |
| Base size highlight (Body Med) | `rgb(255,246,244)` |
| Section label style | `/DS/Typo/Overline` |
| Row meta stack width | 260px |
| Row sample text width | 700px |
| Total row width | 960px |

### Typography row padding
| Row type | Padding |
|----------|---------|
| Display rows | `20px 0px 20px 0px` |
| Heading rows | `16px 0px 16px 0px` |
| Body rows | `12px 0px 12px 0px` |

### What to always verify after building a section
1. Zoom in — check order of all children (separators between rows, not after)
2. Check padding actually rendered (if not, do a separate update with same value)
3. Check `height="fit-content"` on all stack frames (default is 100px)

---

## Cursor / Claude Code

### Token changes workflow
1. Backup: `shutil.copy('design-tokens-fixed.json', 'design-tokens-fixed.backup.json')`
2. Load → modify → verify → write (Python via Bash)
3. Never use Edit tool directly on the JSON — 76KB file has many near-identical blocks
4. Apply changes to all 3 breakpoints (desktop/tablet/mobile) unless told otherwise
5. Use Edit tool for `code.js` changes with enough unique surrounding context

### Memory hygiene
- MEMORY.md stays under 200 lines — it's an index, not a log
- Detail goes in topic files (`process.md`, `best-practices.md`)
- Only write confirmed, stable patterns — not session-specific state
- Update memory when: a pattern is confirmed, a node ID changes, lessons are learned

### What makes outputs match the Figma reference exactly
1. Read the Figma node before building (always)
2. Create text styles first, reference them second
3. Use exact colors/dimensions from the token file, not from memory
4. Match the structural hierarchy — column widths, meta stack lines, section labels
5. Fix displacement bugs immediately before adding more content
