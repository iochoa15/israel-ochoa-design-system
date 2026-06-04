# Israel Ochoa Design System — Agent Instructions

This project has two files that must stay in sync whenever tokens change:
1. `design-tokens-fixed.json` — source of truth for Figma variables (imported via Token Studio)
2. `figma auto frame tool /code.js` — Figma plugin that generates documentation frames

---

## Workflow: Making Token Changes

### Step 1 — Update `design-tokens-fixed.json` with Python

Always use a Python script via Bash. Never use the Edit tool on the JSON directly — the file is 76KB+ and has many near-identical blocks that cause false matches.

```bash
# Always backup first, then transform in place
shutil.copy('design-tokens-fixed.json', 'design-tokens-fixed.backup.json')
with open('design-tokens-fixed.json') as f: data = json.load(f)
# ... make changes ...
with open('design-tokens-fixed.json', 'w') as f: json.dump(data, f, indent=2, ensure_ascii=False)
```

Key paths in the JSON:
- Typography styles: `data['design-system']['typography']['styles']['desktop'|'tablet'|'mobile']['headings'|'body'][token]`
- Button sizes: `data['design-system']['component']['button']['size']['small'|'medium'|'large']`
- Component tokens: `data['design-system']['component']`

Always apply changes to all 3 breakpoints (desktop, tablet, mobile) unless the user says otherwise.

To insert a new token in order (e.g. label-2 after label), rebuild the dict:
```python
new_body = {}
for k, v in body.items():
    new_body[k] = v
    if k == 'label':
        new_body['label-2'] = { ... }
styles[bp]['body'] = new_body
```

### Step 2 — Update `figma auto frame tool /code.js` with Edit tool

Use targeted `Edit` calls with enough surrounding context to be unique. If two blocks are identical, include the line above or below to disambiguate.

**Typography scale arrays** — located around lines 290–365, structured as:
```js
Desktop: [
  { section: "Headings", subsection: "..." },
  { role: "Heading 1", px: 42, lh: 52, fk: "nrBold", fd: "Newsreader Bold", sample: "..." },
  // isAllCaps: true  → sets textCase "UPPER" on the Figma text node
  // ls: 2           → sets letterSpacing 2px on the Figma text node
],
Tablet: [ ... ],
Mobile: [ ... ],
```

Font keys (`fk`) available:
- `nrRegular`, `nrLight`, `nrLightItalic`, `nrItalic`, `nrBold`
- `wxtRegular`, `wxtSemiBold`, `wxtBold`

**Button sizes** — located around line 810:
```js
sizeRow.appendChild(makeBtn("Small",  NK, W, null, padY, padX, fontSize, "wxtBold"));
```

**Adding a new font key:**
1. Add to `var F = { ... }` object
2. Add `tryLoad` + fallback in `loadFonts()`

### Step 3 — Verify

After both files are updated, run a Python verification script to spot-check key values:
```bash
python3 -c "import json; data=json.load(open('design-tokens-fixed.json')); ..."
```
And grep code.js for the changed values.

---

## Token Studio Rules (critical — breaks silent if violated)

- `$value` fields: plain numbers only (no `"16px"` strings), no references (no `{token.path}`), literal values only
- NO `fontStyle` field in typography composites — italic must be encoded in `fontWeight` (e.g. `"Light Italic"`, `"Italic"`)
- ALL CAPS: use `"textCase": "UPPER"` inside `$value` — Token Studio supports this
- Letter spacing: use `"letterSpacing": 2` (number, in px)
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

## Figma Plugin Import

Import via: Plugins → Development → Import plugin from manifest (NOT the Widgets menu).
Manifest must NOT have `"containsWidget"` field.
